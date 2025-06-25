"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

export function CreateAssignmentDialog({
    environments,
    classId,
    sessionToken,
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [environment, setEnvironment] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/classes/assignments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `session_token=${sessionToken}`,
                },
                body: JSON.stringify({
                    name,
                    environment,
                    class: classId,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.message || "Failed to create assignment");
            } else {
                setOpen(false);
                setName("");
                setEnvironment("");
                router.refresh(); // Refresh the page to show the new assignment
            }
        } catch (err) {
            setError("Failed to create assignment");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <PlusIcon /> Add Assignment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Assignment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Assignment Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="environment">Base Environment</Label>
                        <Select
                            value={environment}
                            onValueChange={setEnvironment}
                            required
                        >
                            <SelectTrigger id="environment">
                                <SelectValue placeholder="Select environment" />
                            </SelectTrigger>
                            <SelectContent>
                                {environments.map((env) => (
                                    <SelectItem key={env.id} value={env.id}>
                                        {env.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {error && <div className="text-red-500">{error}</div>}
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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
