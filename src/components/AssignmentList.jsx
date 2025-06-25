import Link from "next/link";

export function AssignmentList({ assignments, environments, classId }) {
    if (!assignments || assignments.length === 0) {
        console.log(assignments);
        return (
            <div className="text-zinc-400 py-8 text-center">
                No assignments for this class yet.
            </div>
        );
    }

    // Map environment IDs to names for display
    const envMap = environments
        ? Object.fromEntries(environments.map((env) => [env.id, env.name]))
        : {};

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-zinc-700 text-left">
                    <tr>
                        <th className="px-4 py-3">Assignment Name</th>
                        <th className="px-4 py-3">Based on Environment</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                    {assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-zinc-750">
                            <td className="px-4 py-3 font-medium">
                                {assignment.name}
                            </td>
                            <td className="px-4 py-3">
                                {envMap[assignment.environment] ||
                                    assignment.environment ||
                                    "—"}
                            </td>
                            <td className="px-4 py-3">
                                <Link
                                    href={`/dashboard/teachers/class/${classId}/assignments/${assignment.id}`}
                                    className="text-blue-400 hover:text-blue-300"
                                >
                                    View
                                </Link>
                                {/* Add more actions as needed */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
