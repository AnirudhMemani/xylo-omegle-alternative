import { Socket } from "socket.io";
import { printLogs } from "../lib/logs.js";
import { AddIceCandidate, Answer, Offer, UserInfo } from "../types/MessageTypes.js";
import { RoomManager } from "./RoomManager.js";

export interface User {
    socket: Socket;
    name: string;
    interests?: string[];
    location?: string;
    joinedQueueAt?: number;
}

export class UserManager {
    private users: User[];
    private queue: string[];
    private roomManager: RoomManager;
    private readonly INTEREST_MATCH_TIMEOUT = 10000;

    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(socket: Socket) {
        this.users.push({
            name: "anonymous",
            socket,
        });
        this.initHandlers(socket);
    }

    removeUser(socketId: string) {
        this.roomManager.leaveRoom(socketId);
        this.users = this.users.filter((x) => x.socket.id !== socketId);
        this.queue = this.queue.filter((x) => x !== socketId);
    }

    async clearQueue() {
        if (this.queue.length < 2) {
            return;
        }

        const currentTime = Date.now();

        // Sort queue by join time (oldest first)
        const sortedQueue = [...this.queue].sort((a, b) => {
            const userA = this.users.find((u) => u.socket.id === a);
            const userB = this.users.find((u) => u.socket.id === b);
            return (userA?.joinedQueueAt || 0) - (userB?.joinedQueueAt || 0);
        });

        const oldestUserId = sortedQueue[0];
        const oldestUser = this.users.find((u) => u.socket.id === oldestUserId);

        if (!oldestUser) {
            return;
        }

        const hasTimedOut =
            oldestUser.joinedQueueAt && currentTime - oldestUser.joinedQueueAt > this.INTEREST_MATCH_TIMEOUT;

        let matchedUserId: string | undefined;

        if (!hasTimedOut && oldestUser.interests && oldestUser.interests.length > 0) {
            for (let i = 1; i < sortedQueue.length; i++) {
                const potentialMatchId = sortedQueue[i];
                const potentialMatch = this.users.find((u) => u.socket.id === potentialMatchId);

                if (potentialMatch?.interests && potentialMatch.interests.length > 0) {
                    const hasCommonInterest = oldestUser.interests.some((interest) =>
                        potentialMatch.interests?.includes(interest)
                    );

                    if (hasCommonInterest) {
                        matchedUserId = potentialMatchId;
                        break;
                    }
                }
            }
        }

        // If no interest match found or timed out, just take the next person in queue
        if (!matchedUserId) {
            printLogs("No common interests found");
            matchedUserId = sortedQueue[1];
        }

        this.queue = this.queue.filter((id) => id !== oldestUserId && id !== matchedUserId);

        const user1 = oldestUser;
        const user2 = this.users.find((u) => u.socket.id === matchedUserId);

        if (!user1 || !user2) {
            return;
        }

        printLogs("Creating room with users:", user1.name, user2.name);

        this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }

    initHandlers(socket: Socket) {
        socket.on("join-room", ({ username, interests, location }) => {
            console.log(`User ${username} joining room with interests: ${interests}`);

            const userIndex = this.users.findIndex((u) => u.socket.id === socket.id);
            if (userIndex !== -1) {
                this.users[userIndex].name = username;
                this.users[userIndex].interests = interests;
                this.users[userIndex].location = location;
                this.users[userIndex].joinedQueueAt = Date.now();
            }

            if (!this.queue.includes(socket.id)) {
                this.queue.push(socket.id);
            }

            socket.emit("lobby");
            this.clearQueue();
        });

        socket.on("offer", ({ sdp, roomId }: Offer) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer", ({ sdp, roomId }: Answer) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("add-ice-candidate", ({ candidate, roomId, type }: AddIceCandidate) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });

        socket.on("user-info", ({ roomId, username, interests, location }: UserInfo) => {
            this.roomManager.onUserInfo(roomId, username, interests, location, socket.id);
        });

        socket.on("chat-message", ({ message }) => {
            const roomId = this.roomManager.getUserRoom(socket.id);
            if (roomId) {
                this.roomManager.relayMessage(roomId, message, socket.id);
            }
        });

        socket.on("skip-user", () => {
            this.roomManager.leaveRoom(socket.id);

            const userIndex = this.users.findIndex((u) => u.socket.id === socket.id);
            if (userIndex !== -1) {
                this.users[userIndex].joinedQueueAt = Date.now();
            }

            if (!this.queue.includes(socket.id)) {
                this.queue.push(socket.id);
                socket.emit("lobby");
                this.clearQueue();
            }
        });

        socket.on("stop-searching", () => {
            this.roomManager.leaveRoom(socket.id);

            this.queue = this.queue.filter((id) => id !== socket.id);

            socket.emit("search-stopped");
        });
    }
}
