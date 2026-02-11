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
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Package, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductDetailsDialog } from '@/components/product-details-dialog';
import { Card } from '@/components/ui/card';

// Serialized type for client (Decimal -> number)
type SerializedProduct = Omit<Product, 'defaultPrice'> & {
    defaultPrice: number | string;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<SerializedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    // Create Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        defaultPrice: '',
    });

    // Details Modal state
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
            toast({ title: 'Product created successfully' });
            setIsCreateOpen(false);
            setNewProduct({ name: '', sku: '', defaultPrice: '' });
            fetchProducts();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error });
        }
        setCreating(false);
    };

    const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this product?')) return;

        const res = await deleteProduct(id);
        if (res.success) {
            toast({ title: 'Product deleted' });
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
                        <Package className="h-10 w-10 text-primary" /> Products
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage your product catalog and pricing</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            className="pl-10 w-[300px] h-11 bg-card border-none shadow-sm rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-6 rounded-xl font-bold gap-2">
                                <Plus className="h-5 w-5" /> New Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl">
                            <form onSubmit={handleCreateProduct}>
                                <DialogHeader className="p-8 bg-secondary/20">
                                    <DialogTitle className="text-2xl font-black">Create Product</DialogTitle>
                                    <p className="text-sm text-muted-foreground">Add a new item to your CRM catalog</p>
                                </DialogHeader>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Product Name</label>
                                        <Input
                                            required
                                            placeholder="E.g. Enterprise License"
                                            value={newProduct.name}
                                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                            className="h-12 bg-secondary/30 border-none rounded-xl text-md"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Default Price</label>
                                            <Input
                                                required
                                                type="number"
                                                placeholder="0.00"
                                                value={newProduct.defaultPrice}
                                                onChange={(e) => setNewProduct({ ...newProduct, defaultPrice: e.target.value })}
                                                className="h-12 bg-secondary/30 border-none rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">SKU</label>
                                            <Input
                                                placeholder="SKU-123"
                                                value={newProduct.sku}
                                                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                                className="h-12 bg-secondary/30 border-none rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-8 bg-secondary/10 flex items-center justify-between">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="font-bold">Cancel</Button>
                                    <Button type="submit" className="font-bold px-8" disabled={creating}>
                                        {creating ? 'Creating...' : 'Create Product'}
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
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Product Name</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">SKU</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Price</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-24">
                                    <div className="space-y-4">
                                        <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
                                            <Package className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">No products found</p>
                                        <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="rounded-xl">Add your first product</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((p) => (
                                <TableRow
                                    key={p.id}
                                    className="group hover:bg-primary/5 border-b border-foreground/5 cursor-pointer transition-all"
                                    onClick={() => openDetails(p.id)}
                                >
                                    <TableCell className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-secondary/50 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="font-bold text-lg">{p.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <code className="bg-secondary/50 px-3 py-1 rounded-lg text-xs font-bold text-muted-foreground">
                                            {p.sku || 'N/A'}
                                        </code>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-center">
                                        <span className="text-xl font-black">${Number(p.defaultPrice).toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                                            {p.description || 'No description provided'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 isolate">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive shadow-sm"
                                                onClick={(e) => handleDeleteProduct(p.id, e)}
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

            <ProductDetailsDialog
                productId={selectedProductId}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUpdate={fetchProducts}
            />
        </div>
    );
}
