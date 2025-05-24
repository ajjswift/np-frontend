import dynamic from "next/dynamic";
import { FileCode } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { alexCodeMirrorTheme } from "./themes";
import { EditorView } from "@codemirror/view";

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false }
);

export function EditorPanel({
  currentFile,
  files,
  handleEditorChange,
  setEditorMounted,
  broadcastCursor,
  otherCursors,
  handleEditorLineChange,
}) {
  const [extensions, setExtensions] = useState([]);
  const [theme, setTheme] = useState(null);
  const [editorValue, setEditorValue] = useState("");
  const editorViewRef = useRef(null);
  const containerRef = useRef(null);
  const previousFileRef = useRef(currentFile);
  const [userCursor, setUserCursor] = useState({ line: 0, ch: 0 });
  

  // Update editor value when currentFile changes or files are updated
  useEffect(() => {
    if (files[currentFile] !== undefined) {
      setEditorValue(files[currentFile]);
    }
    previousFileRef.current = currentFile;
  }, [currentFile, files]);


  

  // Load language support based on file extension
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        // Load theme
        const vscodeDark = await import("@uiw/codemirror-theme-vscode").then(
          (mod) => mod.vscodeDark
        );
        setTheme(vscodeDark);

        let newExtensions = [];

        // Determine language based on file extension
        if (currentFile.endsWith(".py")) {
          // Load Python language support
          const pythonLang = await import("@codemirror/lang-python");
          newExtensions.push(pythonLang.python());
          
          // We'll use the built-in autocompletion that comes with CodeMirror's basicSetup
          // rather than trying to add a custom one that might cause version conflicts
        } else if (currentFile.endsWith(".js") || currentFile.endsWith(".jsx")) {
          // JavaScript/JSX support
          const jsLang = await import("@codemirror/lang-javascript");
          newExtensions.push(jsLang.javascript({ jsx: true }));
        }
        // For text files, we don't need to add any language extensions

        const cursorListener = EditorView.updateListener.of((update) => {
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const doc = update.state.doc;
            const line = doc.lineAt(pos);
            setUserCursor({
              line: line.number - 1,
              ch: pos - line.from,
            });
          }
        });
        newExtensions.push(cursorListener);


        setExtensions(newExtensions);
        setEditorMounted(true);
      } catch (error) {
        console.error("Error loading editor dependencies:", error);
      }
    };

    loadDependencies();
  }, [currentFile, setEditorMounted]);

  const modifyText = (value, viewUpdate) => {
    const changes = viewUpdate.changes;
    const oldDoc = viewUpdate.startState.doc;
    const newDoc = viewUpdate.state.doc;
  
    changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
      // Get the start and end line numbers in the old and new docs
      const oldStartLine = oldDoc.lineAt(fromA).number - 1;
      const oldEndLine = oldDoc.lineAt(toA).number - 1;
      const newStartLine = newDoc.lineAt(fromB).number - 1;
      const newEndLine = newDoc.lineAt(toB).number - 1;
  
      // Get the affected lines in the old and new docs
      const oldLines = [];
      for (let i = oldStartLine; i <= oldEndLine; i++) {
        if (i >= 0 && i < oldDoc.lines) {
          oldLines.push(oldDoc.line(i + 1).text);
        }
      }
      const newLines = [];
      for (let i = newStartLine; i <= newEndLine; i++) {
        if (i >= 0 && i < newDoc.lines) {
          newLines.push(newDoc.line(i + 1).text);
        }
      }
  
      // Calculate the number of lines inserted/deleted/replaced
      const minLen = Math.min(oldLines.length, newLines.length);
  
      // Replace lines that exist in both old and new
      for (let i = 0; i < minLen; i++) {
        if (oldLines[i] !== newLines[i]) {
          handleEditorLineChange("replace", oldStartLine + i, newLines[i]);
        }
      }
  
      // Insert new lines
      if (newLines.length > oldLines.length) {
        for (let i = oldLines.length; i < newLines.length; i++) {
          handleEditorLineChange("insert", oldStartLine + i, newLines[i]);
        }
      }
  
      // Delete old lines
      if (oldLines.length > newLines.length) {
        for (let i = newLines.length; i < oldLines.length; i++) {
          handleEditorLineChange("delete", oldStartLine + newLines.length, undefined);
        }
      }
    });
  };
  
  

  useEffect(() => {
    // This will run every time the user's cursor position changes
    broadcastCursor(userCursor);
  }, [userCursor]);

  // Function to handle editor initialization
  const handleEditorInit = (view) => {
    editorViewRef.current = view;
    renderCursors();
  };

  const getOffsetFromLineCh = (doc, line, ch) => {
    const lineCount = doc.lines;
    const safeLine = Math.max(0, Math.min(line, lineCount - 1));
    const lineHandle = doc.line(safeLine + 1); // 1-based
    const safeCh = Math.max(0, Math.min(ch, lineHandle.length));
    return lineHandle.from + safeCh;
  };

  // Function to render cursors
  const renderCursors = () => {
    if (!editorViewRef.current || !containerRef.current) return;

    // Remove existing cursor elements
    const existingCursors =
      containerRef.current.querySelectorAll(".remote-cursor");
    existingCursors.forEach((el) => el.remove());

    // Get the editor DOM element
    const editorElement = containerRef.current.querySelector(".cm-editor");
    if (!editorElement) return;

    const view = editorViewRef.current;
    const doc = view.state.doc;

    otherCursors.forEach((cursor) => {
      try {
        if (cursor.file !== currentFile) {
          return;
        }
        // Convert line/ch to offset
        const offset = getOffsetFromLineCh(
          doc,
          cursor.pos.line,
          cursor.pos.ch
        );
        // Get coordinates for the offset
        const coords = view.coordsAtPos(offset);

        if (!coords) return; // If not visible, skip

        // Create cursor element
        const cursorElement = document.createElement("div");
        cursorElement.className = "remote-cursor";
        cursorElement.style.position = "absolute";
        cursorElement.style.width = "2px";
        cursorElement.style.height = `${coords.bottom - coords.top}px`;
        cursorElement.style.backgroundColor = cursor.color;
        cursorElement.style.zIndex = "10";
        cursorElement.style.left = `${
          coords.left - editorElement.getBoundingClientRect().left
        }px`;
        cursorElement.style.top = `${
          coords.top - editorElement.getBoundingClientRect().top
        }px`;
        /* 
        // Create label element
        const labelElement = document.createElement("div");
        labelElement.className = "remote-cursor-label";
        labelElement.textContent = cursor.username;
        labelElement.style.position = "absolute";
        labelElement.style.top = "-18px";
        labelElement.style.left = "0";
        labelElement.style.backgroundColor = cursor.color;
        labelElement.style.color = "#fff";
        labelElement.style.padding = "2px 4px";
        labelElement.style.borderRadius = "2px";
        labelElement.style.fontSize = "10px";
        labelElement.style.whiteSpace = "nowrap";

        cursorElement.appendChild(labelElement); */

        editorElement.appendChild(cursorElement);
      } catch (error) {
        console.error("Error rendering cursor:", error);
      }
    });
  };

  // Re-render cursors when they change or editor mounts
  useEffect(() => {
    renderCursors();
  }, [otherCursors, theme, extensions, currentFile]);

  if (!theme) {
    return (
      <div className="h-full flex items-center justify-center">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="h-full border-b">
      <div className="border-b px-3 py-1.5 text-sm text-muted-foreground flex items-center">
        <FileCode className="h-4 w-4 mr-2" />
        {currentFile}
      </div>
      <div
        ref={containerRef}
        style={{
          height: "calc(100% - 32px)",
          backgroundColor: "#1b1e28",
          overflow: "auto",
          position: "relative",
        }}
      >
        <CodeMirror
          key={currentFile} // Force re-render when file changes
          value={editorValue}
          height="100%"
          theme={alexCodeMirrorTheme}
          extensions={extensions}
          onChange={modifyText}
          onCreateEditor={handleEditorInit}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true, // This enables the built-in autocompletion
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
    </div>
  );
}
