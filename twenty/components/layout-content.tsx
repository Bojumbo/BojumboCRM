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
        <div className="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 w-full font-sans selection:bg-blue-500/30 transition-colors">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 md:ml-[240px] transition-all duration-300">
                <TopBar />
                <main className="flex-1 overflow-x-hidden p-2 md:p-3 h-[calc(100vh-48px)]">
                    <div className="max-w-[1600px] mx-auto w-full h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
