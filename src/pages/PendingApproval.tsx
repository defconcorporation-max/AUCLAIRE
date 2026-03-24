
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LogOut, Clock } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function PendingApproval() {
    const { signOut, user } = useAuth();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4 relative">
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="bg-amber-500/10 p-6 flex justify-center">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500">
                        <Clock className="w-10 h-10" />
                    </div>
                </div>

                <div className="p-8 text-center space-y-4">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-serif">
                        {t('pending.title')}
                    </h1>

                    <div className="space-y-2 text-zinc-500 dark:text-zinc-400">
                        <p>
                            {t('pending.subtitle1')}
                        </p>
                        <p className="text-sm border-l-2 border-amber-500 pl-4 py-2 italic bg-zinc-50 dark:bg-zinc-800/50 text-left mx-auto max-w-xs">
                            &ldquo;{t('pending.quote')}&rdquo;
                        </p>
                        <p className="text-sm">
                            {t('pending.subtitle2')}
                        </p>

                        {user?.email && (
                            <p className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 py-1 px-2 rounded inline-block mt-2">
                                {t('pending.idLabel')} {user.email}
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
                            {t('pending.signOut')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
