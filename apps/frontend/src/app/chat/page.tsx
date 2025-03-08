"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Message = {
    id: string;
    sender: string;
    text: string;
    timestamp: Date;
};

type UserStatus = "connecting" | "connected" | "searching";

export default function ChatPage() {
    const router = useRouter();
    const [username, setUsername] = useState<string>("");
    const [interests, setInterests] = useState<string[]>([]);
    const [status, setStatus] = useState<UserStatus>("connecting");
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [peerCountry, setPeerCountry] = useState<string | null>(null);
    const [peerUsername, setPeerUsername] = useState<string | null>(null);
    const [peerInterests, setPeerInterests] = useState<string[]>([]);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Simulate loading user data
    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        const storedInterests = localStorage.getItem("interests");

        if (!storedUsername) {
            router.push("/");
            return;
        }

        setUsername(storedUsername);
        setInterests(storedInterests ? JSON.parse(storedInterests) : []);

        // Simulate connecting to a peer after a delay
        const timer = setTimeout(() => {
            connectToPeer();
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Simulate connecting to a peer
    const connectToPeer = () => {
        setStatus("searching");

        // Simulate finding a peer after a delay
        setTimeout(() => {
            // Mock peer data
            setPeerUsername("RandomUser" + Math.floor(Math.random() * 1000));
            setPeerCountry("United States");
            setPeerInterests(["Music", "Technology", "Travel"].filter(() => Math.random() > 0.5));
            setStatus("connected");

            // Add system message
            addSystemMessage("You are now connected with a new user");

            // Simulate getting local and remote video streams
            setupVideoStreams();
        }, 1500);
    };

    // Simulate setting up video streams
    const setupVideoStreams = async () => {
        try {
            // Simulate getting local stream
            const fakeLocalStream = new MediaStream();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = fakeLocalStream;
            }

            // Simulate getting remote stream
            const fakeRemoteStream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = fakeRemoteStream;
            }
        } catch (error) {
            console.error("Error accessing media devices:", error);
            toast.error("Camera Access Error", {
                description: "Could not access camera or microphone",
            });
        }
    };

    const skipUser = () => {
        setStatus("searching");
        setPeerUsername(null);
        setPeerCountry(null);
        setPeerInterests([]);
        setMessages([]);

        // Simulate finding a new peer
        setTimeout(() => {
            connectToPeer();
        }, 1500);
    };

    const stopSearching = () => {
        router.push("/");
    };

    const addSystemMessage = (text: string) => {
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                sender: "system",
                text,
                timestamp: new Date(),
            },
        ]);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (newMessage.trim() && status === "connected") {
            const message: Message = {
                id: Date.now().toString(),
                sender: "me",
                text: newMessage.trim(),
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, message]);
            setNewMessage("");

            // Simulate receiving a response after a delay
            setTimeout(
                () => {
                    const responses = [
                        "That's interesting!",
                        "I agree with you.",
                        "Tell me more about that.",
                        "I've been thinking about that too.",
                        "What else do you like to do?",
                        "Have you ever traveled abroad?",
                        "What's your favorite movie?",
                    ];

                    const responseMessage: Message = {
                        id: Date.now().toString(),
                        sender: "peer",
                        text: responses[Math.floor(Math.random() * responses.length)] || "",
                        timestamp: new Date(),
                    };

                    setMessages((prev) => [...prev, responseMessage]);
                },
                1000 + Math.random() * 2000
            );
        }
    };

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (status === "searching") {
                    stopSearching();
                } else if (status === "connected") {
                    skipUser();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [status]);

    return (
        <div className="bg-linear-to-br flex min-h-screen flex-col gap-4 from-indigo-50 via-purple-50 to-pink-50 p-4">
            {/* Video section */}
            <div className="flex w-full flex-col gap-4">
                <div className="grid h-[70vh] grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Local video */}
                    <div className="relative h-full overflow-hidden rounded-xl bg-black shadow-xl">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 h-full w-full object-cover"
                            poster="/placeholder.svg?height=600&width=800"
                        />
                        <div className="backdrop-blur-xs absolute bottom-4 left-4 rounded-lg bg-black/50 p-3 text-white">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback className="bg-linear-to-br from-purple-500 to-pink-500">
                                        {username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{username}</p>
                                    <p className="text-xs opacity-80">You</p>
                                </div>
                            </div>
                            {interests.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {interests.map((interest) => (
                                        <Badge
                                            key={interest}
                                            variant="outline"
                                            className="border-none bg-white/10 text-xs text-white"
                                        >
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remote video (peer) */}
                    <div className="relative h-full overflow-hidden rounded-xl bg-black shadow-xl">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover"
                            poster="/placeholder.svg?height=600&width=800"
                        />

                        {/* Connection status overlay */}
                        {status !== "connected" && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                                <div className="text-center text-white">
                                    {status === "connecting" && (
                                        <>
                                            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin" />
                                            <p className="text-xl">Initializing...</p>
                                        </>
                                    )}
                                    {status === "searching" && (
                                        <>
                                            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin" />
                                            <p className="text-xl">Looking for someone to chat with...</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Peer info overlay */}
                        {status === "connected" && peerUsername && (
                            <div className="backdrop-blur-xs absolute bottom-4 left-4 rounded-lg bg-black/50 p-3 text-white">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback className="bg-linear-to-br from-purple-500 to-pink-500">
                                            {peerUsername.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{peerUsername}</p>
                                        <p className="text-xs opacity-80">{peerCountry}</p>
                                    </div>
                                </div>
                                {peerInterests.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {peerInterests.map((interest) => (
                                            <Badge
                                                key={interest}
                                                variant="outline"
                                                className="border-none bg-white/10 text-xs text-white"
                                            >
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Skip/Stop button */}
                <div className="flex justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            variant={status === "searching" ? "destructive" : "default"}
                            onClick={status === "searching" ? stopSearching : skipUser}
                            className="rounded-full px-8 py-6 text-lg font-medium"
                        >
                            {status === "searching" ? "Stop Searching" : "Skip User"}
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Text chat section */}
            <div className="backdrop-blur-xs flex h-[30vh] w-full flex-col rounded-xl bg-white/80 shadow-xl">
                <div className="border-b p-4">
                    <h2 className="font-semibold">Chat</h2>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <AnimatePresence>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`mb-3 ${
                                    message.sender === "me"
                                        ? "flex justify-end"
                                        : message.sender === "system"
                                          ? "flex justify-center"
                                          : "flex justify-start"
                                }`}
                            >
                                {message.sender === "system" ? (
                                    <div className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600">
                                        {message.text}
                                    </div>
                                ) : (
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                            message.sender === "me"
                                                ? "bg-linear-to-r from-purple-600 to-pink-600 text-white"
                                                : "bg-gray-200 text-gray-800"
                                        }`}
                                    >
                                        <p>{message.text}</p>
                                        <p className="mt-1 text-xs opacity-70">
                                            {message.timestamp.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </AnimatePresence>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="flex gap-2 border-t p-4">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={status !== "connected"}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={status !== "connected" || !newMessage.trim()}>
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
