'use client';

import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct } from '@/app/actions/product';
import { Product } from '@prisma/client';
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
    DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Package, Trash2, Loader2, ArrowRight, Hash, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductDetailsDialog } from '@/components/product-details-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SerializedProduct = Omit<Product, 'defaultPrice'> & {
    defaultPrice: number | string;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<SerializedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        defaultPrice: '',
    });

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data as unknown as SerializedProduct[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const res = await createProduct({
            name: newProduct.name,
            sku: newProduct.sku,
            defaultPrice: Number(newProduct.defaultPrice),
        });

        if (res.success) {
            toast({ title: 'Registry Sync: Logic Entry Added' });
            setIsCreateOpen(false);
            setNewProduct({ name: '', sku: '', defaultPrice: '' });
            fetchProducts();
        } else {
            toast({ variant: 'destructive', title: 'Critical Error', description: res.error });
        }
        setCreating(false);
    };

    const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Execute purge sequence for this entry?')) return;

        const res = await deleteProduct(id);
        if (res.success) {
            toast({ title: 'Registry Update: Entry Purged' });
            fetchProducts();
        }
    };

    const openDetails = (id: string) => {
        setSelectedProductId(id);
        setIsDetailsOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading && products.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col space-y-12 h-full w-full max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center shadow-inner">
                            <Package className="h-5 w-5 text-blue-500" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Products</h1>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Asset Inventory & Valuation Matrix</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="System query..."
                            className="pl-10 w-[240px] md:w-[320px] h-10 bg-background border-border focus:border-blue-500/50 transition-all rounded-md text-xs placeholder:text-muted-foreground font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button onClick={() => setIsCreateOpen(true)} className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-black px-6 rounded-md transition-all shadow-lg shadow-blue-500/10 gap-2 text-xs tracking-tight">
                        <Plus className="h-4 w-4" /> INITIALIZE ASSET
                    </Button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                <Table>
                    <TableHeader className="bg-muted/50 border-b border-border">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asset Designation</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Node SKU</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Unit Val</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description Protocol</TableHead>
                            <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Sequence</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow className="hover:bg-transparent border-none">
                                <TableCell colSpan={5} className="text-center py-32 border-none">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="h-20 w-20 bg-muted border border-border border-dashed rounded-full flex items-center justify-center mb-2">
                                            <Package className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No Buffer Entries Detected</p>
                                            <p className="text-[11px] text-muted-foreground font-bold max-w-xs mx-auto leading-relaxed uppercase tracking-tighter opacity-50">Operational matrix is currently devoid of inventory nodes.</p>
                                        </div>
                                        <Button onClick={() => setIsCreateOpen(true)} className="bg-muted hover:bg-muted/80 text-foreground font-black px-8 rounded-md border border-border py-6 h-auto">
                                            COMMENCE INJECTION
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((p) => (
                                <TableRow
                                    key={p.id}
                                    className="group hover:bg-muted/50 border-b border-border cursor-pointer transition-all isolate"
                                    onClick={() => openDetails(p.id)}
                                >
                                    <TableCell className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 flex-shrink-0 bg-muted rounded-lg flex items-center justify-center border border-border group-hover:border-blue-500/50 transition-colors">
                                                <Package className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-white transition-colors truncate">{p.name}</span>
                                                <span className="text-[9px] uppercase font-black tracking-tighter text-muted-foreground transition-colors">TYPE: {p.sku ? 'QUANTIFIED' : 'UNSPECIFIED'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <code className="bg-muted px-2 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground">
                                            {p.sku || 'NOC_SKU'}
                                        </code>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-1 bg-muted px-3 py-1 rounded-md border border-border shadow-inner">
                                            <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
                                            <span className="text-sm font-black text-foreground font-mono">{Number(p.defaultPrice).toLocaleString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <p className="text-[10px] font-bold text-muted-foreground line-clamp-1 max-w-[280px] transition-colors">
                                            {p.description || 'PROTO_STUB: No specialized logic defined for this node.'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 isolate">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/50"
                                                onClick={(e) => handleDeleteProduct(p.id, e)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border text-muted-foreground group-hover:text-blue-500 transition-all group-hover:translate-x-1">
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProductDetailsDialog
                productId={selectedProductId}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUpdate={fetchProducts}
            />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-xl border-border bg-card shadow-2xl">
                    <form onSubmit={handleCreateProduct}>
                        <div className="p-8 border-b border-border bg-muted/30">
                            <h2 className="text-xl font-black text-foreground leading-none">Initialize Asset Node</h2>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Matrix Entry Registration</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Asset Designation</label>
                                <Input
                                    required
                                    placeholder="Enter logical label..."
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className="h-11 bg-background border-border rounded-md focus:border-blue-500/50 transition-all text-sm font-bold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Valuation ($)</label>
                                    <Input
                                        required
                                        type="number"
                                        placeholder="0.00"
                                        value={newProduct.defaultPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, defaultPrice: e.target.value })}
                                        className="h-11 bg-background border-border rounded-md focus:border-blue-500/50 transition-all text-sm font-mono"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Node SKU</label>
                                    <Input
                                        placeholder="SEQ-X-001"
                                        value={newProduct.sku}
                                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                        className="h-11 bg-background border-border rounded-md focus:border-blue-500/50 transition-all text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-muted/30 flex items-center justify-between border-t border-border">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors px-0 font-bold text-xs">DISCARD</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 rounded-md tracking-tight h-11 text-xs" disabled={creating}>
                                {creating ? 'PURGING BUFFER...' : 'EXECUTE INJECTION'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
