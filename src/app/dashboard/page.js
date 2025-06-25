import axios from "axios";
import { cookies } from "next/headers";
import Link from "next/link";
import { EnvironmentCreateButton } from "./EnvironmentCreateButton";
import { isTeacher } from "@/lib/verifySession";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { JoinClassDialog } from "@/components/JoinClassDialog";
import { CreateClassDialog } from "@/components/CreateClassDialog";

export default async function DashboardPage() {
    try {
        const sessionToken = (await cookies()).get("session_token")?.value;
        const environments = (await getUserEnvironments(sessionToken))
            ?.environments;
        const isUserTeacher = await isTeacher(sessionToken);
        const classes = (await getUserClasses(sessionToken))?.classes;

        if (!isUserTeacher) {
            // STUDENT DASHBOARD
            return (
                <div className="p-6">
                    <div className="text-3xl font-bold mb-6">
                        Manage your Environments
                    </div>
                    <div className="p-8">
                        <EnvironmentCreateButton />
                    </div>
                    <div className="grid grid-cols-12 gap-4 mb-12">
                        {environments?.map((environment, index) => (
                            <Link
                                key={index}
                                className="cursor-pointer h-[12vh] bg-zinc-800 border-[1px] border-zinc-400 col-span-4 rounded-md hover:bg-zinc-750 transition-colors"
                                href={`/dashboard/environment/${environment.id}`}
                            >
                                <div className="text-white p-4 h-full flex items-center">
                                    {environment.name}
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className=" flex gap-6 mb-6">
                        <div className="text-3xl font-bold">Your Classes</div>
                        <JoinClassDialog />
                    </div>

                    {!classes || classes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="text-zinc-400 mb-4">
                                You are not in any classes yet.
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {classes.map((class0, index) => (
                                <div
                                    key={index}
                                    className="bg-zinc-800 border border-zinc-400 rounded-lg p-6"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xl font-bold">
                                            {class0.name}
                                        </div>
                                        {/*TODO: <Link
                                            href={`/dashboard/class/${class0.id}`}
                                            className="text-blue-400 hover:underline"
                                        >
                                            View Class
                                        </Link> */}
                                    </div>
                                    <div className="text-zinc-400 mb-4">
                                        {class0.description || "No description"}
                                    </div>
                                    <Suspense
                                        fallback={
                                            <div>Loading assignments...</div>
                                        }
                                    >
                                        <StudentAssignments
                                            classId={class0.id}
                                            sessionToken={sessionToken}
                                        />
                                    </Suspense>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        } else {
            // TEACHER DASHBOARD
            return (
                <div className="p-6">
                    <div>
                        <div className="flex gap-6">
                            <div className="text-3xl font-bold mb-6">
                                Your Environments
                            </div>
                            <div>
                                <EnvironmentCreateButton />
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                            {environments?.map((environment, index) => (
                                <Link
                                    key={index}
                                    className="cursor-pointer h-[12vh] bg-zinc-800 border-[1px] border-zinc-400 col-span-4 rounded-md hover:bg-zinc-750 transition-colors"
                                    href={`/dashboard/environment/${environment.id}`}
                                >
                                    <div className="text-white p-4 h-full flex items-center">
                                        {environment.name}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className=" flex gap-6 mb-6">
                        <div className="text-3xl font-bold">Your Classes</div>
                        <CreateClassDialog />
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        {classes?.map((class0, index) => (
                            <Link
                                key={index}
                                className="cursor-pointer h-[12vh] bg-zinc-800 border-[1px] border-zinc-400 col-span-4 rounded-md hover:bg-zinc-750 transition-colors"
                                href={`/dashboard/teachers/class/${class0.id}`}
                            >
                                <div className="text-white p-4 h-full flex items-center">
                                    {class0.name}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            );
        }
    } catch (e) {
        return (
            <div className="text-red-500 p-8">
                An error occurred: {e.message}
            </div>
        );
    }
}

// StudentAssignments component (async server component)
async function StudentAssignments({ classId, sessionToken }) {
    const assignments = await getAssignmentsForClass(classId, sessionToken);

    if (!assignments || assignments.length === 0) {
        return (
            <div className="text-zinc-400">
                No assignments for this class yet.
            </div>
        );
    }

    return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 mt-4">
            <div className="font-semibold text-lg mb-4 text-white">
                Assignments
            </div>
            <ul className="space-y-3">
                {assignments.map((assignment) => (
                    <li
                        key={assignment.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between bg-zinc-900 rounded-md px-4 py-3"
                    >
                        <div className="flex flex-col">
                            <span className="font-medium text-white text-base">
                                {assignment.name}
                            </span>
                            {assignment.due_date && (
                                <span className="text-zinc-400 text-xs mt-1">
                                    Due:{" "}
                                    {new Date(
                                        assignment.due_date
                                    ).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div className="mt-2 md:mt-0 flex gap-2">
                            {assignment.started ? (
                                <Link
                                    href={`/dashboard/environment/${assignment.environmentId}`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                                >
                                    Continue
                                </Link>
                            ) : (
                                <Link
                                    href={`/dashboard/assignments/start/${assignment.id}`}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                                >
                                    Start
                                </Link>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// API helpers
async function getUserEnvironments(sessionToken) {
    try {
        const environments = await axios.get(
            `${process.env.BASE_URL}/api/environment`,
            {
                headers: {
                    Cookie: `session_token=${sessionToken}`,
                },
            }
        );
        return environments.data;
    } catch (e) {
        return [];
    }
}

async function getUserClasses(sessionToken) {
    try {
        const classes = await axios.get(`${process.env.BASE_URL}/api/classes`, {
            headers: {
                Cookie: `session_token=${sessionToken}`,
            },
        });
        return classes.data;
    } catch (e) {
        console.error(e);
    }
}

async function getAssignmentsForClass(classId, sessionToken) {
    try {
        const assignments = await axios.get(
            `${process.env.BASE_URL}/api/classes/assignments/getAssignments`,
            {
                params: { classId },
                headers: {
                    Cookie: `session_token=${sessionToken}`,
                },
            }
        );
        return assignments.data?.assignments || [];
    } catch (e) {
        return [];
    }
}
