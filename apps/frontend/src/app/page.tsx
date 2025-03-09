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
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LandingPage() {
    const router = useRouter();
    const [currentTag, setCurrentTag] = useState("");

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

    useEffect(() => {
        getMicAndCameraPermission();
        getGeoLocationPermission();
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
                printLogs("getMicAndCameraPermission() | ERROR:", error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Uh oh! Something went wrong.", {
                description: "Camera not found! You need a camera to talk to strangers on Xylo",
            });
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
        printLogs(`getGeoLocationInformation() | ERROR(${err.code}): ${err.message}`);
    };

    const getGeoLocationPermission = async () => {
        if (navigator.geolocation) {
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
                    className="bg-linear-to-r mb-8 from-purple-600 to-pink-600 bg-clip-text text-center text-3xl font-bold text-transparent"
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
                </div>
            </motion.div>
        </div>
    );
}
