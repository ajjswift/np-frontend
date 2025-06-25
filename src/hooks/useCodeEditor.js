import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

// Browser-compatible SHA-256 hash function
function sha256(str) {
    return window.crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(str))
        .then((buf) =>
            Array.from(new Uint8Array(buf))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
        );
}

export function useCodeEditor() {
    const [files, setFiles] = useState({});
    const [currentFile, setCurrentFile] = useState("main.py");
    const [output, setOutput] = useState("");
    const [editorMounted, setEditorMounted] = useState(false);
    const [addFileDialogOpen, setAddFileDialogOpen] = useState(false);
    const [socketStatus, setSocketStatus] = useState("disconnected");
    const [previousInput, setPreviousInput] = useState(undefined);
    const [otherCursors, setOtherCursors] = useState([]);
    const [input, setInput] = useState("");
    const [isTeacher, setIsTeacher] = useState(undefined); // <--- NEW
    const socketRef = useRef(null);
    const reconnectTimeout = useRef(null);
    const reconnectAttempts = useRef(0);
    const connecting = useRef(false);

    const router = useRouter();
    const params = useParams();
    const environmentId = params?.environmentId;

    const MAX_RECONNECT_ATTEMPTS = 10;
    const RECONNECT_INTERVAL = 3000;

    // Fetch teacher status on mount
    useEffect(() => {
        let cancelled = false;
        async function checkTeacher() {
            try {
                const res = await fetch("/api/auth/amITeacher");
                if (!res.ok) throw new Error("Not authenticated");
                const data = await res.json();
                if (!cancelled) setIsTeacher(!!data.isTeacher);
            } catch (e) {
                if (!cancelled) setIsTeacher(false);
            }
        }
        checkTeacher();
        return () => {
            cancelled = true;
        };
    }, []);

    // Clean up function
    const cleanupSocket = () => {
        if (socketRef.current) {
            socketRef.current.onopen = null;
            socketRef.current.onmessage = null;
            socketRef.current.onclose = null;
            socketRef.current.onerror = null;
            socketRef.current.close();
            socketRef.current = null;
        }
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }
        connecting.current = false;
    };

    // WebSocket connection setup
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!environmentId || !process.env.NEXT_PUBLIC_WS_URL) return;
        if (typeof window.WebSocket === "undefined") return;

        cleanupSocket();

        let cancelled = false;

        const connectWebSocket = () => {
            if (connecting.current) return;
            connecting.current = true;

            setSocketStatus("connecting");

            if (
                typeof window === "undefined" ||
                typeof window.WebSocket === "undefined"
            ) {
                setSocketStatus("error");
                setOutput(
                    (prev) =>
                        `${prev}\n[${new Date().toLocaleString(
                            "en-gb"
                        )}] ❌ WebSocket not available`
                );
                return;
            }

            const ws = new window.WebSocket(process.env.NEXT_PUBLIC_WS_URL);
            socketRef.current = ws;

            ws.onopen = () => {
                if (cancelled) return;
                setSocketStatus("connected");
                setOutput(
                    (prev) =>
                        `${prev}\n[${new Date().toLocaleString(
                            "en-gb"
                        )}] 🔌 Connected to server`
                );
                reconnectAttempts.current = 0;
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                    reconnectTimeout.current = null;
                }
                ws.send(
                    JSON.stringify({
                        event: "getFiles",
                        data: { environmentId },
                    })
                );
            };

            ws.onmessage = (event) => {
                if (cancelled) return;
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === "output") {
                        if (
                            previousInput === undefined ||
                            data.data.output !== previousInput
                        ) {
                            setOutput((prev) => `${prev}\n${data.data.output}`);
                        }
                    } else if (data.event === "files") {
                        setFiles(data.data.files);
                    } else if (data.event === "runStatus") {
                        // handle runStatus, is optional though ig
                    } else if (data.event === "exit") {
                        setOutput(
                            (prev) =>
                                `${prev}\n[${new Date().toLocaleString(
                                    "en-gb"
                                )}] 🛑 Process exited with code ${
                                    data.data.exitCode
                                }`
                        );
                    } else if (data.event === "error") {
                        setOutput(
                            (prev) =>
                                `${prev}\n[${new Date().toLocaleString(
                                    "en-gb"
                                )}] ❌ Error: ${data.data.message || data.data}`
                        );
                    } else if (data.event === "movedCursor") {
                        const { id, pos, file } = data.data;
                        setOtherCursors((prevCursors) => {
                            const existing = prevCursors.find(
                                (c) => c.id === id
                            );
                            if (existing) {
                                return prevCursors.map((c) =>
                                    c.id === id ? { ...c, pos, file } : c
                                );
                            } else {
                                const randomColor =
                                    "#" +
                                    Math.floor(Math.random() * 16777215)
                                        .toString(16)
                                        .padStart(6, "0");
                                return [
                                    ...prevCursors,
                                    {
                                        id,
                                        pos,
                                        file,
                                        color: randomColor,
                                    },
                                ];
                            }
                        });
                    } else if (data.event === "deleteCursor") {
                        const { sessionId } = data.data;
                        setOtherCursors((prev) =>
                            prev.filter((cursor) => cursor.id !== sessionId)
                        );
                    } else if (data.event === "lineUpdated") {
                        const { fileName, op, lineNumber, lineContent } =
                            data.data;
                        setFiles((prev) => {
                            let prevContent = prev[fileName] || "";
                            let lines = prevContent.split("\n");
                            if (op === "insert") {
                                lines.splice(lineNumber, 0, lineContent);
                            } else if (op === "delete") {
                                lines.splice(lineNumber, 1);
                            } else if (op === "replace") {
                                if (
                                    lineNumber >= 0 &&
                                    lineNumber < lines.length
                                ) {
                                    lines[lineNumber] = lineContent;
                                }
                            }
                            return { ...prev, [fileName]: lines.join("\n") };
                        });
                    } else if (data.event === "inputChanged") {
                        const { input } = data.data;
                        setInput(input);
                    } else if (data.event === "runRan") {
                        const currentTimestamp = Date.now();
                        setOutput(
                            `[${new Date(currentTimestamp).toLocaleString(
                                "en-gb"
                            )}] 🚀 Running code...`
                        );
                    }
                } catch (e) {
                    setOutput(
                        (prev) =>
                            `${prev}\n[${new Date().toLocaleString(
                                "en-gb"
                            )}] Received: ${event.data}`
                    );
                }
            };

            ws.onclose = () => {
                if (cancelled) return;
                setSocketStatus("disconnected");
                setOutput(
                    (prev) =>
                        `${prev}\n[${new Date().toLocaleString(
                            "en-gb"
                        )}] ⚠️ Disconnected from server`
                );
                if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts.current++;
                    setOutput(
                        (prev) =>
                            `${prev}\n[${new Date().toLocaleString(
                                "en-gb"
                            )}] Attempting to reconnect (attempt ${
                                reconnectAttempts.current
                            }/${MAX_RECONNECT_ATTEMPTS})...`
                    );
                    reconnectTimeout.current = setTimeout(
                        connectWebSocket,
                        RECONNECT_INTERVAL
                    );
                } else {
                    setOutput(
                        (prev) =>
                            `${prev}\n[${new Date().toLocaleString(
                                "en-gb"
                            )}] ❌ Max reconnection attempts reached. Please refresh the page.`
                    );
                }
            };

            ws.onerror = (error) => {
                if (cancelled) return;
                setSocketStatus("error");
                setOutput(
                    (prev) =>
                        `${prev}\n[${new Date().toLocaleString(
                            "en-gb"
                        )}] ❌ WebSocket error`
                );
            };
        };

        const debounceTimeout = setTimeout(connectWebSocket, 100);

        return () => {
            cancelled = true;
            cleanupSocket();
            clearTimeout(debounceTimeout);
        };
    }, [environmentId]);

    const handleEditorChange = (value) => {
        let message = {
            event: "updateFile",
            data: {
                environmentId,
                fileName: currentFile,
                file: value,
            },
        };
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            socketRef.current.send(JSON.stringify(message));
        }
        setFiles((prev) => ({ ...prev, [currentFile]: value }));
    };

    const handleEditorLineChange = (op, lineNumber, lineContent, count) => {
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            socketRef.current.send(
                JSON.stringify({
                    event: "diffLine",
                    data: {
                        environmentId,
                        fileName: currentFile,
                        op, // "insert", "delete", or "replace"
                        lineNumber,
                        lineContent, // can be string or array of strings
                        count, // number of lines to delete (for delete operations)
                    },
                })
            );
        }

        // Update local state optimistically
        setFiles((prev) => {
            let prevContent = prev[currentFile] || "";
            let lines = prevContent.split("\n");

            if (op === "insert") {
                const linesToInsert = Array.isArray(lineContent)
                    ? lineContent
                    : [lineContent];
                lines.splice(lineNumber, 0, ...linesToInsert);
            } else if (op === "delete") {
                const deleteCount = count || 1;
                lines.splice(lineNumber, deleteCount);
            } else if (op === "replace") {
                const linesToReplace = Array.isArray(lineContent)
                    ? lineContent
                    : [lineContent];
                for (let i = 0; i < linesToReplace.length; i++) {
                    if (lineNumber + i < lines.length) {
                        lines[lineNumber + i] = linesToReplace[i];
                    } else {
                        lines.push(linesToReplace[i]);
                    }
                }
            }

            return { ...prev, [currentFile]: lines.join("\n") };
        });
    };

    const runCode = async () => {
        try {
            if (
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN
            ) {
                const hash = await sha256(JSON.stringify(files));
                const message = {
                    event: "run",
                    data: {
                        fileNames: Object.keys(files),
                        environmentId,
                        hash,
                        files: files,
                    },
                };
                socketRef.current.send(JSON.stringify(message));
                const currentTimestamp = Date.now();
                setOutput(
                    `[${new Date(currentTimestamp).toLocaleString(
                        "en-gb"
                    )}] 🚀 Running code...`
                );
            } else {
                setOutput(
                    `[${new Date().toLocaleString(
                        "en-gb"
                    )}] ❌ WebSocket not connected`
                );
            }
        } catch (e) {
            setOutput("❌ " + e.message);
        }
    };

    const addFile = () => {
        setAddFileDialogOpen(true);
    };

    const broadcastCursor = (cursorObject) => {
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            const message = {
                event: "cursorMove",
                data: {
                    file: currentFile,
                    environmentId,
                    ...cursorObject,
                },
            };
            socketRef.current.send(JSON.stringify(message));
        } else {
            if (cursorObject.ch + cursorObject.line !== 0) {
                console.error("Socket not connected.");
            }
        }
    };

    const renameFile = (oldName, newName) => {
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            const message = {
                event: "renameFile",
                data: {
                    oldName,
                    newName,
                    environmentId,
                },
            };
            socketRef.current.send(JSON.stringify(message));
        } else {
            alert("Socket not connected");
        }
    };

    const deleteFile = (fileName) => {
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            const message = {
                event: "deleteFile",
                data: {
                    fileName,
                    environmentId,
                },
            };
            socketRef.current.send(JSON.stringify(message));
        } else {
            alert("Socket not connected");
        }
    };

    const duplicateFile = (fileName) => {
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            const message = {
                event: "duplicateFile",
                data: {
                    fileName,
                    environmentId,
                },
            };
            socketRef.current.send(JSON.stringify(message));
        } else {
            alert("Socket not connected");
        }
    };

    const broadcastInputChange = (input) => {
        const message = {
            event: "inputChange",
            data: {
                input: input,
            },
        };
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            socketRef.current.send(JSON.stringify(message));
        }
    };

    const confirmAddFile = (name) => {
        setAddFileDialogOpen(false);
        if (name && !files[name]) {
            setFiles((prev) => ({ ...prev, [name]: "" }));
            setCurrentFile(name);
        }
    };

    const fileElements = Object.keys(files).map((filename, index) => ({
        id: `file-${index}`,
        isSelectable: true,
        name: filename,
    }));

    const sendInput = (input) => {
        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN &&
            input.trim() !== ""
        ) {
            setPreviousInput(input);
            socketRef.current.send(
                JSON.stringify({
                    event: "input",
                    data: { input },
                })
            );
            broadcastInputChange("");
        }
    };

    const treeElements = [
        {
            id: "root",
            isSelectable: true,
            name: "Project",
            children: fileElements,
        },
    ];

    const setAddFileDialogOpenM = (m) => {
        setAddFileDialogOpen(m);
    };

    return {
        files,
        currentFile,
        output,
        editorMounted,
        socketStatus,
        setEditorMounted,
        handleEditorChange,
        runCode,
        addFile,
        addFileDialogOpen,
        setCurrentFile,
        treeElements,
        confirmAddFile,
        sendInput,
        renameFile,
        deleteFile,
        duplicateFile,
        otherCursors,
        setAddFileDialogOpen: setAddFileDialogOpenM,
        broadcastCursor,
        handleEditorLineChange,
        broadcastInputChange,
        input,
        setInput,
        isTeacher,
    };
}
