import { create } from "zustand";

type UserState = {
    username: string;
    interests: string[];
    localVideoTrack: MediaStreamTrack | null;
    localAudioTrack: MediaStreamTrack | null;
    location: string;

    setUsername: (username: string) => void;
    setInterests: (interests: string[]) => void;
    addInterest: (interest: string) => void;
    removeInterest: (interest: string) => void;
    setLocalVideoTrack: (track: MediaStreamTrack | null) => void;
    setLocalAudioTrack: (track: MediaStreamTrack | null) => void;
    setLocation: (location: string) => void;
    clearUser: () => void;
};

export const useUserStore = create<UserState>()((set) => ({
    username: "",
    interests: [],
    localVideoTrack: null,
    localAudioTrack: null,
    location: "Not Found",

    setUsername: (username) => set({ username }),
    setInterests: (interests) => set({ interests }),
    addInterest: (interest) =>
        set((state) => ({
            interests: [...state.interests, interest],
        })),
    removeInterest: (interest) =>
        set((state) => ({
            interests: state.interests.filter((item) => item !== interest),
        })),
    setLocalVideoTrack: (localVideoTrack) => set({ localVideoTrack }),
    setLocalAudioTrack: (localAudioTrack) => set({ localAudioTrack }),
    setLocation: (location) => set({ location }),
    clearUser: () =>
        set({
            username: "",
            interests: [],
            localVideoTrack: null,
            localAudioTrack: null,
            location: "Not Found",
        }),
}));
