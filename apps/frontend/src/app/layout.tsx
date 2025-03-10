import { TOAST_DURATION, TOAST_RICH_COLORS } from "@/lib/app-settings";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Xylo - Random Video Chat with Strangers | Omegle Alternative",
    description:
        "Connect with random people worldwide through video chat on Xylo. A safe and fun Omegle alternative to meet new friends, have meaningful conversations, and create unexpected connections.",
    keywords:
        "video chat, random chat, Omegle alternative, meet strangers, video calling, anonymous chat, make friends online",
    openGraph: {
        title: "Xylo - Random Video Chat with Strangers",
        description:
            "Connect with random people worldwide through video chat. A safe and fun way to meet new friends and have meaningful conversations.",
        type: "website",
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/icon.png", type: "image/png" },
        ],
        apple: { url: "/apple-icon.png", type: "image/png" },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {children}
                <Toaster richColors={TOAST_RICH_COLORS} duration={TOAST_DURATION} />
            </body>
        </html>
    );
}
