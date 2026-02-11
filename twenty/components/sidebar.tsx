'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    FileText,
    Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomUser {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
}

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Workflows',
        href: '/deals',
        icon: Briefcase,
    },
    {
        title: 'Counterparties',
        href: '/counterparties',
        icon: Users,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Package,
    },
    {
        title: 'Documents',
        href: '/documents',
        icon: FileText,
    },
];

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user as CustomUser | undefined;
    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className={cn('w-[200px] border-r border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0a0a0a] h-screen hidden md:flex flex-col fixed left-0 top-0 z-40 transition-colors', className)}>
            <div className="flex px-3 h-10 items-center justify-center border-b border-zinc-200 dark:border-zinc-800/50">
                <span className="text-xs font-black tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                    Bojumbo<span className="text-blue-500">CRM</span>
                </span>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
                <div className="space-y-0.5">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-200 group",
                                    isActive
                                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 font-bold"
                                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent font-medium"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-3.5 w-3.5 transition-colors",
                                    isActive ? "text-blue-500" : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                                )} />
                                <span className="tracking-tight">{item.title}</span>
                            </Link>
                        );
                    })}
                </div>

                {isAdmin && (
                    <div className="space-y-2">
                        <div className="px-2 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                            Enterprise Control
                        </div>
                        <div className="space-y-0.5">
                            <Link
                                href="/admin/users"
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-200 group",
                                    pathname === "/admin/users"
                                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 font-bold"
                                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent font-medium"
                                )}
                            >
                                <Users className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 group-hover:text-amber-500 transition-colors" />
                                <span className="tracking-tight">Користувачі</span>
                            </Link>
                            <Link
                                href="/admin/pipelines"
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-200 group",
                                    pathname === "/admin/pipelines"
                                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 font-bold"
                                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent font-medium"
                                )}
                            >
                                <Briefcase className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 group-hover:text-amber-500 transition-colors" />
                                <span className="tracking-tight">Логіка & Воронки</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-2 border-t border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-black/50">
                <div className="px-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white uppercase italic">
                        {user?.name?.substring(0, 2) || 'AD'}
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-200 truncate">{user?.name || 'Administrator'}</span>
                        <span className="text-[8px] text-zinc-500 dark:text-zinc-500 truncate lowercase">{user?.email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
