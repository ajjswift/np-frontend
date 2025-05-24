import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConsolePanel({ output, socketStatus, sendInput, broadcastInputChange, input, setInput }) {
    const [contentHeight, setContentHeight] = useState(0);
    const tabContentRef = useRef(null);

    useEffect(() => {
        const updateHeight = () => {
            if (tabContentRef.current) {
                setContentHeight(tabContentRef.current.clientHeight);
            }
        };

        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    const handleSend = () => {
        if (input.trim() !== "") {
            sendInput(input);
            setInput("");
        }
    };

    const handleChange = (e) => {
        setInput(e.target.value);
        broadcastInputChange(e.target.value);
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <Tabs defaultValue="console" className="h-full flex flex-col">
            <div className="border-b px-4 flex justify-between items-center">
                <TabsList className="mt-2">
                    <TabsTrigger value="console">Console</TabsTrigger>
                    <TabsTrigger value="problems">Problems</TabsTrigger>
                </TabsList>
                <div
                    className={`w-[8vw] ${
                        socketStatus === "connected"
                            ? "bg-green-400"
                            : socketStatus === "disconnected"
                            ? "bg-amber-400"
                            : ""
                    } text-sm h-6 flex justify-center items-center rounded-sm`}
                >
                    {socketStatus}
                </div>
            </div>
            <TabsContent
                ref={tabContentRef}
                value="console"
                className="flex-1 p-0 flex flex-col bg-[#1b1e28] relative"
            >
                <div className="absolute inset-0 flex flex-col">
                    <ScrollArea className="flex-1 pb-16">
                        <div
                            className="p-4 font-mono text-[14px] whitespace-pre-wrap text-[#a6accd] overflow-scroll mt-[2rem]"
                            style={{
                                maxHeight: `calc(${contentHeight}px - 3rem)`,
                            }}
                        >
                            {output || "Run your code to see output here"}
                        </div>
                    </ScrollArea>
                </div>
                <div className="w-full flex p-2 bg-[#1b1e28] border-t border-zinc-700 sticky bottom-0 left-0 z-10">
                    <Input
                        className="flex-1 mr-2 text-white bg-[#1b1e28] border-zinc-700"
                        placeholder="Type input and press Enter"
                        value={input}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disabled={socketStatus !== "connected"}
                        autoComplete="off" data-1p-ignore data-lpignore="true" data-protonpass-ignore="true"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={
                            socketStatus !== "connected" ||
                            input.trim() === ""
                        }
                    >
                        Send
                    </Button>
                </div>
            </TabsContent>
            <TabsContent
                value="problems"
                className="flex-1 p-4 bg-[#1b1e28] text-[#a6accd]"
            >
                No problems detected.
            </TabsContent>
        </Tabs>
    );
}
