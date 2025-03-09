"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SOCKET_RECONNECTION_ATTEMPTS } from "@/lib/app-settings";
import { SERVER_URL } from "@/lib/env";
import { useUserStore } from "@/store/user/user-store";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Message = {
    id: string;
    sender: string;
    text: string;
    timestamp: Date;
};

// Update the UserStatus type to include "idle"
type UserStatus = "connecting" | "connected" | "searching" | "idle";

export default function ChatPage() {
    const router = useRouter();

    // Get user data from store
    const { username, interests, localVideoTrack, localAudioTrack, location } = useUserStore();

    // Use the imported newSocket directly instead of creating a new state
    const [status, setStatus] = useState<UserStatus>("connecting");
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [peerCountry, setPeerCountry] = useState<string | null>(null);
    const [peerUsername, setPeerUsername] = useState<string | null>(null);
    const [peerInterests, setPeerInterests] = useState<string[]>([]);
    // const [isMuted, setIsMuted] = useState<boolean>(false);

    // WebRTC states
    const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
    const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [inLobby, setInLobby] = useState(true);

    const [socket, setSocket] = useState<Socket | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const searchForPeer = (socket: Socket) => {
        socket.emit("join-room", { username, interests, location });
        setStatus("searching");
        addSystemMessage("Looking for someone to chat with...");
    };

    const resetRemoteVideo = () => {
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            // Clear all tracks from the MediaStream
            const stream = remoteVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
                track.stop();
            });
            // Set srcObject to null to fully reset
            remoteVideoRef.current.srcObject = null;
        }
    };

    // Initialize connection and check for user data
    useEffect(() => {
        if (!username || !localVideoTrack) {
            router.push("/");
            return;
        }

        const newSocket = io(SERVER_URL, { reconnectionAttempts: SOCKET_RECONNECTION_ATTEMPTS });

        setSocket(newSocket);

        // Socket event handlers
        newSocket.on("send-offer", async ({ roomId }) => {
            console.log("Sending offer");
            setStatus("connected");
            setInLobby(false);

            const pc = new RTCPeerConnection();

            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    newSocket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId,
                    });
                }
            };

            pc.onnegotiationneeded = async () => {
                const sdp = await pc.createOffer();
                await pc.setLocalDescription(sdp);
                setSendingPc(pc);
                newSocket.emit("offer", {
                    sdp,
                    roomId,
                });
            };

            if (localVideoTrack) {
                pc.addTrack(localVideoTrack);
            }

            if (localAudioTrack) {
                pc.addTrack(localAudioTrack);
            }

            // Send user info to peer
            newSocket.emit("user-info", {
                roomId,
                username,
                interests,
                location,
            });
        });

        newSocket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            console.log("Received offer");
            setStatus("connected");
            setInLobby(false);

            const pc = new RTCPeerConnection();

            pc.ontrack = (event: RTCTrackEvent) => {
                const track = event.track;

                // Check track kind
                if (track.kind === "audio") {
                    setRemoteAudioTrack(track);
                } else if (track.kind === "video") {
                    setRemoteVideoTrack(track);
                }

                // Add track to remote video element
                if (remoteVideoRef.current) {
                    if (!remoteVideoRef.current.srcObject) {
                        remoteVideoRef.current.srcObject = new MediaStream();
                    }
                    (remoteVideoRef.current.srcObject as MediaStream).addTrack(track);
                }
            };

            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    newSocket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId,
                    });
                }
            };

            await pc.setRemoteDescription(remoteSdp);
            const sdp = await pc.createAnswer();
            await pc.setLocalDescription(sdp);

            setReceivingPc(pc);

            newSocket.emit("answer", {
                roomId,
                sdp: sdp,
            });

            // Send user info to peer
            newSocket.emit("user-info", {
                roomId,
                username,
                interests,
                location,
            });
        });

        newSocket.on("answer", ({ sdp: remoteSdp }) => {
            setInLobby(false);
            setSendingPc((pc) => {
                if (pc) pc.setRemoteDescription(remoteSdp);
                return pc;
            });
        });

        newSocket.on("lobby", () => {
            setInLobby(true);
            setStatus("searching");
            addSystemMessage("Looking for someone to chat with...");
        });

        // Add handler for search-stopped event
        newSocket.on("search-stopped", () => {
            setInLobby(false);
            setStatus("idle");
            addSystemMessage("Stopped searching. Click 'New Chat' to start again.");
        });

        newSocket.on("add-ice-candidate", ({ candidate, type }) => {
            if (type === "sender") {
                setReceivingPc((pc) => {
                    if (pc) pc.addIceCandidate(candidate);
                    return pc;
                });
            } else {
                setSendingPc((pc) => {
                    if (pc) pc.addIceCandidate(candidate);
                    return pc;
                });
            }
        });

        // Handle peer user info
        newSocket.on("user-info", ({ username: peerName, interests: peerTags, location: peerLocation }) => {
            setPeerUsername(peerName);
            setPeerInterests(peerTags || []);
            setPeerCountry(peerLocation || "Unknown");
            clearAndAddSystemMessage(`You are now connected with ${peerName}`);
        });

        // Handle chat messages
        newSocket.on("chat-message", ({ message }) => {
            const newMsg: Message = {
                id: Date.now().toString(),
                sender: "peer",
                text: message,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, newMsg]);
        });

        // Handle peer left event
        newSocket.on("peer-left", () => {
            console.log("Peer left the chat");

            // Clean up connections
            if (sendingPc) {
                sendingPc.close();
                setSendingPc(null);
            }
            if (receivingPc) {
                receivingPc.close();
                setReceivingPc(null);
            }

            resetRemoteVideo();

            // Reset state
            setRemoteVideoTrack(null);
            setRemoteAudioTrack(null);
            setPeerUsername(null);
            setPeerCountry(null);
            setPeerInterests([]);

            // Add system message
            addSystemMessage("Your chat partner has disconnected.");

            // Automatically start searching for a new person
            searchForPeer(newSocket);
        });

        // Start searching for a peer
        searchForPeer(newSocket);

        // Cleanup on unmount
        return () => {
            if (sendingPc) {
                sendingPc.close();
            }
            if (receivingPc) {
                receivingPc.close();
            }

            newSocket.disconnect();
        };
    }, [username, localVideoTrack, localAudioTrack, interests, location, router]);

    // Set up local video
    useEffect(() => {
        if (localVideoRef.current && localVideoTrack) {
            const stream = new MediaStream();
            stream.addTrack(localVideoTrack);
            if (localAudioTrack) {
                stream.addTrack(localAudioTrack);
            }
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(console.error);
        }
    }, [localVideoRef, localVideoTrack, localAudioTrack]);

    const skipUser = () => {
        if (socket) {
            // Clean up existing connections
            if (sendingPc) {
                sendingPc.close();
                setSendingPc(null);
            }
            if (receivingPc) {
                receivingPc.close();
                setReceivingPc(null);
            }

            resetRemoteVideo();

            // Reset state
            setRemoteVideoTrack(null);
            setRemoteAudioTrack(null);
            setPeerUsername(null);
            setPeerCountry(null);
            setPeerInterests([]);
            setMessages([]);

            // Request new peer by emitting skip-user event
            socket.emit("skip-user");
            setStatus("searching");
            addSystemMessage("Looking for a new person to chat with...");
        }
    };

    // Update the stopSearching function to emit the new event
    const stopSearching = () => {
        if (socket) {
            // Clean up existing connections
            if (sendingPc) {
                sendingPc.close();
                setSendingPc(null);
            }
            if (receivingPc) {
                receivingPc.close();
                setReceivingPc(null);
            }

            resetRemoteVideo();

            // Reset state
            setRemoteVideoTrack(null);
            setRemoteAudioTrack(null);
            setPeerUsername(null);
            setPeerCountry(null);
            setPeerInterests([]);
            setMessages([]);

            // Tell the server to stop searching
            socket.emit("stop-searching");

            // We'll set the status to idle when we receive the search-stopped event
        }
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

    const clearAndAddSystemMessage = (text: string) => {
        setMessages(() => [
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

        if (newMessage.trim() && status === "connected" && socket) {
            const message: Message = {
                id: Date.now().toString(),
                sender: "me",
                text: newMessage.trim(),
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, message]);

            // Send message to peer
            socket.emit("chat-message", { message: newMessage.trim() });

            setNewMessage("");
        }
    };

    // const toggleMute = () => {
    //     setIsMuted(!isMuted);
    //     if (localAudioTrack) {
    //         localAudioTrack.enabled = isMuted;
    //     }
    // };

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
                                    {interests.map((interest, idx) => (
                                        <Badge
                                            key={interest + idx}
                                            variant="outline"
                                            className="border-none bg-white/10 text-xs text-white"
                                        >
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mute button */}
                        {/* <div className="absolute bottom-4 right-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full bg-black/50 text-white hover:bg-black/70"
                                onClick={toggleMute}
                            >
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            </Button>
                        </div> */}
                    </div>

                    {/* Remote video (peer) */}
                    <div className="relative h-full overflow-hidden rounded-xl bg-black shadow-xl">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover"
                        />

                        {/* Connection status overlay */}
                        {status === "searching" && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                                <div className="text-center text-white">
                                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin" />
                                    <p className="text-xl">Looking for someone to chat with...</p>
                                </div>
                            </div>
                        )}

                        {status === "connecting" && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                                <div className="text-center text-white">
                                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin" />
                                    <p className="text-xl">Initializing...</p>
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
                                        {peerInterests.map((interest, idx) => (
                                            <Badge
                                                key={interest + idx}
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
                            onClick={status === "searching" ? stopSearching : status === "idle" ? skipUser : skipUser}
                            className="rounded-full px-8 py-6 text-lg font-medium"
                        >
                            {status === "searching" ? "Stop Searching" : status === "idle" ? "New Chat" : "Skip User"}
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
                        {messages.map((message, idx) => (
                            <motion.div
                                key={message.id + idx}
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
