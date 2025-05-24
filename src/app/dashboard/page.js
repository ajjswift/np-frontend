import axios from "axios";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import {EnvironmentCreateButton} from './EnvironmentCreateButton'

export default async function DashboardPage() {
    const sessionToken = (await cookies()).get("session_token")?.value;
    const environments = (await getUserEnvironments(sessionToken)).environments;

    console.log(environments);


    return (
        <>
            <div className="text-3xl font-bold mb-6">
                Manage your Environments
            </div>
            
            <div className="p-8">
                <EnvironmentCreateButton />
            </div>

            <div className="grid grid-cols-12 gap-4">
                {environments.map((environment, index) => (
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
        </>
    );
}

async function getUserEnvironments(sessionToken) {
    const environments = await axios.get(
        `${process.env.BASE_URL}/api/environment`,
        {
            headers: {
                Cookie: `session_token=${sessionToken}`,
            },
        }
    );

    return environments.data;
}

