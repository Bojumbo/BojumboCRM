'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
    getCounterparty,
    updateCounterparty,
} from "@/app/actions/counterparty";
import { Counterparty } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, User, Phone, Mail, MapPin, Hash, Briefcase, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CounterpartyDetailsDrawerProps {
    counterpartyId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

export function CounterpartyDetailsDrawer({ counterpartyId, open, onOpenChange, onUpdate }: CounterpartyDetailsDrawerProps) {
    const [counterparty, setCounterparty] = useState<Counterparty | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchCounterparty = useCallback(async () => {
        if (!counterpartyId) return;
        setLoading(true);
        const data = await getCounterparty(counterpartyId);
        if (data && (data as any).success !== false) {
            setCounterparty(data as unknown as Counterparty);
        }
        setLoading(false);
    }, [counterpartyId]);

    useEffect(() => {
        if (open && counterpartyId) {
            fetchCounterparty();
        }
    }, [open, counterpartyId, fetchCounterparty]);

    const handleUpdate = async (field: keyof Counterparty, value: string | number | null) => {
        if (!counterparty) return;
        const res = await updateCounterparty(counterparty.id, { [field]: value });
        if (res.success) {
            setCounterparty({ ...counterparty, [field]: value } as Counterparty);
            if (onUpdate) onUpdate();
        } else {
            toast({
                variant: "destructive",
                title: "Sync Error",
                description: "Failed to persist changes to the ledger.",
            });
        }
    };

    if (!counterparty && loading) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-xl bg-black border-zinc-800 p-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </SheetContent>
            </Sheet>
        );
    }

    if (!counterparty) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl bg-[#0a0a0a] border-l border-zinc-800/50 p-0 flex flex-col shadow-2xl overflow-hidden focus:outline-none focus:ring-0">
                <div className="p-8 border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/30 to-transparent">
                    <div className="flex items-center gap-6 mb-2">
                        <div className="h-16 w-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner relative group/icon">
                            {counterparty.type === 'COMPANY' ? (
                                <Building2 className="h-7 w-7 text-blue-500 group-hover/icon:scale-110 transition-transform" />
                            ) : (
                                <User className="h-7 w-7 text-amber-500 group-hover/icon:scale-110 transition-transform" />
                            )}
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-black animate-pulse" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5 py-0 border-zinc-800 text-zinc-500 bg-zinc-900/50">
                                    {counterparty.type}
                                </Badge>
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest truncate">GUID: {counterparty.id}</span>
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight truncate">{counterparty.name}</h2>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-12 pb-20">
                        {/* Core Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Core Registry Information</h3>
                                <div className="h-[px] flex-1 bg-zinc-800/50 ml-4 line-height-0 overflow-hidden" style={{ height: '1px' }}></div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Legal Label</label>
                                    <Input
                                        value={counterparty.name}
                                        onChange={(e) => setCounterparty({ ...counterparty, name: e.target.value })}
                                        onBlur={() => handleUpdate('name', counterparty.name)}
                                        className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 transition-all rounded-md h-12 text-sm font-bold text-zinc-100"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Hash className="h-3 w-3" /> Identification Code
                                        </label>
                                        <Input
                                            value={counterparty.taxId || ''}
                                            placeholder="NOT_SET"
                                            onChange={(e) => setCounterparty({ ...counterparty, taxId: e.target.value })}
                                            onBlur={() => handleUpdate('taxId', counterparty.taxId)}
                                            className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 transition-all rounded-md h-11 text-xs font-mono text-zinc-300"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Entity Status</label>
                                        <div className="h-11 px-4 bg-zinc-900/20 border border-zinc-800/50 rounded-md flex items-center text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                                            Active Branch
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Communication Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Node Connections</h3>
                                <div className="h-[px] flex-1 bg-zinc-800/50 ml-4 overflow-hidden" style={{ height: '1px' }}></div>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="group relative">
                                    <div className="absolute left-3 top-3.5">
                                        <Mail className="h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <Input
                                        value={counterparty.email || ''}
                                        placeholder="system@protocol.io"
                                        onChange={(e) => setCounterparty({ ...counterparty, email: e.target.value })}
                                        onBlur={() => handleUpdate('email', counterparty.email)}
                                        className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 rounded-md h-11 text-xs pl-10 text-zinc-300 transition-all"
                                    />
                                    <div className="absolute right-3 top-3">
                                        <span className="text-[8px] font-black uppercase text-zinc-700">Email</span>
                                    </div>
                                </div>

                                <div className="group relative">
                                    <div className="absolute left-3 top-3.5">
                                        <Phone className="h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <Input
                                        value={counterparty.phone || ''}
                                        placeholder="+000 000 000 000"
                                        onChange={(e) => setCounterparty({ ...counterparty, phone: e.target.value })}
                                        onBlur={() => handleUpdate('phone', counterparty.phone)}
                                        className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 rounded-md h-11 text-xs pl-10 text-zinc-300 transition-all"
                                    />
                                    <div className="absolute right-3 top-3">
                                        <span className="text-[8px] font-black uppercase text-zinc-700">Phone</span>
                                    </div>
                                </div>

                                {counterparty.type === 'COMPANY' && (
                                    <div className="group relative">
                                        <div className="absolute left-3 top-3.5">
                                            <User className="h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <Input
                                            value={counterparty.contactPerson || ''}
                                            placeholder="Designated Representative"
                                            onChange={(e) => setCounterparty({ ...counterparty, contactPerson: e.target.value })}
                                            onBlur={() => handleUpdate('contactPerson', counterparty.contactPerson)}
                                            className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 rounded-md h-11 text-xs pl-10 text-zinc-300 transition-all"
                                        />
                                        <div className="absolute right-3 top-3">
                                            <span className="text-[8px] font-black uppercase text-zinc-700">Agent</span>
                                        </div>
                                    </div>
                                )}

                                <div className="group relative">
                                    <div className="absolute left-3 top-3.5">
                                        <MapPin className="h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <Input
                                        value={counterparty.address || ''}
                                        placeholder="Geo Location Data"
                                        onChange={(e) => setCounterparty({ ...counterparty, address: e.target.value })}
                                        onBlur={() => handleUpdate('address', counterparty.address)}
                                        className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 rounded-md h-11 text-xs pl-10 text-zinc-300 transition-all"
                                    />
                                    <div className="absolute right-3 top-3">
                                        <span className="text-[8px] font-black uppercase text-zinc-700">Geo</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Operations Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Operation Logs</h3>
                                <div className="h-[px] flex-1 bg-zinc-800/50 ml-4 overflow-hidden" style={{ height: '1px' }}></div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {((counterparty as any).deals)?.length > 0 ? (
                                    (counterparty as any).deals.map((deal: any) => (
                                        <div key={deal.id} className="group/deal p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900 transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800">
                                                    <Briefcase className="h-4 w-4 text-zinc-600 group-hover/deal:text-blue-500 transition-colors" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-zinc-200 group-hover/deal:text-white transition-colors">{deal.title}</span>
                                                    <span className="text-[10px] uppercase font-black tracking-tighter text-zinc-600">STATE: {deal.status}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-mono font-black text-zinc-400">
                                                    ${Number(deal.amount).toLocaleString()}
                                                </span>
                                                <ExternalLink className="h-3.5 w-3.5 text-zinc-700 opacity-0 group-hover/deal:opacity-100 transition-all cursor-pointer hover:text-white" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-10 rounded-xl bg-zinc-900/10 border border-zinc-800/50 border-dashed flex flex-col items-center justify-center text-center space-y-3">
                                        <div className="h-10 w-10 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800/50">
                                            <Briefcase className="h-4 w-4 text-zinc-800" />
                                        </div>
                                        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">No operation records detected</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <div className="p-6 bg-[#080808] border-t border-zinc-800/50 flex items-center justify-between relative">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Instance Synchronized</span>
                            <span className="text-[8px] text-zinc-600 font-bold uppercase">{new Date(counterparty.updatedAt).toISOString()}</span>
                        </div>
                    </div>
                    <Badge className="bg-zinc-900 text-zinc-500 hover:bg-zinc-800 border-zinc-800 text-[9px] font-black uppercase px-3 py-1">
                        Node v.1.0.4-stable
                    </Badge>
                </div>
            </SheetContent>
        </Sheet>
    );
}
