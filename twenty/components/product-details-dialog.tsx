'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    getProduct,
    updateProduct,
} from "@/app/actions/product";
import { Product } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Tag, Info, Hash, DollarSign, Clock, User, BarChart3, Archive } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SerializedProduct = Omit<Product, 'defaultPrice'> & {
    defaultPrice: number | string;
};

interface ProductDetailsDialogProps {
    productId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

export function ProductDetailsDialog({ productId, open, onOpenChange, onUpdate }: ProductDetailsDialogProps) {
    const [product, setProduct] = useState<SerializedProduct | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchProduct = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        const data = await getProduct(productId);
        if (data && (data as any).success !== false) {
            setProduct(data as unknown as SerializedProduct);
        }
        setLoading(false);
    }, [productId]);

    useEffect(() => {
        if (open && productId) {
            fetchProduct();
        }
    }, [open, productId, fetchProduct]);

    const handleUpdateProduct = async (field: keyof Product, value: string | number) => {
        if (!product) return;
        const res = await updateProduct(product.id, { [field]: value });
        if (res.success) {
            setProduct({ ...product, [field]: value } as SerializedProduct);
            if (onUpdate) onUpdate();
        } else {
            toast({ variant: "destructive", title: "Logic Sync Error", description: res.error });
        }
    };

    if (!product && loading) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-xl bg-black border-zinc-800 p-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </SheetContent>
            </Sheet>
        );
    }

    if (!product) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl bg-[#0a0a0a] border-l border-zinc-800/50 p-0 flex flex-col shadow-2xl overflow-hidden focus:outline-none focus:ring-0">
                <div className="p-8 border-b border-zinc-800/50 bg-[#0c0c0c]">
                    <div className="flex items-center gap-6 mb-2">
                        <div className="h-16 w-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner relative group/icon">
                            <Package className="h-7 w-7 text-blue-500 group-hover/icon:scale-110 transition-transform" />
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-black animate-pulse" />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5 py-0 border-zinc-800 text-zinc-500 bg-zinc-900/50">
                                    ASSET_NODE
                                </Badge>
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest truncate">GUID: {product.id}</span>
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight truncate">{product.name}</h2>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-12 pb-20">
                        {/* Core Definition */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Node Configuration</h3>
                                <div className="h-[1px] flex-1 bg-zinc-800/50 ml-4 line-height-0 overflow-hidden" />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Logical Label</label>
                                    <Input
                                        value={product.name}
                                        onChange={(e) => setProduct({ ...product, name: e.target.value })}
                                        onBlur={() => handleUpdateProduct('name', product.name)}
                                        className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 transition-all rounded-md h-12 text-sm font-bold text-zinc-100 placeholder:text-zinc-800"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Hash className="h-3 w-3" /> SKU Identifier
                                        </label>
                                        <Input
                                            value={product.sku || ''}
                                            placeholder="NOT_ASSIGNED"
                                            onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                                            onBlur={() => handleUpdateProduct("sku", product.sku || "")}
                                            className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 transition-all rounded-md h-11 text-xs font-mono text-zinc-300 placeholder:text-zinc-800"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <DollarSign className="h-3 w-3" /> Default Valuation
                                        </label>
                                        <div className="relative group/price">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700 group-hover/price:text-blue-500 transition-colors">$</span>
                                            <Input
                                                type="number"
                                                value={Number(product.defaultPrice)}
                                                onChange={(e) => setProduct({ ...product, defaultPrice: e.target.value })}
                                                onBlur={() => handleUpdateProduct("defaultPrice", Number(product.defaultPrice))}
                                                className="bg-zinc-900/40 border-zinc-800/50 focus:border-blue-500/50 transition-all rounded-md h-11 pl-7 text-sm font-mono text-zinc-100 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Description Protocol
                                    </label>
                                    <Textarea
                                        value={product.description || ""}
                                        onChange={(e) => setProduct({ ...product, description: e.target.value })}
                                        onBlur={() => handleUpdateProduct("description", product.description || "")}
                                        placeholder="Define asset operational parameters..."
                                        className="bg-zinc-900/20 border-zinc-800/50 rounded-md resize-none min-h-[140px] focus:border-blue-500/30 text-xs leading-relaxed text-zinc-300 transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Analytics Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Metrics & Telemetry</h3>
                                <div className="h-[1px] flex-1 bg-zinc-800/50 ml-4 line-height-0 overflow-hidden" />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-between group/metric">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover/metric:border-blue-500/30 transition-colors">
                                            <BarChart3 className="h-4 w-4 text-zinc-600 group-hover/metric:text-blue-500 transition-colors" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Aggregate Sales</span>
                                            <span className="text-xl font-black text-white font-mono mt-0.5">$0.00</span>
                                        </div>
                                    </div>
                                    <Badge className="bg-zinc-950 text-zinc-700 border-zinc-800 text-[8px] font-black uppercase tracking-tighter">DATA_PENDING</Badge>
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-900/10 border border-zinc-800 border-dashed flex flex-col items-center justify-center py-10 opacity-50">
                                    <Clock className="h-5 w-5 text-zinc-800 mb-3" />
                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Historical Data Streaming Restricted</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                {/* Footer Status */}
                <div className="p-6 bg-[#080808] border-t border-zinc-800/50 flex items-center justify-between relative mt-auto">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">Node Sequence Synchronized</span>
                            <span className="text-[8px] text-zinc-700 font-bold uppercase">{new Date(product.updatedAt).toISOString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[9px] font-black uppercase text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/30 gap-1.5">
                            <Archive className="h-3 w-3" /> Purge Entry
                        </Button>
                        <Badge className="bg-zinc-950 text-zinc-600 border-zinc-800 text-[9px] font-black uppercase px-2 shadow-inner">
                            v.1.0-NODE
                        </Badge>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
