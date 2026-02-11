'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    Settings,
    Users,
    Briefcase,
    FileText,
    ShieldCheck,
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
        title: 'Deals',
        href: '/deals',
        icon: Briefcase,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Package,
    },
    {
        title: 'Contacts',
        href: '/contacts',
        icon: Users,
    },
    {
        title: 'Documents',
        href: '/documents',
        icon: FileText,
    },
    {
        title: 'Settings',
        href: '/settings/pipelines',
        icon: Settings,
    },
];

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user as CustomUser | undefined;
    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className={cn('pb-12 w-64 border-r bg-card h-screen hidden md:block fixed left-0 top-0', className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Twenty CRM
                    </h2>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Button
                                key={item.href}
                                variant={pathname === item.href ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </Link>
                            </Button>
                        ))}

                        {isAdmin && (
                            <Button
                                variant={pathname === '/admin/users' ? 'secondary' : 'ghost'}
                                className="w-full justify-start text-amber-500 hover:text-amber-600"
                                asChild
                            >
                                <Link href="/admin/users">
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Admin Panel
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
