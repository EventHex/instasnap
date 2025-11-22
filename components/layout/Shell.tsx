import { BottomNav } from "./BottomNav"
import { Navbar } from "./Navbar";

export function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
