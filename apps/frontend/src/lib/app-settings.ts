/**
 * Application settings and constants
 */

export const TOAST_DURATION = 2500;
export const TOAST_RICH_COLORS = true;

export const GEO_SEARCH_TIMEOUT = 10000;
export const CONNECTION_TIMEOUT = 15000;
export const PEER_SEARCH_TIMEOUT = 30000;

export const VIDEO_CONSTRAINTS = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user",
};

export const AUDIO_CONSTRAINTS = {
    echoCancellation: true,
    noiseSuppression: true,
};

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_INTERESTS = 10;

export const SOCKET_RECONNECTION_ATTEMPTS = 5;
