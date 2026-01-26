
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/context/AuthContext";

export function RoleSwitcher() {
    const { role, switchRole, user, signInAsDev } = useAuth();

    // if (!user) return null; // Removed check to force visibility

    const roles: UserRole[] = ['admin', 'manufacturer', 'client'];

    return (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-2 flex gap-2 z-50">
            <span className="text-xs font-mono self-center mr-2 text-muted-foreground">Demo Role:</span>
            {!user ? (
                <Button
                    size="sm"
                    variant="default"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => signInAsDev()}
                >
                    Enable Dev Mode
                </Button>
            ) : (
                roles.map(r => (
                    <Button
                        key={r}
                        size="sm"
                        variant={role === r ? "default" : "outline"}
                        className={role === r ? "bg-luxury-gold text-black" : ""}
                        onClick={() => switchRole(r)}
                    >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Button>
                ))
            )}
        </div>
    );
}
