"use client";

import { useRouter } from "next/navigation";

export function EnvironmentCard({ environment }) {
    const router = useRouter();

    return (
        <a
            className="cursor-pointer"
            href={`/dashboard/environment/${environment.id}`}
        >
            {environment.name}
        </a>
    );
}
