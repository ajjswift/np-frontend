import axios from "axios";
import { cookies } from "next/headers";
import Link from "next/link";
import { isTeacher } from "@/lib/verifySession";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { CreateAssignmentDialog } from "@/components/CreateAssignmentDialog";
import { AssignmentList } from "@/components/AssignmentList";
import { ClassIdDialog } from "@/components/ClassIdDialog";

// Icons
const PlusIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
    >
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
    </svg>
);

const SearchIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
    >
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
    </svg>
);

const DownloadIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
    >
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
    </svg>
);

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

export default async function ClassPage({ params }) {
    try {
        const { classId } = await params;
        const sessionToken = (await cookies()).get("session_token")?.value;

        // Check if user is a teacher
        const isUserTeacher = await isTeacher(sessionToken);
        if (!isUserTeacher) {
            redirect("/dashboard"); // Redirect non-teachers
        }

        // Fetch class details
        const classDetails = await getClassDetails(classId, sessionToken);
        if (!classDetails) {
            notFound(); // 404 if class not found or not accessible
        }

        const environments = (await getUserEnvironments(sessionToken))
            ?.environments;

        const assignments = (await getClassAssignments(classId, sessionToken))
            ?.assignments;

        // Fetch students for this class
        const studentsData = await getStudentsForClass(classId, sessionToken);
        const students = studentsData?.students || [];

        return (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="text-zinc-400 hover:text-white inline-flex items-center gap-1 mb-4"
                    >
                        <BackIcon /> Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">
                                {classDetails.name}
                            </h1>
                            {classDetails.description && (
                                <p className="text-zinc-400 mt-2">
                                    {classDetails.description}
                                </p>
                            )}
                        </div>

                        {/* TODO: <div className="flex gap-2">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                                Class Settings
                            </button>
                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                                <PlusIcon /> Add Assignment
                            </button>
                        </div> */}
                    </div>
                </div>

                {/* Class Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                        <h3 className="text-zinc-400 text-sm mb-1">
                            Total Students
                        </h3>
                        <p className="text-2xl font-bold">{students.length}</p>
                    </div>

                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
                        <h3 className="text-zinc-400 text-sm mb-1">
                            Total Assignments
                        </h3>
                        <p className="text-2xl font-bold">
                            {classDetails.assignment_count || 0}
                        </p>
                    </div>
                </div>

                {/* Student Management */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden mb-8">
                    <div className="p-6 border-b border-zinc-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold">Students</h2>

                            <div className="flex flex-wrap gap-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        className="bg-zinc-700 border border-zinc-600 rounded-md pl-8 pr-4 py-2 w-full md:w-48"
                                    />
                                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-zinc-400">
                                        <SearchIcon />
                                    </div>
                                </div>

                                <ClassIdDialog classId={classId} />
                                {/* TODO:
                                <button className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md flex items-center gap-2">
                                    <DownloadIcon /> Export CSV
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {/* Student Table */}
                    {students.length > 0 ? (
                        <div className="overflow-x-auto p-6">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-700 text-left">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Username</th>

                                        {/*TODO: <th className="px-4 py-3">Actions</th> */}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-700">
                                    {students.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-zinc-750"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {student.name ||
                                                    student.username}
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.username}
                                            </td>
                                            {/* TODO: <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/dashboard/teachers/student/${student.id}`}
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        View
                                                    </Link>
                                                    <button className="text-red-400 hover:text-red-300">
                                                        Remove
                                                    </button>
                                                </div>
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-400">
                            <p className="mb-4">
                                No students in this class yet.
                            </p>
                        </div>
                    )}
                </div>

                {/* Assignments */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Assignments</h2>
                        <CreateAssignmentDialog
                            environments={environments}
                            classId={classId}
                            sessionToken={sessionToken}
                        />
                    </div>

                    <div className="p-6">
                        <ul className="divide-y divide-zinc-700">
                            <AssignmentList
                                assignments={assignments}
                                environments={environments}
                                classId={classId}
                            />
                        </ul>
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
                    We couldn&apos;t load the class details. Please try again
                    later.
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

async function getClassAssignments(classId, sessionToken) {
    try {
        const assignments = await axios.get(
            `${process.env.BASE_URL}/api/classes/assignments/getAssignments`,
            {
                params: {
                    classId: classId,
                },
                headers: {
                    Cookie: `session_token=${sessionToken}`,
                },
            }
        );
        return assignments.data;
    } catch (e) {
        console.error(
            `Error fetching assignments for class ${classId}:`,
            e.message
        );
        return { assignments: [] };
    }
}
