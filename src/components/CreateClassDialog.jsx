"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";

export function CreateClassDialog({ sessionToken }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/classes/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    description,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Failed to create class");
                setIsLoading(false);
                return;
            }

            setOpen(false);
            setName("");
            setDescription("");
            router.refresh();
        } catch (err) {
            setError("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Create Class</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            className="block text-sm font-medium mb-1"
                            htmlFor="class-name"
                        >
                            Name
                        </label>
                        <input
                            id="class-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                        />
                    </div>
                    <div>
                        <label
                            className="block text-sm font-medium mb-1"
                            htmlFor="class-description"
                        >
                            Description
                        </label>
                        <textarea
                            id="class-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-red-500 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
