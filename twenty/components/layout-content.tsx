'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) {
        return <main className="flex-1 overflow-hidden flex flex-col">{children}</main>;
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground w-full">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
                <TopBar />
                <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
