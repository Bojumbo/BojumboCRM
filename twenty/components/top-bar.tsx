'use client';

import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from './ui/input';
import { useSession, signOut } from 'next-auth/react';
import { ModeToggle } from './mode-toggle';

export function TopBar() {
    const { data: session } = useSession();

    return (
        <div className="border-b border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
            <div className="flex h-16 items-center px-8 w-full justify-between gap-8">
                <div className="flex-1 max-w-sm relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-focus-within:bg-blue-500 transition-colors" />
                    </div>
                    <Input
                        placeholder="Quick search commands..."
                        className="h-9 w-full bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/50 focus:border-blue-500/50 transition-all pl-8 rounded-md text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        <span>System Health: <span className="text-emerald-500">Stable</span></span>
                        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                        <span>Region: <span className="text-zinc-600 dark:text-zinc-300">EU-WEST</span></span>
                    </div>

                    <ModeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 p-0 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all">
                                <div className="h-full w-full rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-2 shadow-2xl" align="end">
                            <DropdownMenuLabel className="font-normal p-4">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{session?.user?.name || 'Authorized User'}</p>
                                    <p className="text-[10px] uppercase font-black tracking-tighter text-zinc-400 dark:text-zinc-500">
                                        {session?.user?.email || 'SYSTEM_OPERATOR'}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
                            <DropdownMenuItem
                                onClick={() => signOut()}
                                className="text-zinc-600 dark:text-zinc-400 focus:text-zinc-900 dark:focus:text-zinc-100 focus:bg-zinc-100 dark:focus:bg-zinc-900 rounded-md cursor-pointer text-xs py-2.5"
                            >
                                Terminate Session
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
