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
    getDealDetails,
    updateDeal,
    addComment,
    addDealProduct,
    updateDealProduct,
    removeDealProduct,
} from "@/app/actions/deal";
import { getProducts, createProduct } from "@/app/actions/product";
import { Deal, Comment, DealProduct, Product } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, MessageSquare, Package, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Serialized types for the client (Decimal -> string/number)
type SerializedDealProduct = Omit<DealProduct, 'priceAtSale'> & {
    priceAtSale: string | number;
    product: Product;
};

type SerializedDeal = Omit<Deal, 'amount'> & {
    amount: string | number;
    comments: Comment[];
    products: SerializedDealProduct[];
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

    const fetchProducts = async () => {
        const data = await getProducts();
        setProducts(data as unknown as Product[]);
    };

    useEffect(() => {
        if (open && dealId) {
            fetchDeal();
            fetchProducts();
        }
    }, [open, dealId, fetchDeal]);

    const handleUpdateDeal = async (field: keyof Deal, value: string | number) => {
        if (!deal) return;
        const res = await updateDeal(deal.id, { [field]: value });
        if (res.success) {
            setDeal({ ...deal, [field]: value } as SerializedDeal);
            if (onUpdate) onUpdate();
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
            toast({ title: "Product added to deal" });
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
            toast({ title: "Product removed" });
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
            fetchProducts();
        }
    };

    if (!deal && loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[90vw] h-[90vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </DialogContent>
            </Dialog>
        );
    }

    if (!deal) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] h-[90vh] p-0 flex flex-col overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    <div className="flex-1 p-6 overflow-y-auto space-y-8 border-r bg-background/50">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{deal.status}</Badge>
                            </div>
                            <Input
                                value={deal.title}
                                onChange={(e) => setDeal({ ...deal, title: e.target.value })}
                                onBlur={() => handleUpdateDeal("title", deal.title)}
                                className="text-3xl font-bold bg-transparent border-transparent hover:border-input focus:bg-background h-auto px-1 py-0 mb-1"
                            />
                        </DialogHeader>

                        {/* Description */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                            <Textarea
                                value={deal.description || ""}
                                onChange={(e) => setDeal({ ...deal, description: e.target.value })}
                                onBlur={() => handleUpdateDeal("description", deal.description || "")}
                                placeholder="Add a description..."
                                className="bg-secondary/30 border-none resize-none min-h-[150px] focus-visible:ring-1 text-lg"
                            />
                        </div>

                        {/* Products / Line Items */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold flex items-center gap-2">
                                    <Package className="h-5 w-5" /> Line Items
                                </h4>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Plus className="mr-2 h-4 w-4" /> Add Product
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0" align="end">
                                        <div className="p-2 space-y-1">
                                            {isCreatingProduct ? (
                                                <div className="p-4 space-y-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h5 className="text-xs font-bold uppercase">New Product</h5>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreatingProduct(false)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <Input
                                                        placeholder="Product Name"
                                                        value={newProductData.name}
                                                        onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                                                        className="h-9 text-sm"
                                                    />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Price</label>
                                                            <Input
                                                                placeholder="0.00"
                                                                type="number"
                                                                value={newProductData.defaultPrice}
                                                                onChange={(e) => setNewProductData({ ...newProductData, defaultPrice: e.target.value })}
                                                                className="h-9 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">SKU (optional)</label>
                                                            <Input
                                                                placeholder="ABC-123"
                                                                value={newProductData.sku}
                                                                onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })}
                                                                className="h-9 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button className="w-full mt-2" size="sm" onClick={handleCreateNewProduct}>Create & Add</Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="max-h-[300px] overflow-y-auto">
                                                        {products.length === 0 && (
                                                            <p className="text-xs text-muted-foreground p-4 text-center">No products found</p>
                                                        )}
                                                        {products.map((p: Product) => (
                                                            <Button
                                                                key={p.id}
                                                                variant="ghost"
                                                                className="w-full justify-between h-10 px-4 text-sm font-normal"
                                                                onClick={() => handleAddProductToDeal(p)}
                                                            >
                                                                <span>{p.name}</span>
                                                                <span className="text-muted-foreground">${Number(p.defaultPrice)}</span>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                    <Separator />
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-center h-10 text-sm text-primary hover:text-primary font-medium"
                                                        onClick={() => setIsCreatingProduct(true)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" /> Create New Product
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="border rounded-xl overflow-hidden bg-card/30">
                                <Table>
                                    <TableHeader className="bg-secondary/50">
                                        <TableRow>
                                            <TableHead className="px-6 py-4">Product</TableHead>
                                            <TableHead className="w-[150px] px-6 py-4 text-center">Price</TableHead>
                                            <TableHead className="w-[100px] px-6 py-4 text-center">Qty</TableHead>
                                            <TableHead className="text-right w-[150px] px-6 py-4">Total</TableHead>
                                            <TableHead className="w-[60px] px-6 py-4"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deal.products.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                                    No products added to this deal
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {deal.products.map((dp) => (
                                            <TableRow key={dp.id} className="hover:bg-accent/5">
                                                <TableCell className="font-medium px-6 py-4">
                                                    {dp.product.name}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center justify-center">
                                                        <span className="mr-1 text-muted-foreground">$</span>
                                                        <Input
                                                            type="number"
                                                            value={Number(dp.priceAtSale)}
                                                            onChange={(e) => handleUpdateProductPrice(dp.id, Number(e.target.value))}
                                                            className="h-8 w-24 text-center bg-transparent border-transparent hover:border-input focus:bg-background"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <Input
                                                        type="number"
                                                        value={dp.quantity}
                                                        onChange={(e) => handleUpdateProductQuantity(dp.id, Number(e.target.value))}
                                                        className="h-8 w-16 mx-auto text-center bg-transparent border-transparent hover:border-input focus:bg-background"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-4 font-semibold">
                                                    ${(Number(dp.priceAtSale) * dp.quantity).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                        onClick={() => handleRemoveProduct(dp.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="flex justify-end p-6 bg-secondary/20 border-t">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Amount</p>
                                        <span className="text-3xl font-black">${Number(deal.amount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Comments */}
                    <div className="w-full md:w-[400px] flex flex-col bg-card/30">
                        <div className="p-6 border-b">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" /> Activity & Comments
                            </h4>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ScrollArea className="h-full p-6">
                                <div className="space-y-6">
                                    {deal.comments.length === 0 && (
                                        <div className="text-center py-12 space-y-3">
                                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No comments yet. Start the conversation!</p>
                                        </div>
                                    )}
                                    {deal.comments.map((comment: Comment) => (
                                        <div key={comment.id} className="group space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        AU
                                                    </div>
                                                    <span className="text-sm font-bold">Admin User</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="p-4 bg-secondary/30 rounded-2xl rounded-tl-none group-hover:bg-secondary/40 transition-colors">
                                                <p className="text-sm leading-relaxed">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <div className="p-6 border-t bg-background/50">
                            <div className="relative">
                                <Textarea
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="bg-secondary/20 min-h-[100px] text-sm pr-12 resize-none"
                                />
                                <Button
                                    className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full"
                                    size="sm"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
