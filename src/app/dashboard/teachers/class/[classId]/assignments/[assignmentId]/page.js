import axios from "axios";
import { cookies } from "next/headers";
import Link from "next/link";
import { isTeacher } from "@/lib/verifySession";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

// Icons
const BackIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
    >
        <path
            fillRule="evenodd"
            d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
        />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
    >
        <path
            fillRule="evenodd"
            d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"
        />
        <path
            fillRule="evenodd"
            d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
        />
    </svg>
);

export default async function AssignmentProgressPage({ params }) {
    try {
        const { classId, assignmentId } = await params;
        const sessionToken = (await cookies()).get("session_token")?.value;

        // Check if user is a teacher
        const isUserTeacher = await isTeacher(sessionToken);
        if (!isUserTeacher) {
            redirect("/dashboard");
        }

        // Fetch class details
        const classDetails = await getClassDetails(classId, sessionToken);
        if (!classDetails) {
            notFound();
        }

        // Fetch assignment details
        const assignmentDetails = await getAssignmentDetails(
            assignmentId,
            sessionToken
        );
        if (!assignmentDetails) {
            notFound();
        }

        // Fetch students for this class
        const studentsData = await getStudentsForClass(classId, sessionToken);
        const students = studentsData?.students || [];

        // Fetch assignment progress for all students
        const assignmentProgress = await getAssignmentProgress(
            classId,
            assignmentId,
            sessionToken
        );

        return (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link
                        href={`/dashboard/teachers/class/${classId}`}
                        className="text-zinc-400 hover:text-white inline-flex items-center gap-1 mb-4"
                    >
                        <BackIcon /> Back to Class
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">
                                {assignmentDetails.name}
                            </h1>
                            <p className="text-zinc-400 mt-2">
                                {classDetails.name}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {/*TODO: <Link
                                href={`/dashboard/teachers/classes/${classId}/assignments/${assignmentId}/edit`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                            >
                                Edit Assignment
                            </Link> */}
                        </div>
                    </div>
                </div>

                {/* Assignment Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                        <h3 className="text-zinc-400 text-sm mb-1">
                            Total Students
                        </h3>
                        <p className="text-2xl font-bold">{students.length}</p>
                    </div>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                        <h3 className="text-zinc-400 text-sm mb-1">Started</h3>
                        <p className="text-2xl font-bold">
                            {assignmentProgress.length}
                        </p>
                    </div>
                </div>

                {/* Student Progress Table */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-zinc-700">
                        <h2 className="text-xl font-bold">Student Progress</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-700 text-left">
                                <tr>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-700">
                                {students.map((student) => {
                                    const progress =
                                        assignmentProgress[student.id];

                                    console.log(progress);

                                    return (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-zinc-750"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {student.name ||
                                                    student.username}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        progress
                                                            ? "bg-blue-900 text-blue-300"
                                                            : "bg-zinc-700 text-zinc-300"
                                                    }`}
                                                >
                                                    {progress
                                                        ? "Started"
                                                        : "Not Started"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    {progress ? (
                                                        <Link
                                                            href={`/dashboard/environment/${progress}`}
                                                            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                                                        >
                                                            View Work{" "}
                                                            <ExternalLinkIcon />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-zinc-500">
                                                            No work yet
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("An error occurred", error);
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">
                    Something went wrong
                </h1>
                <p className="text-zinc-400">
                    We couldn&apos;t load the assignment details. Please try
                    again later.
                </p>
                <Link
                    href="/dashboard"
                    className="mt-4 inline-block bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md"
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }
}

// Helper functions
async function getClassDetails(classId, sessionToken) {
    try {
        const response = await axios.get(
            `${process.env.BASE_URL}/api/classes/${classId}`,
            {
                headers: {
                    Cookie: `session_token=${sessionToken}`,
                },
            }
        );
        return response.data.class;
    } catch (e) {
        console.error(
            `Error fetching class details for ${classId}:`,
            e.message
        );
        return null;
    }
}

async function getAssignmentDetails(assignmentId, sessionToken) {
    try {
        const response = await axios.get(
            `${process.env.BASE_URL}/api/classes/assignments/${assignmentId}`,
            {
                headers: {
                    Cookie: `session_token=${sessionToken}`,
                },
            }
        );
        return response.data.assignment;
    } catch (e) {
        console.error(
            `Error fetching assignment details for ${assignmentId}:`,
            e.message
        );
        return null;
    }
}

async function getStudentsForClass(classId, sessionToken) {
    try {
        const students = await axios.get(
            `${process.env.BASE_URL}/api/classes/getStudents`,
            {
                params: { classId },
                headers: {
                    Cookie: `session_token=${sessionToken}`,
                },
            }
        );
        return students.data;
    } catch (e) {
        console.error(
            `Error fetching students for class ${classId}:`,
            e.message
        );
        return { students: [] };
    }
}

async function getAssignmentProgress(classId, assignmentId, sessionToken) {
    try {
        const response = await axios.get(
            `${process.env.BASE_URL}/api/classes/assignments/${assignmentId}/progress?classId=${classId}`,
            {
                headers: {
                    Cookie: `session_token=${sessionToken}`,
                },
            }
        );
        return response.data;
    } catch (e) {
        console.error(
            `Error fetching assignment progress for ${assignmentId}:`,
            e.message
        );
        return [];
    }
}
