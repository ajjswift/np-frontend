import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import crypto from "crypto";


export function useCodeEditor() {
  const [files, setFiles] = useState({});
  const [currentFile, setCurrentFile] = useState("main.py");
  const [output, setOutput] = useState("");
  const [editorMounted, setEditorMounted] = useState(false);
  const [addFileDialogOpen, setAddFileDialogOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [previousInput, setPreviousInput] = useState(undefined);
  const [otherCursors, setOtherCursors] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const router = useRouter();
  const params = useParams();
  const environmentId = params.environmentId;
  // WebSocket connection setup
  useEffect(() => {
    socketRef.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    socketRef.current.addEventListener("open", () => {
      setSocketStatus("connected");
      setOutput((prev) =>
        `${prev}\n[${new Date().toLocaleString("en-gb")}] 🔌 Connected to server`
      );
      // Request current files for this environment
      socketRef.current.send(
        JSON.stringify({
          event: "getFiles",
          data: { environmentId },
        })
      );
    });

    socketRef.current.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "output") {
          if (previousInput === undefined || data.data.output !== previousInput) {
            setOutput((prev) => `${prev}\n${data.data.output}`);
          }
        } else if (data.event === "files") {
          // Update files state with files from backend
          setFiles(data.data.files);
        } else if (data.event === "runStatus") {
          // handle runStatus, is optional though ig
        } else if (data.event === "exit") {
          setOutput((prev) =>
            `${prev}\n[${new Date().toLocaleString("en-gb")}] 🛑 Process exited with code ${data.data.exitCode}`
          );
        } else if (data.event === "error") {
          setOutput((prev) =>
            `${prev}\n[${new Date().toLocaleString("en-gb")}] ❌ Error: ${data.data.message || data.data}`
          );
        } else if (data.event === "movedCursor") {
          const { id, pos, file } = data.data;
          setOtherCursors((prevCursors) => {
            // Check if cursor with this id already exists
            const existing = prevCursors.find((c) => c.id === id);
            if (existing) {
              // Update the existing cursor's position and file
              return prevCursors.map((c) =>
                c.id === id
                  ? { ...c, pos, file }
                  : c
              );
            } else {
              // Optionally assign a color or username here
              // For now, assign a random color
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
        }
        else if (data.event === "deleteCursor") {
          const { sessionId } = data.data;

          setOtherCursors((prev) => prev.filter(cursor => cursor.id !== sessionId));
        }
        else if (data.event === "lineUpdated") {
          const { fileName, op, lineNumber, lineContent } = data.data;
          
          setFiles((prev) => {
            let prevContent = prev[fileName] || "";
            let lines = prevContent.split("\n");
            
            if (op === "insert") {
              lines.splice(lineNumber, 0, lineContent);
            } else if (op === "delete") {
              lines.splice(lineNumber, 1);
            } else if (op === "replace") {
              if (lineNumber >= 0 && lineNumber < lines.length) {
                lines[lineNumber] = lineContent;
              }
            }
            
            return { ...prev, [fileName]: lines.join("\n") };
          });
        } else if (data.event === "inputChanged") {
          const {input} = data.data;
          setInput(input);
        } else if (data.event === "runRan") {
          const currentTimestamp = Date.now();
        setOutput(
          `[${new Date(currentTimestamp).toLocaleString("en-gb")}] 🚀 Running code...`
        );
        }
        
        
        
      } catch (e) {
        setOutput((prev) =>
          `${prev}\n[${new Date().toLocaleString("en-gb")}] Received: ${event.data}`
        );
      }
    });

    socketRef.current.addEventListener("close", () => {
      setSocketStatus("disconnected");
      setOutput((prev) =>
        `${prev}\n[${new Date().toLocaleString("en-gb")}] ⚠️ Disconnected from server`
      );
    });

    socketRef.current.addEventListener("error", (error) => {
      setSocketStatus("error");
      setOutput((prev) =>
        `${prev}\n[${new Date().toLocaleString("en-gb")}] ❌ WebSocket error: ${error.message}`
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
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
    socketRef.current.send(JSON.stringify(message));
    setFiles((prev) => ({ ...prev, [currentFile]: value }));
  };

  const handleEditorLineChange = (op, lineNumber, lineContent, count) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: "diffLine",
          data: {
            environmentId,
            fileName: currentFile,
            op,           // "insert", "delete", or "replace"
            lineNumber,
            lineContent,  // can be string or array of strings
            count        // number of lines to delete (for delete operations)
          },
        })
      );
    }
  
    // Update local state optimistically
    setFiles((prev) => {
      let prevContent = prev[currentFile] || "";
      let lines = prevContent.split("\n");
      
      if (op === "insert") {
        // Handle both single line and array of lines
        const linesToInsert = Array.isArray(lineContent) ? lineContent : [lineContent];
        lines.splice(lineNumber, 0, ...linesToInsert);
      } else if (op === "delete") {
        // Delete specified number of lines (default to 1)
        const deleteCount = count || 1;
        lines.splice(lineNumber, deleteCount);
      } else if (op === "replace") {
        // Handle both single line and array of lines for replacement
        const linesToReplace = Array.isArray(lineContent) ? lineContent : [lineContent];
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
  

  
  

  const runCode = () => {
    try {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const hash = crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex');
        const message = {
          event: "run",
          data: {
            fileNames: Object.keys(files),
            environmentId,
            hash,
            files: files
          },
        };
        socketRef.current.send(JSON.stringify(message));
        const currentTimestamp = Date.now();
        setOutput(
          `[${new Date(currentTimestamp).toLocaleString("en-gb")}] 🚀 Running code...`
        );
      } else {
        setOutput(
          `[${new Date().toLocaleString("en-gb")}] ❌ WebSocket not connected`
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
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        event: "cursorMove",
        data: {
          file: currentFile,
          environmentId,
          ...cursorObject
        }
      }
      socketRef.current.send(JSON.stringify(message));
    }
    else {
      if ((cursorObject.ch + cursorObject.line) !== 0) {
        console.error("Socket not connected.")
      }
      
    }
  }

  const renameFile = (oldName, newName) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
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
      alert('Socket not connected')
    }
  }

  const deleteFile = (fileName) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        event: "deleteFile",
        data: {
          fileName,
          environmentId,
        },
      };
      socketRef.current.send(JSON.stringify(message));
    } else {
      alert('Socket not connected')
    }
  }


  const duplicateFile = (fileName) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        event: "duplicateFile",
        data: {
          fileName,
          environmentId,
        },
      };
      socketRef.current.send(JSON.stringify(message));
    } else {
      alert('Socket not connected')
    }
  }

  const broadcastInputChange = (input) => {
    const message = {
      event: "inputChange",
      data: {
        input: input
      }
    }
    socketRef.current.send(JSON.stringify(message));
  }


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
          data: { input }
        })
      );
      // Optionally, show the input in the output panel
      broadcastInputChange('');
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
    setInput
  };
}
