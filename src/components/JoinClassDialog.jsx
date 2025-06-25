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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function JoinClassDialog() {
    const [open, setOpen] = React.useState(false);
    const [classCode, setClassCode] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    async function handleJoin(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/classes/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: classCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Failed to join class.");
            } else {
                setOpen(false);
                setClassCode("");
                // Reload the page to show the new class
                window.location.reload();
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Join a Class</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Join a Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJoin} className="space-y-4">
                    <Input
                        placeholder="Enter class code"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        disabled={loading}
                        required
                    />
                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={loading || !classCode}>
                            {loading ? "Joining..." : "Join"}
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                Cancel
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
