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
        <div className={cn('w-[240px] border-r border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#0a0a0a] h-screen hidden md:flex flex-col fixed left-0 top-0 z-40 transition-colors', className)}>
            <div className="flex px-6 h-16 items-center border-b border-zinc-200 dark:border-zinc-800/50">
                <span className="text-sm font-black tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                    Bojumbo<span className="text-blue-500">CRM</span>
                </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                <div className="space-y-1">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 group",
                                    isActive
                                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
                                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-4 w-4 transition-colors",
                                    isActive ? "text-blue-500" : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                                )} />
                                <span className="font-medium tracking-tight">{item.title}</span>
                            </Link>
                        );
                    })}
                </div>

                {isAdmin && (
                    <div className="space-y-3">
                        <div className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                            Enterprise Control
                        </div>
                        <div className="space-y-1">
                            <Link
                                href="/admin/users"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 group",
                                    pathname === "/admin/users"
                                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
                                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent"
                                )}
                            >
                                <Users className="h-4 w-4 text-zinc-400 dark:text-zinc-600 group-hover:text-amber-500 transition-colors" />
                                <span className="font-medium tracking-tight">Користувачі</span>
                            </Link>
                            <Link
                                href="/admin/pipelines"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 group",
                                    pathname === "/admin/pipelines"
                                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
                                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent"
                                )}
                            >
                                <Briefcase className="h-4 w-4 text-zinc-400 dark:text-zinc-600 group-hover:text-amber-500 transition-colors" />
                                <span className="font-medium tracking-tight">Логіка & Воронки</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-black/50">
                <div className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase italic">
                        {user?.name?.substring(0, 2) || 'AD'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">{user?.name || 'Administrator'}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate lowercase">{user?.email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
