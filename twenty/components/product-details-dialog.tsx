'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    getProduct,
    updateProduct,
} from "@/app/actions/product";
import { Product } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Tag, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Serialized type for client (Decimal -> number)
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
        if (data) setProduct(data as unknown as SerializedProduct);
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
            toast({
                variant: "destructive",
                title: "Error",
                description: res.error
            });
        }
    };

    if (!product && loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[60vw] h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </DialogContent>
            </Dialog>
        );
    }

    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] h-[90vh] p-0 flex flex-col overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Main Content */}
                    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-background/50">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-5 w-5 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product Card</span>
                            </div>
                            <Input
                                value={product.name}
                                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                                onBlur={() => handleUpdateProduct("name", product.name)}
                                className="text-4xl font-black bg-transparent border-transparent hover:border-input focus:bg-background h-auto px-1 py-0 mb-2 transition-all"
                            />
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Info className="h-4 w-4" /> Description
                                    </h4>
                                    <Textarea
                                        value={product.description || ""}
                                        onChange={(e) => setProduct({ ...product, description: e.target.value })}
                                        onBlur={() => handleUpdateProduct("description", product.description || "")}
                                        placeholder="Add a detailed product description..."
                                        className="bg-secondary/30 border-none resize-none min-h-[250px] focus-visible:ring-1 text-lg p-6 rounded-2xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-secondary/20 p-8 rounded-3xl space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Tag className="h-4 w-4" /> Pricing & Inventory
                                        </h4>

                                        <div className="grid gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground ml-1">DEFAULT PRICE</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                                                    <Input
                                                        type="number"
                                                        value={Number(product.defaultPrice)}
                                                        onChange={(e) => setProduct({ ...product, defaultPrice: e.target.value })}
                                                        onBlur={() => handleUpdateProduct("defaultPrice", Number(product.defaultPrice))}
                                                        className="h-16 pl-10 text-3xl font-black bg-background border-none shadow-sm rounded-2xl"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground ml-1">SKU / PRODUCT CODE</label>
                                                <Input
                                                    value={product.sku || ""}
                                                    onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                                                    onBlur={() => handleUpdateProduct("sku", product.sku || "")}
                                                    placeholder="e.g. PRD-001"
                                                    className="h-14 text-xl font-bold bg-background border-none shadow-sm rounded-2xl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-foreground/5" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-background/50 rounded-2xl">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Created At</p>
                                            <p className="text-sm font-medium">{new Date(product.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-2xl">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Last Update</p>
                                            <p className="text-sm font-medium">{new Date(product.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Analytics */}
                    <div className="w-full md:w-[350px] bg-card/30 flex flex-col border-l">
                        <div className="p-8 border-b">
                            <h4 className="text-lg font-bold">Analytics</h4>
                            <p className="text-xs text-muted-foreground">Product performance overview</p>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-8 space-y-6">
                                <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20">
                                    <p className="text-xs font-bold text-primary uppercase mb-2">Total Sales</p>
                                    <p className="text-3xl font-black text-primary">$0</p>
                                    <p className="text-[10px] text-primary/60 mt-2 font-medium">This feature is coming soon</p>
                                </div>
                                <div className="p-6 bg-secondary/30 rounded-3xl">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Active Deals</p>
                                    <p className="text-3xl font-black">0</p>
                                </div>
                            </div>
                        </ScrollArea>
                        <div className="p-8 border-t bg-background/50">
                            <Button variant="destructive" className="w-full h-12 rounded-2xl font-bold" onClick={() => { }}>
                                Archive Product
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
