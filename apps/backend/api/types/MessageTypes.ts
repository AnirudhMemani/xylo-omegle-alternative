export interface UserInfo {
    roomId: string;
    username: string;
    interests: string[];
    location: string;
}

export interface AddIceCandidate {
    candidate: any;
    roomId: string;
    type: "sender" | "receiver";
}

export interface Answer {
    sdp: string;
    roomId: string;
}

export interface Offer {
    sdp: string;
    roomId: string;
}
