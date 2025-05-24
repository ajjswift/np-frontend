import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { File, Folder, Tree } from "@/components/magicui/file-tree";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFileCode,
  faFileAlt,
  faFileImage,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileArchive,
  faFileVideo,
  faFileAudio,
  faFolder,
  faFolderPlus,
  faFileMedical,
  faPen,
  faCopy,
  faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";

export function FileExplorer({
  treeElements,
  addFile,
  setCurrentFile,
  files,
  renameFile,
  deleteFile,
  duplicateFile,
}) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newName, setNewName] = useState("");
  
  // Store the current file to restore focus after dialog closes
  const currentFileRef = useRef(null);
  
  // Save the current file before opening any dialog
  const saveCurrentFile = (filename) => {
    currentFileRef.current = filename;
  };
  
  // Restore focus to the current file after dialog closes
  useEffect(() => {
    if (!showDeleteDialog && !showRenameDialog && currentFileRef.current) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        setCurrentFile(currentFileRef.current);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showDeleteDialog, showRenameDialog, setCurrentFile]);

  const handleRename = () => {
    if (newName && selectedFile) {
      renameFile(selectedFile, newName);
      setShowRenameDialog(false);
      setNewName("");
    }
  };

  const openDeleteDialog = (filename) => {
    saveCurrentFile(filename);
    setSelectedFile(filename);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (selectedFile) {
      deleteFile(selectedFile);
      setShowDeleteDialog(false);
      setSelectedFile(null);
    }
  };

  const handleDuplicate = (filename) => {
    duplicateFile(filename);
  };

  const handleAddFile = () => {
    if (newFileName) {
      addFile(newFileName);
      setShowNewFileDialog(false);
      setNewFileName("");
    }
  };

  const openRenameDialog = (filename) => {
    saveCurrentFile(filename);
    setSelectedFile(filename);
    setNewName(filename);
    setShowRenameDialog(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold">Files</h3>
        <div className="flex gap-1">
          <Button
            onClick={addFile}
            size="icon"
            variant="ghost"
            title="New File"
          >
            <FontAwesomeIcon icon={faFileMedical} className="h-4 w-4" />
          </Button>
          
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <Tree
          className="overflow-hidden rounded-md bg-background p-2"
          elements={treeElements}
          initialExpandedItems={["root"]}
        >
          <Folder element="Project" value="root">
            {Object.keys(files).map((filename, index) => (
              <ContextMenu key={`file-${index}`}>
                <ContextMenuTrigger>
                  <File
                    value={`file-${index}`}
                    element={filename}
                    onClick={() => setCurrentFile(filename)}
                    fileIcon={getFileIcon(filename)}
                    filename={filename}
                  >
                    <p>{filename}</p>
                  </File>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem
                    onClick={() => setCurrentFile(filename)}
                    className="cursor-pointer"
                  >
                    Open
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => openRenameDialog(filename)}
                    className="cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faPen} className="h-4 w-4 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleDuplicate(filename)}
                    className="cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faCopy} className="h-4 w-4 mr-2" />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => openDeleteDialog(filename)}
                    className="text-red-500 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </Folder>
        </Tree>
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog 
        open={showRenameDialog} 
        onOpenChange={(open) => {
          setShowRenameDialog(open);
          if (!open && currentFileRef.current) {
            // Restore focus when dialog closes
            setCurrentFile(currentFileRef.current);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter a new name for {selectedFile}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={showDeleteDialog} 
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open && currentFileRef.current) {
            // Restore focus when dialog closes
            setCurrentFile(currentFileRef.current);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{selectedFile}</span>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    
      
    </div>
  );
}

// Helper function to determine file icon based on extension
function getFileIcon(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  
  // Return FontAwesome icon based on file extension
  switch (extension) {
    case 'py':
      return () => <FontAwesomeIcon icon={faFileCode} className="h-4 w-4 text-blue-500" />;
    case 'js':
    case 'jsx':
      return () => <FontAwesomeIcon icon={faFileJs} className="h-4 w-4 text-yellow-500" />;
    case 'html':
      return () => <FontAwesomeIcon icon={faFileCode} className="h-4 w-4 text-orange-500" />;
    case 'css':
      return () => <FontAwesomeIcon icon={faFileCss} className="h-4 w-4 text-blue-400" />;
    case 'json':
      return () => <FontAwesomeIcon icon={faFileCode} className="h-4 w-4 text-yellow-300" />;
    case 'txt':
      return () => <FontAwesomeIcon icon={faFileAlt} className="h-4 w-4 text-gray-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return () => <FontAwesomeIcon icon={faFileImage} className="h-4 w-4 text-green-500" />;
    case 'pdf':
      return () => <FontAwesomeIcon icon={faFilePdf} className="h-4 w-4 text-red-500" />;
    case 'doc':
    case 'docx':
      return () => <FontAwesomeIcon icon={faFileWord} className="h-4 w-4 text-blue-600" />;
    case 'xls':
    case 'xlsx':
      return () => <FontAwesomeIcon icon={faFileExcel} className="h-4 w-4 text-green-600" />;
    case 'ppt':
    case 'pptx':
      return () => <FontAwesomeIcon icon={faFilePowerpoint} className="h-4 w-4 text-orange-600" />;
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
      return () => <FontAwesomeIcon icon={faFileArchive} className="h-4 w-4 text-gray-500" />;
    case 'mp4':
    case 'avi':
    case 'mov':
      return () => <FontAwesomeIcon icon={faFileVideo} className="h-4 w-4 text-purple-500" />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return () => <FontAwesomeIcon icon={faFileAudio} className="h-4 w-4 text-pink-500" />;
    default:
      return () => <FontAwesomeIcon icon={faFile} className="h-4 w-4 text-gray-400" />;
  }
}
