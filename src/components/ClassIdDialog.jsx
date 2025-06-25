"use client";

import * as React from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon, CopyIcon } from "lucide-react";

const PlusIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
    >
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
    </svg>
);

export function ClassIdDialog({ classId }) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(classId);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <PlusIcon /> Add Students
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Join Code</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2 mt-4">
                    <Input
                        value={classId}
                        readOnly
                        className="font-mono text-sm"
                    />
                    <Button
                        type="button"
                        variant={copied ? "success" : "outline"}
                        onClick={handleCopy}
                        className="flex items-center gap-1"
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="w-4 h-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <CopyIcon className="w-4 h-4" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
