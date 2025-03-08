/**
 * Environment variables with validation using Zod
 */

import { z } from "zod";

const envSchema = z.object({
    NEXT_PUBLIC_SERVER_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_OPEN_CAGE_API_KEY: z.string().min(1, "Open Cage API key is required"),
});

const env = envSchema.safeParse({
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_OPEN_CAGE_API_KEY: process.env.NEXT_PUBLIC_OPEN_CAGE_API_KEY,
});

if (!env.success) {
    console.error("❌ Invalid environment variables:", env.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
}

export const SERVER_URL = env.data.NEXT_PUBLIC_SERVER_URL;
export const OPEN_CAGE_API_KEY = env.data.NEXT_PUBLIC_OPEN_CAGE_API_KEY;
