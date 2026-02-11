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
import { cn } from "@/lib/utils";
import { Plus, Search, Users, Trash2, Loader2, ArrowRight, Building2, User } from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CounterpartyDetailsDrawer } from '@/components/counterparty-details-drawer';

export default function CounterpartiesPage() {
    const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { can, loading: permsLoading } = usePermission();

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

    if ((loading || permsLoading) && counterparties.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!can('counterparties', 'view')) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-widest text-foreground">Access Denied</h2>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Operational clearance недостаточно for counterparty ledger viewing.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        Counterparties
                        <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-0 border-border text-muted-foreground bg-muted">
                            {counterparties.length} Total
                        </Badge>
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">System ledger of all associated legal entities and individual clients.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="h-3.5 w-3.5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <Input
                            placeholder="Filter ledger..."
                            className="h-10 w-[280px] bg-background border-border focus:border-blue-500/50 transition-all pl-9 rounded-md text-xs placeholder:text-muted-foreground"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {can('counterparties', 'create') && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 px-6 rounded-md font-bold bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all gap-2">
                                    <Plus className="h-4 w-4" /> New Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-lg border-border bg-card shadow-2xl">
                                <form onSubmit={handleCreateCounterparty}>
                                    <div className="p-3 border-b border-border bg-muted/30">
                                        <h2 className="text-sm font-black text-foreground leading-none">Register Entity</h2>
                                        <p className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground mt-1">Counterparty Database Injection</p>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Legal Type</label>
                                            <Select
                                                value={newCounterparty.type as any}
                                                onValueChange={(val) => setNewCounterparty({ ...newCounterparty, type: val as any })}
                                            >
                                                <SelectTrigger className="h-8 bg-background border-border rounded-md text-foreground focus:ring-blue-500/50 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                                    <SelectItem value={CounterpartyType.INDIVIDUAL}>Individual Entity</SelectItem>
                                                    <SelectItem value={CounterpartyType.COMPANY}>Corporate Entity</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                                {(newCounterparty.type as any) === CounterpartyType.INDIVIDUAL ? 'Full Legal Name' : 'Company Designation'}
                                            </label>
                                            <Input
                                                required
                                                placeholder={(newCounterparty.type as any) === CounterpartyType.INDIVIDUAL ? "Alex Mercer" : "Global Industries Ltd"}
                                                value={newCounterparty.name}
                                                onChange={(e) => setNewCounterparty({ ...newCounterparty, name: e.target.value })}
                                                className="h-8 bg-background border-border rounded-md focus:border-blue-500/50 transition-all text-xs"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tax ID / SSN</label>
                                                <Input
                                                    placeholder="00-0000000"
                                                    value={newCounterparty.taxId}
                                                    onChange={(e) => setNewCounterparty({ ...newCounterparty, taxId: e.target.value })}
                                                    className="h-8 bg-background border-border rounded-md text-xs font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Communication Relay</label>
                                                <Input
                                                    type="email"
                                                    placeholder="entity@net.com"
                                                    value={newCounterparty.email}
                                                    onChange={(e) => setNewCounterparty({ ...newCounterparty, email: e.target.value })}
                                                    className="h-8 bg-background border-border rounded-md text-xs font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Voice Link</label>
                                            <Input
                                                placeholder="+000 000 00 00"
                                                value={newCounterparty.phone}
                                                onChange={(e) => setNewCounterparty({ ...newCounterparty, phone: e.target.value })}
                                                className="h-8 bg-background border-border rounded-md text-xs"
                                            />
                                        </div>

                                        {(newCounterparty.type as any) === CounterpartyType.COMPANY && (
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Designated Representative</label>
                                                <Input
                                                    placeholder="Lead contact person"
                                                    value={newCounterparty.contactPerson}
                                                    onChange={(e) => setNewCounterparty({ ...newCounterparty, contactPerson: e.target.value })}
                                                    className="h-8 bg-background border-border rounded-md text-xs"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Operating Address</label>
                                            <Input
                                                placeholder="Physical location"
                                                value={newCounterparty.address}
                                                onChange={(e) => setNewCounterparty({ ...newCounterparty, address: e.target.value })}
                                                className="h-8 bg-background border-border rounded-md text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="px-3 py-3 bg-muted/30 flex items-center justify-between border-t border-border">
                                        <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors px-0 font-bold text-[10px]">DISCARD</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black px-4 rounded-md tracking-tight h-8 text-[10px]" disabled={creating}>
                                            {creating ? 'PURGING...' : 'EXECUTE INJECTION'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border border-b">
                            <TableHead className="px-2 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Subject Designation</TableHead>
                            <TableHead className="px-2 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tax Identifier</TableHead>
                            <TableHead className="px-2 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contact Protocol</TableHead>
                            <TableHead className="px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCounterparties.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20 bg-muted/20">
                                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto space-y-3">
                                        <div className="h-10 w-10 bg-muted rounded-lg border border-border flex items-center justify-center shadow-inner">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-foreground tracking-tight">System Ledger Empty</h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">No active counterparties detected in the current partition. Initialize your first entry to begin operations.</p>
                                        </div>
                                        <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="rounded-md border-border hover:bg-muted text-foreground font-bold px-4 h-8 text-xs transition-all">
                                            Initialize Entry
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCounterparties.map((c) => (
                                <TableRow
                                    key={c.id}
                                    className="group hover:bg-muted/50 border-border border-b last:border-0 cursor-pointer transition-all duration-300"
                                    onClick={() => handleOpenCounterparty(c.id)}
                                >
                                    <TableCell className="px-2 py-1.5 align-top">
                                        <div className="flex items-start gap-2">
                                            <div className="h-8 w-8 mt-0.5 flex-shrink-0 bg-muted rounded-md flex items-center justify-center border border-border group-hover:border-blue-500/50 transition-colors">
                                                {c.type === CounterpartyType.COMPANY ? (
                                                    <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                                                ) : (
                                                    <User className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-[13px] text-foreground group-hover:text-blue-600 dark:group-hover:text-white transition-colors">{c.name}</span>
                                                <span className="text-[10px] uppercase font-black tracking-tighter text-muted-foreground transition-colors mt-0.5">
                                                    {c.contactPerson && <span className="text-foreground/70 mr-1.5 font-bold">REP: {c.contactPerson}</span>}
                                                    {c.type}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-2 py-1.5 align-top">
                                        <code className="bg-muted px-2 py-1 rounded border border-border text-[11px] font-bold font-mono text-muted-foreground block w-fit shadow-sm">
                                            {c.taxId || 'NOC_TAX_ID'}
                                        </code>
                                    </TableCell>
                                    <TableCell className="px-2 py-1.5 align-top">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold font-mono text-muted-foreground">{c.email || 'NO_MAIL_RELAY'}</p>
                                            <p className="text-[11px] font-mono text-muted-foreground/60">{c.phone || 'NO_VOICE_LINK'}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-2 py-1.5 align-top text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {can('counterparties', 'delete') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20"
                                                    onClick={(e) => handleDeleteCounterparty(c.id, e)}
                                                >
                                                    <Trash2 className="h-2.5 w-2.5" />
                                                </Button>
                                            )}
                                            <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center border border-border text-muted-foreground group-hover:text-blue-500 transition-all group-hover:translate-x-1">
                                                <ArrowRight className="h-2.5 w-2.5" />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CounterpartyDetailsDrawer
                counterpartyId={selectedCounterpartyId}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUpdate={fetchCounterparties}
            />
        </div>
    );
}
