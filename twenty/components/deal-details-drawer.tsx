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
import { getAllUsers } from "@/app/actions/user";
import { Deal, Comment, DealProduct, Product, Counterparty, User as PrismaUser } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, MessageSquare, Package, X, User, Building2, Hash, Briefcase, Send, FileText, Layers, Search, Check, ChevronsUpDown } from "lucide-react";
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
    managers: PrismaUser[];
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
    const [allUsers, setAllUsers] = useState<PrismaUser[]>([]);
    const [newComment, setNewComment] = useState("");
    const { toast } = useToast();

    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCounterparties = counterparties.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c as any).email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c as any).phone?.includes(searchTerm)
    );

    const [productSearchTerm, setProductSearchTerm] = useState("");

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearchTerm.toLowerCase()))
    );

    const [managerSearchTerm, setManagerSearchTerm] = useState("");

    const [activeTab, setActiveTab] = useState<'comments' | 'products'>('comments');

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
        const [prods, counters, users] = await Promise.all([
            getProducts(),
            getCounterparties(),
            getAllUsers()
        ]);
        setProducts(prods as unknown as Product[]);
        setCounterparties(counters as unknown as Counterparty[]);
        setAllUsers(users as unknown as PrismaUser[]);
    };

    useEffect(() => {
        if (open && dealId) {
            fetchDeal();
            fetchData();
        }
    }, [open, dealId, fetchDeal]);

    const handleUpdateDeal = async (field: keyof Deal | 'counterpartyId' | 'managerIds', value: any) => {
        if (!deal) return;
        const res = await updateDeal(deal.id, { [field]: value });
        if (res.success) {
            if (field === 'counterpartyId' || field === 'managerIds') {
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
                <SheetContent className="w-[80vw] !max-w-[80vw] bg-background border-border p-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </SheetContent>
            </Sheet>
        );
    }

    if (!deal) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[80vw] !max-w-[80vw] bg-background border-l border-border p-0 flex flex-row shadow-2xl overflow-hidden focus:outline-none focus:ring-0 [&>button]:hidden sm:max-w-none">

                {/* LEFT COLUMN (25%) - Information & Metadata */}
                <div className="w-1/4 min-w-[300px] border-r border-border bg-muted/10 flex flex-col h-full z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                    {/* Header Info */}
                    <div className="p-6 border-b border-border bg-background/50 backdrop-blur-sm space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col items-end">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                                    {deal.status}
                                </Badge>
                                <span className="text-[8px] text-muted-foreground font-mono mt-1 opacity-50">ID: {deal.id.split('-')[0]}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Deal Title</label>
                            <Input
                                value={deal.title}
                                onChange={(e) => setDeal({ ...deal, title: e.target.value })}
                                onBlur={() => handleUpdateDeal("title", deal.title)}
                                className="text-lg font-bold bg-transparent border-transparent hover:border-border focus:border-blue-500/50 focus:bg-background h-auto px-2 py-1 -ml-2 transition-all rounded-md text-foreground disabled:opacity-100 disabled:cursor-default"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Valuation</label>
                            <div className="text-3xl font-black text-foreground font-mono tracking-tighter">
                                ${Number(deal.amount).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Details */}
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8">
                            {/* Counterparty Config */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-3 w-3" /> Counterparty Node
                                </label>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-full justify-between h-9 text-xs font-bold bg-background border-border"
                                        >
                                            {deal.counterpartyId
                                                ? counterparties.find((c) => c.id === deal.counterpartyId)?.name
                                                : "Select Counterparty..."}
                                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 bg-popover border-border" align="start">
                                        <div className="flex items-center border-b border-border px-3">
                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
                                            <input
                                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-xs outline-none placeholder:text-muted-foreground/50 text-foreground font-medium disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Search by name, email, phone..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-1">
                                            {filteredCounterparties.length === 0 && (
                                                <div className="py-6 text-center text-xs font-medium text-muted-foreground">No matches found.</div>
                                            )}
                                            {filteredCounterparties.map((c) => (
                                                <div
                                                    key={c.id}
                                                    className={cn(
                                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors",
                                                        deal.counterpartyId === c.id && "bg-accent text-accent-foreground"
                                                    )}
                                                    onClick={() => {
                                                        handleUpdateDeal('counterpartyId', c.id);
                                                        setComboboxOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-3 w-3 text-blue-500",
                                                            deal.counterpartyId === c.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="font-bold truncate">{c.name}</span>
                                                        {((c as any).email || (c as any).phone) && (
                                                            <span className="text-[9px] text-muted-foreground font-mono truncate opacity-70">
                                                                {(c as any).email} {(c as any).phone ? `• ${(c as any).phone}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <div
                                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-[10px] outline-none hover:bg-red-500/10 hover:text-red-500 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 mt-1 border-t border-border font-black uppercase tracking-widest text-muted-foreground transition-colors justify-center"
                                                onClick={() => {
                                                    handleUpdateDeal('counterpartyId', null);
                                                    setComboboxOpen(false);
                                                }}
                                            >
                                                <X className="mr-2 h-3 w-3" />
                                                De-link Counterparty
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-3 w-3" /> Responsible Manager
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start h-auto min-h-[36px] px-2 py-1.5 text-xs font-bold bg-background border-border"
                                        >
                                            <div className="flex flex-wrap gap-1">
                                                {deal.managers.length > 0 ? (
                                                    deal.managers.map(m => (
                                                        <Badge key={m.id} variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-5 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                            {m.name || m.email}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground font-medium">Assign Managers...</span>
                                                )}
                                            </div>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 bg-popover border-border shadow-xl">
                                        <div className="flex items-center border-b border-border px-3">
                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
                                            <input
                                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-xs outline-none placeholder:text-muted-foreground/50 text-foreground font-medium disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Search managers..."
                                                value={managerSearchTerm}
                                                onChange={(e) => setManagerSearchTerm(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-1">
                                            {allUsers.filter(u =>
                                                (u.name?.toLowerCase().includes(managerSearchTerm.toLowerCase())) ||
                                                (u.email.toLowerCase().includes(managerSearchTerm.toLowerCase()))
                                            ).map((u) => {
                                                const isSelected = deal.managers.some(m => m.id === u.id);
                                                return (
                                                    <div
                                                        key={u.id}
                                                        className={cn(
                                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                                                            isSelected && "bg-accent/50"
                                                        )}
                                                        onClick={() => {
                                                            const newManagerIds = isSelected
                                                                ? deal.managers.filter(m => m.id !== u.id).map(m => m.id)
                                                                : [...deal.managers.map(m => m.id), u.id];
                                                            handleUpdateDeal('managerIds', newManagerIds);
                                                        }}
                                                    >
                                                        <div className={cn(
                                                            "mr-2 flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary transition-colors",
                                                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                                        )}>
                                                            {isSelected && <Check className="h-3 w-3" />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{u.name || 'Unnamed User'}</span>
                                                            <span className="text-[9px] text-muted-foreground font-mono opacity-70">{u.email}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Hash className="h-3 w-3" /> Sequence Reference
                                </label>
                                <div className="h-9 px-3 bg-muted/20 border border-border rounded-md flex items-center text-[10px] font-mono text-muted-foreground">
                                    {deal.id.split('-')[0].toUpperCase()} / 2024 / STABLE
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    Description Protocol
                                </label>
                                <Textarea
                                    value={deal.description || ""}
                                    onChange={(e) => setDeal({ ...deal, description: e.target.value })}
                                    onBlur={() => handleUpdateDeal("description", deal.description || "")}
                                    placeholder="Enter operational parameters..."
                                    className="bg-background border-border rounded-md resize-none min-h-[120px] focus:border-blue-500/30 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/40 disabled:opacity-100 disabled:cursor-default"
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Left Footer */}
                    <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3 opacity-60">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">System Active</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (75%) - Tabs & Content */}
                <div className="flex-1 flex flex-col h-full bg-background min-w-0">
                    {/* Header / Tabs Nav */}
                    <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-background shrink-0">
                        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'comments'
                                        ? "bg-background text-foreground shadow-sm border border-border/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Communication
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'products'
                                        ? "bg-background text-foreground shadow-sm border border-border/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5" />
                                    Inventory
                                </div>
                            </button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-h-0 bg-muted/5 relative">
                        {/* COMMENTS TAB */}
                        {activeTab === 'comments' && (
                            <div className="h-full flex flex-col">
                                <ScrollArea className="flex-1 p-6">
                                    <div className="max-w-3xl mx-auto space-y-8">
                                        {deal.comments.length === 0 && (
                                            <div className="text-center py-24 space-y-6 flex flex-col items-center opacity-50">
                                                <div className="h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center">
                                                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No Communication Logs</p>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase mt-2 tracking-tighter">System awaiting input sequence...</p>
                                                </div>
                                            </div>
                                        )}
                                        {deal.comments.map((comment: Comment) => (
                                            <div key={comment.id} className="group/comment flex gap-4">
                                                <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center text-[10px] font-black text-blue-500 shadow-sm shrink-0 mt-1">
                                                    AU
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin_Terminal</span>
                                                        <span className="text-[9px] text-muted-foreground font-bold uppercase tabular-nums opacity-50">
                                                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 bg-card border border-border rounded-xl rounded-tl-none shadow-sm text-sm text-foreground leading-relaxed">
                                                        {comment.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t border-border bg-background">
                                    <div className="max-w-3xl mx-auto relative isolate group">
                                        <Textarea
                                            placeholder="Enter communication sequence..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="bg-muted/30 border-border min-h-[80px] text-xs pr-14 resize-none rounded-xl focus:border-blue-500/50 focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50"
                                        />
                                        <Button
                                            className="absolute bottom-3 right-3 h-8 w-8 p-0 rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PRODUCTS TAB */}
                        {activeTab === 'products' && (
                            <div className="h-full flex flex-col">
                                <div className="p-4 border-b border-border bg-background flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Manifest</h3>
                                        <Badge variant="outline" className="h-5 px-1.5 border-border text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                                            {deal.products.length} Items Loaded
                                        </Badge>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted">
                                                <Plus className="mr-2 h-3.5 w-3.5" /> Append Item
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[380px] p-0 bg-popover border-border shadow-2xl overflow-hidden" align="end">
                                            {/* ... rest of content remains ... */}
                                            <div className="p-2">
                                                {isCreatingProduct ? (
                                                    <div className="p-6 space-y-5">
                                                        <div className="flex justify-between items-center">
                                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Matrix Injection</h5>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsCreatingProduct(false)}>
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                        <Input placeholder="Label Designation" value={newProductData.name} onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })} className="h-9 text-xs" />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <Input placeholder="Valuation" type="number" value={newProductData.defaultPrice} onChange={(e) => setNewProductData({ ...newProductData, defaultPrice: e.target.value })} className="h-9 text-xs font-mono" />
                                                            <Input placeholder="SKU Code" value={newProductData.sku} onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })} className="h-9 text-xs font-mono" />
                                                        </div>
                                                        <Button className="w-full bg-blue-600 hover:bg-blue-500 font-black h-9 text-[10px] uppercase tracking-widest text-white" onClick={handleCreateNewProduct}>COMMENCE INJECTION</Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="px-3 pb-2 mb-2 border-b border-border">
                                                            <div className="flex items-center gap-2">
                                                                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                <input
                                                                    className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 font-medium h-8 w-full"
                                                                    placeholder="Search products & SKU..."
                                                                    value={productSearchTerm}
                                                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[300px] overflow-y-auto py-2">
                                                            {filteredProducts.length === 0 && (
                                                                <div className="py-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">No matches found</div>
                                                            )}
                                                            {filteredProducts.map((p: Product) => (
                                                                <Button key={p.id} variant="ghost" className="w-full justify-between h-10 px-4 text-xs font-medium" onClick={() => handleAddProductToDeal(p)}>
                                                                    <span className="flex items-center gap-2 truncate">
                                                                        <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                        <span className="truncate">{p.name}</span>
                                                                        {p.sku && <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1 rounded">{p.sku}</span>}
                                                                    </span>
                                                                    <span className="font-mono text-muted-foreground shrink-0">${Number(p.defaultPrice)}</span>
                                                                </Button>
                                                            ))}
                                                        </div>
                                                        <div className="p-2 border-t border-border">
                                                            <Button variant="ghost" className="w-full h-8 text-[9px] font-black uppercase tracking-widest" onClick={() => setIsCreatingProduct(true)}>
                                                                <Plus className="mr-2 h-3.5 w-3.5" /> New Product
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-6">
                                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                                            <Table>
                                                <TableHeader className="bg-muted/50 border-b border-border">
                                                    <TableRow className="hover:bg-transparent border-none">
                                                        <TableHead className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Component</TableHead>
                                                        <TableHead className="w-[120px] px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">Unit Val</TableHead>
                                                        <TableHead className="w-[100px] px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">Qty</TableHead>
                                                        <TableHead className="text-right w-[120px] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Aggregate</TableHead>
                                                        <TableHead className="w-[50px] px-3 py-2"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {deal.products.map((dp) => (
                                                        <TableRow key={dp.id} className="hover:bg-muted/30 border-b border-border transition-colors">
                                                            <TableCell className="px-3 py-2">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-foreground">{dp.product.name}</span>
                                                                    <span className="text-[8px] font-mono text-muted-foreground uppercase mt-0.5">{dp.product.sku || 'NOC_SKU'}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-3 py-2">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <span className="text-[9px] font-black text-muted-foreground">$</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={Number(dp.priceAtSale)}
                                                                        onChange={(e) => handleUpdateProductPrice(dp.id, Number(e.target.value))}
                                                                        className="h-6 w-16 text-center bg-transparent border-transparent hover:border-border focus:bg-background focus:border-blue-500/50 transition-all font-mono text-[10px] text-foreground rounded-md p-0 disabled:opacity-100"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-3 py-2">
                                                                <Input
                                                                    type="number"
                                                                    value={dp.quantity}
                                                                    onChange={(e) => handleUpdateProductQuantity(dp.id, Number(e.target.value))}
                                                                    className="h-6 w-12 mx-auto text-center bg-transparent border-transparent hover:border-border focus:bg-background focus:border-blue-500/50 transition-all font-mono text-[10px] text-foreground rounded-md p-0 disabled:opacity-100"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right px-3 py-2 font-black font-mono text-foreground text-xs">
                                                                ${(Number(dp.priceAtSale) * dp.quantity).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="px-3 py-2">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleRemoveProduct(dp.id)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}