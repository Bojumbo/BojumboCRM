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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getDealDetails,
    updateDeal,
    addComment,
    addDealProduct,
    updateDealProduct,
    removeDealProduct,
} from "@/app/actions/deal";
import { getProducts, createProduct } from "@/app/actions/product";
import { getCounterparties } from "@/app/actions/counterparty";
import { Deal, Comment, DealProduct, Product, Counterparty } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, MessageSquare, Package, X, User, Building2, Hash, Briefcase, ExternalLink, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type SerializedDealProduct = Omit<DealProduct, 'priceAtSale'> & {
    priceAtSale: string | number;
    product: Product;
};

type SerializedDeal = Omit<Deal, 'amount'> & {
    amount: string | number;
    comments: Comment[];
    products: SerializedDealProduct[];
    counterparty?: Counterparty | null;
};

interface DealDetailsDrawerProps {
    dealId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

export function DealDetailsDrawer({ dealId, open, onOpenChange, onUpdate }: DealDetailsDrawerProps) {
    const [deal, setDeal] = useState<SerializedDeal | null>(null);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
    const [newComment, setNewComment] = useState("");
    const { toast } = useToast();

    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: "",
        defaultPrice: "",
        sku: ""
    });

    const fetchDeal = useCallback(async () => {
        if (!dealId) return;
        setLoading(true);
        const data = await getDealDetails(dealId);
        if (data) setDeal(data as unknown as SerializedDeal);
        setLoading(false);
    }, [dealId]);

    const fetchData = async () => {
        const [prods, counters] = await Promise.all([
            getProducts(),
            getCounterparties()
        ]);
        setProducts(prods as unknown as Product[]);
        setCounterparties(counters as unknown as Counterparty[]);
    };

    useEffect(() => {
        if (open && dealId) {
            fetchDeal();
            fetchData();
        }
    }, [open, dealId, fetchDeal]);

    const handleUpdateDeal = async (field: keyof Deal | 'counterpartyId', value: string | number | null) => {
        if (!deal) return;
        const res = await updateDeal(deal.id, { [field]: value });
        if (res.success) {
            if (field === 'counterpartyId') {
                fetchDeal();
            } else {
                setDeal({ ...deal, [field]: value } as SerializedDeal);
            }
            if (onUpdate) onUpdate();
        } else {
            toast({ variant: "destructive", title: "Logic Sync Error", description: res.error });
        }
    };

    const handleAddComment = async () => {
        if (!deal || !newComment.trim()) return;
        const res = await addComment(deal.id, newComment);
        if (res.success) {
            setNewComment("");
            fetchDeal();
        }
    };

    const handleAddProductToDeal = async (product: Product) => {
        if (!deal) return;
        const res = await addDealProduct(deal.id, product.id, 1, Number(product.defaultPrice));
        if (res.success) {
            fetchDeal();
            if (onUpdate) onUpdate();
            toast({ title: "Registry: Product Link Established" });
        }
    };

    const handleUpdateProductQuantity = async (dpId: string, quantity: number) => {
        const res = await updateDealProduct(dpId, { quantity });
        if (res.success) {
            fetchDeal();
            if (onUpdate) onUpdate();
        }
    };

    const handleUpdateProductPrice = async (dpId: string, price: number) => {
        const res = await updateDealProduct(dpId, { priceAtSale: price });
        if (res.success) {
            fetchDeal();
            if (onUpdate) onUpdate();
        }
    };

    const handleRemoveProduct = async (dpId: string) => {
        const res = await removeDealProduct(dpId);
        if (res.success) {
            fetchDeal();
            if (onUpdate) onUpdate();
            toast({ title: "Registry: Product Link Severed" });
        }
    };

    const handleCreateNewProduct = async () => {
        if (!newProductData.name || !newProductData.defaultPrice) return;
        const res = await createProduct({
            name: newProductData.name,
            defaultPrice: Number(newProductData.defaultPrice),
            sku: newProductData.sku
        });
        if (res.success && res.data) {
            handleAddProductToDeal(res.data as unknown as Product);
            setIsCreatingProduct(false);
            setNewProductData({ name: "", defaultPrice: "", sku: "" });
            fetchData();
        }
    };

    if (!deal && loading) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="max-w-4xl bg-background border-border p-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </SheetContent>
            </Sheet>
        );
    }

    if (!deal) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* Виправлено: додано [&>button]:hidden для уникнення дублювання хрестика */}
            <SheetContent className="sm:max-w-4xl lg:max-w-[70vw] bg-background border-l border-border p-0 flex flex-col shadow-2xl overflow-hidden focus:outline-none focus:ring-0 [&>button]:hidden">

                {/* Header Section */}
                <div className="p-8 border-b border-border bg-muted/20 z-10 relative">

                    {/* Кнопка закриття (Ручна реалізація для контролю положення) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className="h-16 w-16 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm text-blue-500">
                                <Briefcase className="h-8 w-8" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
                                        {deal.status}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">LOG_ID: {deal.id}</span>
                                </div>
                                <Input
                                    value={deal.title}
                                    onChange={(e) => setDeal({ ...deal, title: e.target.value })}
                                    onBlur={() => handleUpdateDeal("title", deal.title)}
                                    className="text-2xl font-black bg-transparent border-transparent hover:border-border focus:border-blue-500/50 focus:bg-muted/30 h-auto p-0 hover:px-3 focus:px-3 transition-all rounded-md text-foreground"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Valuation</p>
                                <p className="text-3xl font-black text-foreground font-mono leading-none tracking-tighter">${Number(deal.amount).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-h-0 border-r border-border">
                        <ScrollArea className="flex-1">
                            <div className="p-10 space-y-12">
                                {/* Configuration Section */}
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Operational Config</h3>
                                        <div className="h-[1px] flex-1 bg-border/50 ml-4" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                <User className="h-3 w-3" /> Counterparty Node
                                            </label>
                                            <Select
                                                value={deal.counterpartyId || "none"}
                                                onValueChange={(val) => handleUpdateDeal('counterpartyId', val === "none" ? null : val)}
                                            >
                                                <SelectTrigger className="h-11 bg-muted/40 border-border rounded-md text-sm font-bold text-foreground focus:border-blue-500/30">
                                                    <SelectValue placeholder="System Lookup..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                                    <SelectItem value="none">De-linked</SelectItem>
                                                    {counterparties.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            <div className="flex items-center gap-2">
                                                                {c.type === 'COMPANY' ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                                                {c.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                <Hash className="h-3 w-3" /> Sequence Reference
                                            </label>
                                            <div className="h-11 px-4 bg-muted/20 border border-border rounded-md flex items-center text-xs font-mono text-muted-foreground italic">
                                                {deal.id.split('-')[0].toUpperCase()} / 2024 / STABLE
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            Description Protocol
                                        </label>
                                        <Textarea
                                            value={deal.description || ""}
                                            onChange={(e) => setDeal({ ...deal, description: e.target.value })}
                                            onBlur={() => handleUpdateDeal("description", deal.description || "")}
                                            placeholder="Enter operational parameters..."
                                            className="bg-muted/10 border-border rounded-md resize-none min-h-[120px] focus:border-blue-500/30 text-sm leading-relaxed text-foreground"
                                        />
                                    </div>
                                </section>

                                {/* Manifest Section (Line Items) */}
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Inventory Manifest</h3>
                                            <Badge variant="outline" className="h-5 px-1.5 border-border text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                                                {deal.products.length} Items Loaded
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 hover:text-blue-400">
                                                        <Plus className="mr-2 h-3.5 w-3.5" /> Append Item
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[380px] p-0 bg-popover border-border shadow-2xl overflow-hidden" align="end">
                                                    <div className="p-2">
                                                        {isCreatingProduct ? (
                                                            <div className="p-6 space-y-5">
                                                                <div className="flex justify-between items-center">
                                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Matrix Injection</h5>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsCreatingProduct(false)}>
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                                <Input
                                                                    placeholder="Label Designation"
                                                                    value={newProductData.name}
                                                                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                                                                    className="h-10 bg-muted/30 border-border text-sm"
                                                                />
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <Input
                                                                        placeholder="Valuation"
                                                                        type="number"
                                                                        value={newProductData.defaultPrice}
                                                                        onChange={(e) => setNewProductData({ ...newProductData, defaultPrice: e.target.value })}
                                                                        className="h-10 bg-muted/30 border-border text-sm font-mono"
                                                                    />
                                                                    <Input
                                                                        placeholder="SKU Code"
                                                                        value={newProductData.sku}
                                                                        onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })}
                                                                        className="h-10 bg-muted/30 border-border text-sm font-mono"
                                                                    />
                                                                </div>
                                                                <Button className="w-full bg-blue-600 hover:bg-blue-500 font-black h-10 text-[10px] uppercase tracking-widest text-white" onClick={handleCreateNewProduct}>COMMENCE INJECTION</Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="max-h-[300px] overflow-y-auto py-2">
                                                                    {products.length === 0 && (
                                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase p-10 text-center tracking-widest">No Buffer Entries</p>
                                                                    )}
                                                                    {products.map((p: Product) => (
                                                                        <Button
                                                                            key={p.id}
                                                                            variant="ghost"
                                                                            className="w-full justify-between h-12 px-4 text-xs font-bold text-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
                                                                            onClick={() => handleAddProductToDeal(p)}
                                                                        >
                                                                            <span className="flex items-center gap-2"><Package className="h-3 w-3 text-muted-foreground" /> {p.name}</span>
                                                                            <span className="font-mono text-muted-foreground">${Number(p.defaultPrice)}</span>
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                                <div className="p-2 border-t border-border">
                                                                    <Button
                                                                        variant="ghost"
                                                                        className="w-full justify-center h-10 text-[9px] text-muted-foreground hover:text-blue-500 font-black uppercase tracking-widest"
                                                                        onClick={() => setIsCreatingProduct(true)}
                                                                    >
                                                                        <Plus className="mr-2 h-3.5 w-3.5" /> Initialize New Matrix
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50 border-b border-border">
                                                <TableRow className="hover:bg-transparent border-none">
                                                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Component</TableHead>
                                                    <TableHead className="w-[140px] px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unit Val</TableHead>
                                                    <TableHead className="w-[100px] px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qty</TableHead>
                                                    <TableHead className="text-right w-[140px] px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aggregate</TableHead>
                                                    <TableHead className="w-[60px] px-6 py-4"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {deal.products.length === 0 && (
                                                    <TableRow className="hover:bg-transparent border-none">
                                                        <TableCell colSpan={5} className="text-center py-20 border-none">
                                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                                <Package className="h-10 w-10 text-muted-foreground" />
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Buffer Empty: No Line Items Assigned</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {deal.products.map((dp) => (
                                                    <TableRow key={dp.id} className="hover:bg-muted/30 border-b border-border transition-colors">
                                                        <TableCell className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-foreground">{dp.product.name}</span>
                                                                <span className="text-[9px] font-mono text-muted-foreground uppercase mt-0.5">{dp.product.sku || 'NOC_SKU'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-5">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="text-[10px] font-black text-muted-foreground focus-within:text-blue-500 transition-colors">$</span>
                                                                <Input
                                                                    type="number"
                                                                    value={Number(dp.priceAtSale)}
                                                                    onChange={(e) => handleUpdateProductPrice(dp.id, Number(e.target.value))}
                                                                    className="h-8 w-24 text-center bg-transparent border-transparent hover:border-border focus:bg-background focus:border-blue-500/50 transition-all font-mono text-xs text-foreground rounded-md"
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-5">
                                                            <Input
                                                                type="number"
                                                                value={dp.quantity}
                                                                onChange={(e) => handleUpdateProductQuantity(dp.id, Number(e.target.value))}
                                                                className="h-8 w-16 mx-auto text-center bg-transparent border-transparent hover:border-border focus:bg-background focus:border-blue-500/50 transition-all font-mono text-xs text-foreground rounded-md"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right px-6 py-5 font-black font-mono text-foreground text-sm">
                                                            ${(Number(dp.priceAtSale) * dp.quantity).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-5">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all rounded-md"
                                                                onClick={() => handleRemoveProduct(dp.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </section>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Sidebar / Comments & Logs */}
                    <div className="w-full md:w-[420px] lg:w-[480px] flex flex-col bg-muted/10 z-0">
                        <div className="p-8 border-b border-border bg-background/80 backdrop-blur-md">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                <MessageSquare className="h-4 w-4 text-blue-500/70" /> Logic Communication Logs
                            </h4>
                        </div>
                        <div className="flex-1 min-h-0 bg-gradient-to-b from-transparent to-muted/20">
                            <ScrollArea className="h-full px-8 py-10">
                                <div className="space-y-10">
                                    {deal.comments.length === 0 && (
                                        <div className="text-center py-24 space-y-6 flex flex-col items-center">
                                            <div className="h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center">
                                                <MessageSquare className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No Communication Logs Detected</p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-2 tracking-tighter">System awaiting input sequence...</p>
                                            </div>
                                        </div>
                                    )}
                                    {deal.comments.map((comment: Comment) => (
                                        <div key={comment.id} className="group/comment space-y-3 relative">
                                            <div className="flex justify-between items-center mr-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center text-[10px] font-black text-blue-500 shadow-sm">
                                                        AU
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin_Terminal</span>
                                                </div>
                                                <span className="text-[9px] text-muted-foreground font-bold uppercase tabular-nums">
                                                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="p-5 bg-card border border-border rounded-2xl rounded-tl-none group-hover/comment:bg-accent group-hover/comment:border-accent-foreground/10 transition-all shadow-sm">
                                                <p className="text-xs leading-relaxed text-foreground font-medium">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <div className="p-8 border-t border-border bg-background/80 backdrop-blur-md">
                            <div className="relative isolate group">
                                <Textarea
                                    placeholder="Enter communication sequence..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="bg-background border-border min-h-[110px] text-xs pr-12 resize-none rounded-xl focus:border-blue-500/50 focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/50"
                                />
                                <Button
                                    className="absolute bottom-3 right-3 h-10 w-10 p-0 rounded-lg bg-primary text-primary-foreground border border-border hover:bg-blue-600 transition-all disabled:opacity-30 shadow-lg"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Matrix State Synchronized</span>
                            <span className="text-[8px] text-muted-foreground/60 font-bold uppercase">System: Operational</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col text-right">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Modified By</span>
                            <span className="text-[9px] font-black text-foreground uppercase">SYS_ADMIN</span>
                        </div>
                        <div className="h-8 w-[1px] bg-border" />
                        <Badge className="bg-background text-muted-foreground border-border text-[9px] font-black uppercase px-2">
                            v.1.2.0
                        </Badge>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}