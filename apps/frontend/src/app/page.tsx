"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

export default function LandingPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [currentTag, setCurrentTag] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const handleAddTag = () => {
        if (currentTag.trim() && !tags.includes(currentTag.trim())) {
            setTags([...tags, currentTag.trim()]);
            setCurrentTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && currentTag.trim()) {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleStartChat = () => {
        if (username.trim()) {
            // Store user data in localStorage or state management
            localStorage.setItem("username", username);
            localStorage.setItem("interests", JSON.stringify(tags));
            router.push("/chat");
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm"
            >
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-center text-3xl font-bold text-transparent"
                >
                    Connect & Chat
                </motion.h1>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-gray-700">
                            Your Username
                        </label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            className="w-full"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="tags" className="text-sm font-medium text-gray-700">
                            Interests (Optional)
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="tags"
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Add interests (press Enter)"
                                className="flex-1"
                            />
                            <Button type="button" onClick={handleAddTag} variant="outline">
                                Add
                            </Button>
                        </div>

                        {tags.length > 0 && (
                            <motion.div
                                className="mt-3 flex flex-wrap gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                        {tag}
                                        <X size={14} className="cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                                    </Badge>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            onClick={handleStartChat}
                            disabled={!username.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                        >
                            Start Chatting
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
