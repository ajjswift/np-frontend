import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function StartAssignment({ params }) {
    const { assignmentId } = await params;
    const sessionToken = (await cookies()).get("session_token")?.value;

    // Call the API route directly
    const res = await fetch(
        `${process.env.BASE_URL}/api/classes/assignments/${assignmentId}/start`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `session_token=${sessionToken}`,
            },
            cache: "no-store",
        }
    );

    if (res.ok) {
        const data = await res.json();
        // Redirect to the new environment
        redirect(`/dashboard/environment/${data.environment.id}`);
    }

    // If error, show a message
    let errorMsg = "An error occurred while starting the assignment.";
    try {
        const data = await res.json();
        if (data?.message) errorMsg = data.message;
    } catch {}

    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <svg
                className="h-10 w-10 text-red-500 mb-4"
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
            <div className="text-red-500 text-center">
                <div className="mb-2 font-bold">Error</div>
                <div>{errorMsg}</div>
            </div>
        </div>
    );
}
