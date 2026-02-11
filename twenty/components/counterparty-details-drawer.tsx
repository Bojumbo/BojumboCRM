'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    getCounterparty,
    updateCounterparty,
} from "@/app/actions/counterparty";
import { Counterparty } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, User, Phone, Mail, MapPin, Hash, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
        if (data) setCounterparty(data as unknown as Counterparty);
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
                title: "Error",
                description: res.error
            });
        }
    };

    if (!counterparty && loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[800px] h-[80vh] flex items-center justify-center rounded-3xl">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </DialogContent>
            </Dialog>
        );
    }

    if (!counterparty) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[800px] h-[80vh] p-0 flex flex-col overflow-hidden rounded-3xl border-none shadow-2xl bg-card">
                <ScrollArea className="h-full">
                    <div className="p-8 space-y-8">
                        {/* Header Section */}
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    {counterparty.type === 'COMPANY' ? (
                                        <Building2 className="h-10 w-10 text-primary" />
                                    ) : (
                                        <User className="h-10 w-10 text-primary" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Badge className="mb-2 rounded-lg font-black tracking-widest uppercase text-[10px]">
                                        {counterparty.type}
                                    </Badge>
                                    <Input
                                        value={counterparty.name}
                                        onChange={(e) => setCounterparty({ ...counterparty, name: e.target.value })}
                                        onBlur={() => handleUpdate("name", counterparty.name)}
                                        className="text-3xl font-black bg-transparent border-transparent hover:border-input focus:bg-background h-auto px-1 py-0"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-foreground/5" />

                        <div className="grid grid-cols-2 gap-12">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">General Information</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 group">
                                            <Hash className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Tax ID / EDRPOU</p>
                                                <Input
                                                    value={counterparty.taxId || ""}
                                                    placeholder="N/A"
                                                    onChange={(e) => setCounterparty({ ...counterparty, taxId: e.target.value })}
                                                    onBlur={() => handleUpdate("taxId", counterparty.taxId)}
                                                    className="h-8 bg-transparent border-transparent hover:border-input focus:bg-background px-0 py-0"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 group">
                                            <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Email Address</p>
                                                <Input
                                                    value={counterparty.email || ""}
                                                    placeholder="No email provided"
                                                    onChange={(e) => setCounterparty({ ...counterparty, email: e.target.value })}
                                                    onBlur={() => handleUpdate("email", counterparty.email)}
                                                    className="h-8 bg-transparent border-transparent hover:border-input focus:bg-background px-0 py-0"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 group">
                                            <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Phone Number</p>
                                                <Input
                                                    value={counterparty.phone || ""}
                                                    placeholder="No phone provided"
                                                    onChange={(e) => setCounterparty({ ...counterparty, phone: e.target.value })}
                                                    onBlur={() => handleUpdate("phone", counterparty.phone)}
                                                    className="h-8 bg-transparent border-transparent hover:border-input focus:bg-background px-0 py-0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Address & More */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Additional Details</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 group">
                                            <MapPin className="h-4 w-4 mt-1 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Address</p>
                                                <Input
                                                    value={counterparty.address || ""}
                                                    placeholder="No address"
                                                    onChange={(e) => setCounterparty({ ...counterparty, address: e.target.value })}
                                                    onBlur={() => handleUpdate("address", counterparty.address)}
                                                    className="h-8 bg-transparent border-transparent hover:border-input focus:bg-background px-0 py-0"
                                                />
                                            </div>
                                        </div>

                                        {counterparty.type === 'COMPANY' && (
                                            <div className="flex items-center gap-3 group">
                                                <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Contact Person</p>
                                                    <Input
                                                        value={counterparty.contactPerson || ""}
                                                        placeholder="Name of contact"
                                                        onChange={(e) => setCounterparty({ ...counterparty, contactPerson: e.target.value })}
                                                        onBlur={() => handleUpdate("contactPerson", counterparty.contactPerson)}
                                                        className="h-8 bg-transparent border-transparent hover:border-input focus:bg-background px-0 py-0"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Associated Deals Section */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Briefcase className="h-3 w-3" /> Related Workflows
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {((counterparty as unknown) as { deals: { id: string; title: string; status: string; amount: number }[] }).deals?.length > 0 ? (
                                    ((counterparty as unknown) as { deals: { id: string; title: string; status: string; amount: number }[] }).deals.map((deal) => (
                                        <div key={deal.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl hover:bg-secondary/40 transition-colors border border-foreground/5 cursor-default">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{deal.title}</span>
                                                <span className="text-xs text-muted-foreground">Status: {deal.status}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black">${Number(deal.amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 bg-secondary/10 rounded-3xl border border-dashed border-foreground/10">
                                        <p className="text-sm text-muted-foreground font-medium">No workflows associated with this counterparty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
