import { Button } from "@/components/ui/button";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Play } from "lucide-react";
import { FileExplorer } from "./FileExplorer";
import { EditorPanel } from "./EditorPanel";
import { ConsolePanel } from "./ConsolePanel";
import { useCodeEditor } from "@/hooks/useCodeEditor";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectGroup,
    SelectLabel,
    SelectValue,
} from "@/components/ui/select";

export function CodeEditor() {
    const {
        files,
        currentFile,
        output,
        editorMounted,
        setEditorMounted,
        handleEditorChange,
        runCode,
        addFile,
        addFileDialogOpen,
        setCurrentFile,
        renameFile,
        treeElements,
        confirmAddFile,
        setAddFileDialogOpen,
        socketStatus,
        sendInput,
        deleteFile,
        duplicateFile,
        broadcastCursor,
        otherCursors,
        handleEditorLineChange,
        broadcastInputChange,
        input,
        setInput
    } = useCodeEditor();

    return (
        <div className="h-screen bg-background text-foreground flex flex-col">
            <div className="p-2 border-b flex items-center justify-between">
                <h1 className="text-xl font-bold">Code Editor</h1>
                <Button onClick={runCode} size="sm" variant="default">
                    <Play className="mr-2 h-4 w-4" /> Run
                </Button>
            </div>
            <NewFileDialog
                isOpen={addFileDialogOpen}
                setIsOpen={setAddFileDialogOpen}
                submitAddFile={confirmAddFile}
            />
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* File Explorer Panel */}
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <FileExplorer
                        treeElements={treeElements}
                        addFile={addFile}
                        setCurrentFile={setCurrentFile}
                        files={files}
                        renameFile={renameFile}
                        deleteFile={deleteFile}
                        duplicateFile={duplicateFile}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Editor and Console Panel */}
                <ResizablePanel defaultSize={80}>
                    <ResizablePanelGroup direction="vertical">
                        {/* Editor Panel */}
                        <ResizablePanel defaultSize={70}>
                            <EditorPanel
                                currentFile={currentFile}
                                files={files}
                                handleEditorChange={handleEditorChange}
                                setEditorMounted={setEditorMounted}
                                broadcastCursor={broadcastCursor}
                                otherCursors={otherCursors}
                                handleEditorLineChange={handleEditorLineChange}
                            />
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Console Panel */}
                        <ResizablePanel defaultSize={30}>
                            <ConsolePanel output={output} socketStatus={socketStatus} sendInput={sendInput} input={input} setInput={setInput} broadcastInputChange={broadcastInputChange} />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
function NewFileDialog({ isOpen, setIsOpen, submitAddFile }) {
    const [inputtedName, setInputtedName] = useState("");
    const [fileExtension, setFileExtension] = useState(".py");

    // Filter input to replace spaces with hyphens
    // Consider adding more robust filtering for invalid filename characters if needed
    const modifyName = (e) => {
        const filteredName = e.target.value.replaceAll(" ", "-");
        // Potential: Add more filtering here (e.g., remove special characters)
        // const filteredName = e.target.value.replace(/[^a-zA-Z0-9-_]/g, '');
        setInputtedName(filteredName);
    };

    const handleCancel = () => {
        setInputtedName("");
        setFileExtension(".py");
        handleClose();
    };

    const handleClose = () => {
        setInputtedName("");
        setFileExtension(".py");
        setIsOpen(false);
    };

    const handleSubmit = () => {
        if (!inputtedName.trim()) {
            console.error("File name cannot be empty");
            return;
        }
        const fullFileName = `${inputtedName.trim()}${fileExtension}`;
        submitAddFile(fullFileName);
        setInputtedName("");
        setFileExtension(".py");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };

    return (
        // Use the isOpen prop to control the dialog
        // onOpenChange is often used with shadcn/ui Dialog for built-in close triggers
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New file name</DialogTitle>
                    <DialogDescription>
                        Enter a name for your new file. Spaces will be replaced
                        with hyphens.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {" "}
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            id="fileName"
                            value={inputtedName}
                            onChange={modifyName}
                            onKeyDown={handleKeyDown}
                            placeholder="File name"
                            className="flex-grow" // Allow input to take available space
                        />
                        <Select
                            value={fileExtension}
                            onValueChange={setFileExtension}
                        >
                            <SelectTrigger className="w-[90px] flex-shrink-0">
                                <SelectValue placeholder="Ext" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value=".py">.py</SelectItem>
                                    <SelectItem value=".txt">.txt</SelectItem>
                                    <SelectItem value=".csv">.csv</SelectItem>
                                    <SelectItem value=".json">.json</SelectItem>
                                    <SelectItem value=".yml">.yml</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!inputtedName.trim()}
                    >
                        Create File
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
