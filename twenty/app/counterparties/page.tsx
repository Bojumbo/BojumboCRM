'use client';

import { useState, useEffect } from 'react';
import { getCounterparties, createCounterparty, deleteCounterparty } from '@/app/actions/counterparty';
import { Counterparty, CounterpartyType } from '@prisma/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Users, Trash2, Loader2, ArrowRight, Building2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CounterpartyDetailsDrawer } from '@/components/counterparty-details-drawer';

export default function CounterpartiesPage() {
    const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    // Details Drawer state
    const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Create Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newCounterparty, setNewCounterparty] = useState({
        type: CounterpartyType.INDIVIDUAL,
        name: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
    });

    const fetchCounterparties = async () => {
        setLoading(true);
        const data = await getCounterparties();
        setCounterparties(data as unknown as Counterparty[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchCounterparties();
    }, []);

    const handleCreateCounterparty = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const res = await createCounterparty({
            ...newCounterparty,
        });

        if (res.success) {
            toast({ title: 'Counterparty created successfully' });
            setIsCreateOpen(false);
            setNewCounterparty({
                type: CounterpartyType.INDIVIDUAL,
                name: '',
                taxId: '',
                email: '',
                phone: '',
                address: '',
                contactPerson: '',
            });
            fetchCounterparties();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error });
        }
        setCreating(false);
    };

    const handleDeleteCounterparty = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this counterparty?')) return;

        const res = await deleteCounterparty(id);
        if (res.success) {
            toast({ title: 'Counterparty deleted' });
            fetchCounterparties();
        }
    };

    const handleOpenCounterparty = (id: string) => {
        setSelectedCounterpartyId(id);
        setIsDetailsOpen(true);
    };

    const filteredCounterparties = counterparties.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.taxId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && counterparties.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col space-y-8 h-full max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black flex items-center gap-3">
                        <Users className="h-10 w-10 text-primary" /> Counterparties
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage your clients (Individuals and Legal Entities)</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search counterparties..."
                            className="pl-10 w-[300px] h-11 bg-card border-none shadow-sm rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-6 rounded-xl font-bold gap-2">
                                <Plus className="h-5 w-5" /> New Counterparty
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl">
                            <form onSubmit={handleCreateCounterparty}>
                                <DialogHeader className="p-8 bg-secondary/20">
                                    <DialogTitle className="text-2xl font-black">Create Counterparty</DialogTitle>
                                    <p className="text-sm text-muted-foreground">Add a new individual or company to your database</p>
                                </DialogHeader>
                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Type</label>
                                            <Select
                                                value={newCounterparty.type}
                                                onValueChange={(val) => setNewCounterparty({ ...newCounterparty, type: val as CounterpartyType })}
                                            >
                                                <SelectTrigger className="h-12 bg-secondary/30 border-none rounded-xl">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={CounterpartyType.INDIVIDUAL}>Individual (Фіз. особа)</SelectItem>
                                                    <SelectItem value={CounterpartyType.COMPANY}>Company (Юр. особа)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tax ID / EDRPOU</label>
                                            <Input
                                                placeholder="Tax ID"
                                                value={newCounterparty.taxId}
                                                onChange={(e) => setNewCounterparty({ ...newCounterparty, taxId: e.target.value })}
                                                className="h-12 bg-secondary/30 border-none rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                            {newCounterparty.type === CounterpartyType.INDIVIDUAL ? 'Full Name' : 'Company Name'}
                                        </label>
                                        <Input
                                            required
                                            placeholder={newCounterparty.type === CounterpartyType.INDIVIDUAL ? "John Doe" : "Bojumbo Tech LLC"}
                                            value={newCounterparty.name}
                                            onChange={(e) => setNewCounterparty({ ...newCounterparty, name: e.target.value })}
                                            className="h-12 bg-secondary/30 border-none rounded-xl text-md"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                                            <Input
                                                type="email"
                                                placeholder="client@example.com"
                                                value={newCounterparty.email}
                                                onChange={(e) => setNewCounterparty({ ...newCounterparty, email: e.target.value })}
                                                className="h-12 bg-secondary/30 border-none rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone</label>
                                            <Input
                                                placeholder="+380..."
                                                value={newCounterparty.phone}
                                                onChange={(e) => setNewCounterparty({ ...newCounterparty, phone: e.target.value })}
                                                className="h-12 bg-secondary/30 border-none rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    {newCounterparty.type === CounterpartyType.COMPANY && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Contact Person</label>
                                            <Input
                                                placeholder="Principal contact name"
                                                value={newCounterparty.contactPerson}
                                                onChange={(e) => setNewCounterparty({ ...newCounterparty, contactPerson: e.target.value })}
                                                className="h-12 bg-secondary/30 border-none rounded-xl"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Address</label>
                                        <Input
                                            placeholder="Physical or legal address"
                                            value={newCounterparty.address}
                                            onChange={(e) => setNewCounterparty({ ...newCounterparty, address: e.target.value })}
                                            className="h-12 bg-secondary/30 border-none rounded-xl"
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="p-8 bg-secondary/10 flex items-center justify-between">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="font-bold">Cancel</Button>
                                    <Button type="submit" className="font-bold px-8" disabled={creating}>
                                        {creating ? 'Creating...' : 'Create Counterparty'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-secondary/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Name / Company</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Contact Details</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Tax ID</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCounterparties.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-24">
                                    <div className="space-y-4">
                                        <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">No counterparties found</p>
                                        <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="rounded-xl">Add your first counterparty</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCounterparties.map((c) => (
                                <TableRow
                                    key={c.id}
                                    className="group hover:bg-primary/5 border-b border-foreground/5 cursor-pointer transition-all"
                                    onClick={() => handleOpenCounterparty(c.id)}
                                >
                                    <TableCell className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-secondary/50 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                {c.type === CounterpartyType.COMPANY ? (
                                                    <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                ) : (
                                                    <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-lg">{c.name}</span>
                                                {c.contactPerson && (
                                                    <span className="text-xs text-muted-foreground">Contact: {c.contactPerson}</span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <Badge variant={c.type === CounterpartyType.COMPANY ? 'default' : 'secondary'} className="rounded-lg px-3 py-1 uppercase text-[10px] font-black tracking-widest">
                                            {c.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            {c.email && <span className="text-sm font-medium">{c.email}</span>}
                                            {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <code className="bg-secondary/50 px-3 py-1 rounded-lg text-xs font-bold text-muted-foreground">
                                            {c.taxId || 'N/A'}
                                        </code>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 isolate">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive shadow-sm"
                                                onClick={(e) => handleDeleteCounterparty(c.id, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <CounterpartyDetailsDrawer
                counterpartyId={selectedCounterpartyId}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUpdate={fetchCounterparties}
            />
        </div>
    );
}
