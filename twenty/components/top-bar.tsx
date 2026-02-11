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

export function TopBar() {
    const { data: session } = useSession();

    return (
        <div className="border-b bg-card sticky top-0 z-30">
            <div className="flex h-16 items-center px-4 w-full justify-between">
                <div className="flex-1 w-full max-w-sm">
                    <Input placeholder="Search..." className="h-9 w-[150px] lg:w-[300px]" />
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{session?.user?.name || 'User Name'}</p>
                                    <p className="text-xs leading-none text-muted-foreground mr-2">
                                        {session?.user?.email || 'user@example.com'}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
