'use client';

import { useState, useEffect } from 'react';
import { getPendingUsers, updateUserStatus } from '@/app/actions/user';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2 } from 'lucide-react';

interface PendingUser {
    id: string;
    name: string | null;
    email: string;
    createdAt: string | Date;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    async function fetchUsers() {
        try {
            const data = await getPendingUsers();
            setUsers(data as unknown as PendingUser[]); // Type safety vs Prisma return
        } catch {
            toast({
                variant: 'destructive',
                title: 'Помилка',
                description: 'Не вдалося завантажити користувачів',
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleStatusUpdate(userId: string, status: 'ACTIVE' | 'REJECTED') {
        const res = await updateUserStatus(userId, status);
        if (res.success) {
            toast({
                title: status === 'ACTIVE' ? 'Підтверджено' : 'Відхилено',
                description: `Користувача ${status === 'ACTIVE' ? 'активовано' : 'відхилено'}`,
            });
            fetchUsers();
        } else {
            toast({
                variant: 'destructive',
                title: 'Помилка',
                description: res.error,
            });
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Керування доступом</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Запити на реєстрацію</CardTitle>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Нових запитів немає</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ім&apos;я</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Дата реєстрації</TableHead>
                                    <TableHead className="text-right">Дії</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-green-500 hover:text-green-600 hover:bg-green-50"
                                                onClick={() => handleStatusUpdate(user.id, 'ACTIVE')}
                                            >
                                                <Check className="h-4 w-4 mr-1" /> Підтвердити
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleStatusUpdate(user.id, 'REJECTED')}
                                            >
                                                <X className="h-4 w-4 mr-1" /> Відхилити
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
