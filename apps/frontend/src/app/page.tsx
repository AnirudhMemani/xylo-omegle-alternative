"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUDIO_CONSTRAINTS, GEO_SEARCH_TIMEOUT, VIDEO_CONSTRAINTS } from "@/lib/app-settings";
import { OPEN_CAGE_API_KEY } from "@/lib/env";
import { printLogs } from "@/lib/logs";
import { useUserStore } from "@/store/user/user-store";
import axios from "axios";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export default function LandingPage() {
    const router = useRouter();
    const [currentTag, setCurrentTag] = useState("");

    const currentYear = new Date().getUTCFullYear();

    const {
        username,
        interests: tags,
        localVideoTrack,
        setUsername,
        addInterest,
        removeInterest,
        setLocalVideoTrack,
        setLocalAudioTrack,
        setLocation,
    } = useUserStore();

    const handleAddTag = () => {
        if (tags.length >= 5) {
            toast.info("You can add up to 5 tags");
            return;
        }
        if (currentTag.trim() && !tags.includes(currentTag.trim())) {
            addInterest(currentTag.trim());
            setCurrentTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        removeInterest(tagToRemove);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && currentTag.trim()) {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleTagOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length > 20) {
            toast.info("Tag name cannot exceed 20 characters");
            return;
        }

        setCurrentTag(e.target.value);
    };

    const handleUsernameOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length > 20) {
            toast.info("Username cannot exceed 20 characters");
            return;
        }

        setUsername(e.target.value);
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const requestAllPermissions = async () => {
            try {
                await getMicAndCameraPermission();
                timer = setTimeout(async () => {
                    await getGeoLocationPermission();
                }, 500);
            } catch (error) {
                printLogs("Error requesting permissions:", error);
            }
        };

        requestAllPermissions();

        return () => {
            clearTimeout(timer);
        };
    }, []);

    const getMicAndCameraPermission = async () => {
        try {
            const videoStream = await window.navigator.mediaDevices.getUserMedia({
                video: VIDEO_CONSTRAINTS,
            });

            const videoTrack = videoStream.getVideoTracks()[0];

            if (!videoTrack) {
                toast.error("Please provide camera permission!", {
                    description: "Authentic connections are made when you can see each other!",
                });
                return;
            }

            setLocalVideoTrack(videoTrack);

            try {
                const audioStream = await window.navigator.mediaDevices.getUserMedia({
                    audio: AUDIO_CONSTRAINTS,
                });

                const audioTrack = audioStream.getAudioTracks()[0];

                if (audioTrack) {
                    setLocalAudioTrack(audioTrack);
                }
            } catch (error) {
                printLogs("getMicAndCameraPermission() | get mic permission - ERROR:", error);
            }

            return true;
        } catch (error) {
            printLogs("getMicAndCameraPermission() | ERROR:", error);
            toast.error("Uh oh! Something went wrong.", {
                description: "Camera not found! You need a camera to talk to strangers on Xylo",
            });
            return false;
        }
    };

    const getGeoLocationInformation = async (latitude: number, longitude: number) => {
        try {
            const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude},${longitude}&key=${OPEN_CAGE_API_KEY}`;
            const response = await axios.get(url);
            if (response.status === 200) {
                printLogs("Country:", response.data.results[0].components.country);
                setLocation(response.data.results[0].components.country);
            } else {
                printLogs("getGeoLocation() | Failed to get Geo Location");
            }
        } catch (error) {
            printLogs("getGeoLocation() | ERROR:", error);
        }
    };

    const handleStartChat = async () => {
        if (!username.trim()) {
            toast.error("Please enter a username", {
                description: "Others need to know what name they can call you by!",
            });
            return;
        }
        try {
            if (localVideoTrack) {
                router.push("/chat");
            } else {
                toast.error("Uh oh! Something went wrong.", {
                    description:
                        "We need camera permission to give you the best experience talking to strangers on Xylo",
                });
            }
        } catch (error) {
            printLogs("handleStartChat() | Error during setup:", error);
            toast.error("Failed to initialize chat", {
                description: "Please try again or check your device permissions",
            });
        }
    };

    const options = {
        enableHighAccuracy: true,
        timeout: GEO_SEARCH_TIMEOUT,
        maximumAge: 0,
    };

    const success = async (pos: GeolocationPosition) => {
        const crd = pos.coords;
        await getGeoLocationInformation(crd.latitude, crd.longitude);
    };

    const errors = (err: GeolocationPositionError) => {
        printLogs("getGeoLocationInformation() | ERROR:", err);
        printLogs("Error code:", err.code, "Error message:", err.message);

        if (err.code === 1) {
            // PERMISSION_DENIED
            toast.error("Location access denied", {
                description: "You've denied location access. Location access helps us find matches closer to you.",
            });
        } else if (err.code === 2) {
            // POSITION_UNAVAILABLE
            toast.error("Location unavailable", {
                description:
                    "Unable to determine your location. This might be due to network issues or GPS being disabled.",
            });
        } else if (err.code === 3) {
            // TIMEOUT
            toast.error("Location request timed out", {
                description: "It took too long to determine your location.",
            });
        }
    };

    const getGeoLocationPermission = async () => {
        if (navigator.geolocation) {
            try {
                const result = await navigator.permissions.query({
                    name: "geolocation",
                });

                if (result.state === "denied") {
                    toast.error("Location permission denied", {
                        description:
                            "Please navigate to site settings and manually provide location access for better matches",
                    });
                } else {
                    navigator.geolocation.getCurrentPosition(success, errors, options);
                }
            } catch (error) {
                printLogs("Permissions API error:", error);
                navigator.geolocation.getCurrentPosition(success, errors, options);
            }
        } else {
            toast.error("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div className="bg-linear-to-br flex min-h-screen flex-col items-center justify-center from-indigo-50 via-purple-50 to-pink-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="backdrop-blur-xs w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-xl"
            >
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-linear-to-r mb-2 from-purple-600 to-pink-600 bg-clip-text text-center text-3xl font-bold text-transparent"
                >
                    Xylo
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6 text-center text-gray-600"
                >
                    Connect with new people around the world through video chat.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8 flex justify-center gap-4"
                >
                    <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">1M+</div>
                        <div className="text-xs text-gray-500">Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">100+</div>
                        <div className="text-xs text-gray-500">Countries</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">24/7</div>
                        <div className="text-xs text-gray-500">Live</div>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-gray-700">
                            Your Username
                        </label>
                        <Input
                            id="username"
                            value={username}
                            onChange={handleUsernameOnChange}
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
                                onChange={handleTagOnChange}
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
                                    <Badge key={tag} variant="secondary" className="">
                                        <span className="flex items-center gap-1">
                                            {tag}
                                            <X
                                                size={14}
                                                className="cursor-pointer"
                                                onClick={() => handleRemoveTag(tag)}
                                            />
                                        </span>
                                    </Badge>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            onClick={handleStartChat}
                            disabled={!username.trim()}
                            className="bg-linear-to-r w-full from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                        >
                            Start Chatting
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="border-t border-gray-200 pt-4"
                    >
                        <h3 className="mb-2 text-sm font-medium text-gray-700">Why Xylo?</h3>
                        <ul className="space-y-1 text-xs text-gray-600">
                            <li className="flex items-center gap-1">
                                <span className="text-green-500">✓</span> Interest-based matching
                            </li>
                            <li className="flex items-center gap-1">
                                <span className="text-green-500">✓</span> High-quality video chat
                            </li>
                            <li className="flex items-center gap-1">
                                <span className="text-green-500">✓</span> Meet people worldwide
                            </li>
                            <li className="flex items-center gap-1">
                                <span className="text-green-500">✓</span> Safe and secure platform
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-center text-xs text-gray-500"
            >
                By using Xylo, you agree to our Terms of Service and Privacy Policy.
                <br />© {currentYear} Xylo. All rights reserved.
            </motion.p>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-2 text-center text-xs font-semibold text-gray-500"
            >
                Made with ❤️ by Anirudh
            </motion.p>
        </div>
    );
}
