import Link from "next/link";

export default function NotFound() {
    return (
        <div className="bg-linear-to-br flex h-screen w-full flex-col items-center justify-center from-indigo-50 via-purple-50 to-pink-50">
            <h2 className="text-2xl font-bold">Page Not Found - 404!</h2>
            <p className="text-lg font-semibold">Looks like you have drifted away into outer space.</p>
            <Link
                href="/"
                className="bg-linear-to-r mt-7 rounded from-purple-600 to-pink-600 px-4 py-2 text-white transition-transform duration-300 ease-out hover:from-purple-700 hover:to-pink-700 active:scale-95"
            >
                Return Home
            </Link>
        </div>
    );
}
