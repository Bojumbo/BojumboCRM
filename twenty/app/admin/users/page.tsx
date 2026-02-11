'use client';

import { useState, useEffect } from 'react';
import { getPendingUsers, updateUserStatus, getAllUsers, updateUserRole, logActivity, deleteUser } from '@/app/actions/user';
import { getPermissions, updatePermissions, createRole, deleteRole, RolePermissions } from '@/app/actions/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Users, Shield, UserCheck, Briefcase, Lock, Unlock, Eye, PlusCircle, Edit3, Trash, Save, User as UserIcon, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

// Types
interface PendingUser {
    id: string;
    name: string | null;
    email: string;
    createdAt: string | Date;
    status: string;
    role: string;
    updatedAt?: string | Date;
}

export default function AdminUsersPage() {
    // Data State
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
    const [permissions, setPermissions] = useState<RolePermissions | null>(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'roles'>('users');
    const [selectedRoleTab, setSelectedRoleTab] = useState<string>('USER');
    const [newRoleName, setNewRoleName] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const { toast } = useToast();

    // Fetch initial data
    async function preventFlickerFetch() {
        try {
            const [pending, all, perms] = await Promise.all([
                getPendingUsers(),
                getAllUsers(),
                getPermissions()
            ]);
            setPendingUsers(pending as unknown as PendingUser[]);
            setAllUsers(all as unknown as PendingUser[]);
            setPermissions(perms);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // Combined fetch for refresh
    async function refreshData() {
        try {
            const [pending, all] = await Promise.all([
                getPendingUsers(),
                getAllUsers()
            ]);
            setPendingUsers(pending as unknown as PendingUser[]);
            setAllUsers(all as unknown as PendingUser[]);
        } catch { /* Silent */ }
    }

    // Permission sync
    async function syncPermissions() {
        try {
            const perms = await getPermissions();
            setPermissions(perms);
        } catch { /* Silent */ }
    }


    useEffect(() => {
        preventFlickerFetch();
        // Auto-refresh interval
        const interval = setInterval(() => {
            setRefreshTrigger(p => p + 1);
        }, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading) refreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    // Handlers
    async function handleStatusUpdate(userId: string, status: 'ACTIVE' | 'REJECTED') {
        const res = await updateUserStatus(userId, status);
        if (res.success) {
            toast({ title: status === 'ACTIVE' ? 'Approved' : 'Rejected', description: `User status updated to ${status}` });
            refreshData();
        }
    }

    async function handleRoleUpdate(userId: string, role: string) {
        const res = await updateUserRole(userId, role);
        if (res.success) {
            toast({ title: 'Role Updated', description: `User assigned to ${role}` });
            refreshData();
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: res.error });
        }
    }

    async function handleCreateRole() {
        if (!newRoleName.trim()) return;

        try {
            await createRole(newRoleName);
            setNewRoleName("");
            toast({ title: 'Role Created', description: `Role ${newRoleName} added successfully.` });
            await syncPermissions();
            setSelectedRoleTab(newRoleName.toUpperCase());
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
        }
    }

    async function handleDeleteRole(roleName: string) {
        if (!confirm(`Permanently delete role "${roleName}"? Users will revert to default role.`)) return;

        try {
            await deleteRole(roleName);
            toast({ title: 'Role Deleted', description: `Role ${roleName} removed.` });
            await syncPermissions();
            setSelectedRoleTab('USER');
            await refreshData(); // Refresh users to update their roles
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
        }
    }

    async function handleDeleteUser(userId: string) {
        if (!confirm('Permanently remove this user from the system? This action cannot be undone.')) return;

        const res = await deleteUser(userId);
        if (res.success) {
            toast({ title: 'User Purged', description: 'Subject has been removed from the registry.' });
            refreshData();
        } else {
            toast({ variant: 'destructive', title: 'System Error', description: res.error });
        }
    }

    async function savePermissions() {
        if (!permissions) return;
        const res = await updatePermissions(permissions);
        if (res.success) {
            toast({ title: 'Permissions Synced', description: 'Access control list updated.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error });
        }
    }

    const togglePermission = (role: string, resource: string, action: 'view' | 'create' | 'edit' | 'delete') => {
        if (!permissions) return;
        setPermissions({
            ...permissions,
            [role]: {
                ...permissions[role],
                [resource]: {
                    ...permissions[role][resource],
                    [action]: !permissions[role][resource][action]
                }
            }
        });
    };

    const isOnline = (user: PendingUser) => {
        if (!user.updatedAt) return false;
        const diff = new Date().getTime() - new Date(user.updatedAt).getTime();
        return diff < 5 * 60 * 1000;
    };

    // Helper to get role icon/color
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Badge className="bg-red-500 hover:bg-red-600 text-[10px]">ADMIN</Badge>;
            case 'USER': return <Badge variant="secondary" className="text-[10px]">STAFF</Badge>;
            default: return <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-600">{role}</Badge>;
        }
    };


    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Team Management</h1>
                    <p className="text-muted-foreground font-medium text-sm mt-1">Configure access protocols & roles.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border">
                    <button onClick={() => setActiveTab('users')} className={cn("px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2", activeTab === 'users' ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:bg-muted/50")}>
                        <Users className="h-3.5 w-3.5" /> Personnel <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[9px]">{allUsers.length}</Badge>
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={cn("px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 relative", activeTab === 'requests' ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:bg-muted/50")}>
                        <UserCheck className="h-3.5 w-3.5" /> Requests
                        {pendingUsers.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold animate-pulse">{pendingUsers.length}</span>}
                    </button>
                </div>
            </div>

            {/* Active Users Tab */}
            {activeTab === 'users' && (
                <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="border-b border-border bg-muted/10 pb-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Authorized Personnel</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/5 border-b border-border">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-widest text-muted-foreground p-4">User Identity</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role Assignment</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Activity</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-muted/20 border-b border-border">
                                        <TableCell className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                    {user.name?.substring(0, 2) || 'UN'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full ring-2 ring-background", isOnline(user) ? "bg-emerald-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700")} />
                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", isOnline(user) ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                                                    {isOnline(user) ? "Online" : "Offline"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4">
                                            <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px]">ADMIN</Badge>
                                        </TableCell>
                                        <TableCell className="p-4">
                                            <div className="flex items-center justify-end gap-2 text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium tabular-nums">{user.updatedAt ? new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-md hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all"
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
