
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Clock } from "lucide-react";

export default function PendingApproval() {
    const { signOut, user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="bg-amber-500/10 p-6 flex justify-center">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500">
                        <Clock className="w-10 h-10" />
                    </div>
                </div>

                <div className="p-8 text-center space-y-4">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-serif">
                        Account Pending Approval
                    </h1>

                    <div className="space-y-2 text-zinc-500 dark:text-zinc-400">
                        <p>
                            We have received your registration request.
                        </p>
                        <p className="text-sm border-l-2 border-amber-500 pl-4 py-2 italic bg-zinc-50 dark:bg-zinc-800/50 text-left mx-auto max-w-xs">
                            "All new accounts must be verified by an administrator before access is granted."
                        </p>
                        <p className="text-sm">
                            Please contact your administrator if you need urgent access.
                        </p>

                        {user?.email && (
                            <p className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 py-1 px-2 rounded inline-block mt-2">
                                ID: {user.email}
                            </p>
                        )}
                    </div>

                    <div className="pt-6">
                        <Button
                            variant="outline"
                            className="w-full gap-2 border-zinc-300 dark:border-zinc-700"
                            onClick={() => signOut()}
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
