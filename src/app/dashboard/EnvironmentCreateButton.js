"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
  
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnvironmentCreateButton() {
    const [isEnvironmentNameDialogOpen, setIsEnvironmentNameDialogOpen] = useState(false)
    const [inputtedName, setInputtedName] = useState('');
    const router = useRouter();

    const handleEnvironmentCreate = async () => {
        const response = await axios.post('/api/environment/create', {
            name: inputtedName.trim()
        });

        if (response.status === 200) {
            router.refresh();
            setIsEnvironmentNameDialogOpen(false);
        }
    }

    return (<>
        <Dialog open={isEnvironmentNameDialogOpen} onOpenChange={(open) => {
            setIsEnvironmentNameDialogOpen(open)
        }}>
  <DialogTrigger asChild><span className="p-2 bg-zinc-600 text-white cursor-pointer">Create New</span></DialogTrigger>
  <DialogContent>
    <DialogHeader className={"pb-4"}>
      <DialogTitle>Create a new Environment</DialogTitle>
    </DialogHeader>
    <Label htmlFor="environment-name">Environment Name</Label>
    <Input
        id="environment-name"
        value={inputtedName}
        onChange={(e)=> setInputtedName(e.target.value)} 
    />
    <DialogFooter>
        <Button onClick={handleEnvironmentCreate}>Create</Button>
    </DialogFooter>
  </DialogContent>

</Dialog>
        </>
    )
}