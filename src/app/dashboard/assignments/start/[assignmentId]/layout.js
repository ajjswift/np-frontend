import { Suspense } from "react";

function Spinner() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <svg
                className="animate-spin h-10 w-10 text-blue-500 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
            </svg>
            <div className="text-lg text-zinc-300">Loading...</div>
        </div>
    );
}

export default function Layout({ children }) {
    return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}
