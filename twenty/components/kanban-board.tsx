'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    DndContext,
    DragOverlay,
    rectIntersection,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Building2, User } from 'lucide-react';
import { Pipeline, Stage } from '@prisma/client';
import { updateDealStage, createDeal, deleteDeal } from '@/app/actions/deal';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { DealDetailsDrawer } from './deal-details-drawer';

export type SafeDeal = {
    id: string;
    title: string;
    amount: number;
    stageId: string;
    status: string;
    counterpartyId?: string | null;
    counterparty?: {
        name: string;
        type: string;
    } | null;
    createdAt: string;
    updatedAt: string;
};

interface KanbanBoardProps {
    pipelines: (Pipeline & { stages: Stage[] })[];
    currentPipelineId: string;
    initialDeals: SafeDeal[];
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

function DealCardItem({ deal, onDelete, onClick }: { deal: SafeDeal; onDelete?: (id: string) => void; onClick?: () => void }) {
    return (
        <Card className="bg-card border-border hover:border-blue-500/50 transition-all duration-300 shadow-sm overflow-hidden group-hover:shadow-md h-full">
            <div className="p-2 space-y-2 h-full flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                            <h4
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick?.();
                                }}
                                className="font-bold text-[10px] text-foreground group-hover:text-blue-600 dark:group-hover:text-white transition-colors leading-tight line-clamp-2 select-none cursor-pointer"
                            >
                                {deal.title}
                            </h4>
                        </div>
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 -mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(deal.id);
                                }}
                            >
                                <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                        )}
                    </div>

                    {deal.counterparty && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border w-fit">
                            {deal.counterparty.type === 'COMPANY' ? <Building2 className="h-2.5 w-2.5 text-blue-500" /> : <User className="h-2.5 w-2.5 text-amber-500" />}
                            <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground truncate max-w-[120px]">
                                {deal.counterparty.name}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 mt-auto">
                    <Badge variant="outline" className="bg-muted/30 border-border text-foreground font-mono text-[10px] py-0 px-2 h-6 font-black">
                        ${deal.amount.toLocaleString()}
                    </Badge>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(deal.updatedAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </Card>
    );
}

function SortableDealCard({ deal, onDelete, onClick }: { deal: SafeDeal; onDelete: (id: string) => void; onClick: () => void }) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: deal.id,
        data: {
            type: 'Deal',
            deal,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-20 bg-blue-500/20 p-4 rounded-xl border-2 border-blue-500/50 h-[100px] mb-3"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative mb-3 cursor-grab active:cursor-grabbing"
        >
            <DealCardItem deal={deal} onDelete={onDelete} onClick={onClick} />
        </div>
    );
}

function KanbanColumn({
    stage,
    deals,
    onAddDeal,
    onDeleteDeal,
    onOpenDeal
}: {
    stage: Stage;
    deals: SafeDeal[];
    onAddDeal: (stageId: string) => void;
    onDeleteDeal: (dealId: string) => void;
    onOpenDeal: (dealId: string) => void;
}) {
    const { setNodeRef } = useSortable({
        id: stage.id,
        data: {
            type: 'Column',
            stage,
        },
    });

    return (
        <div className="flex flex-col h-full min-w-[240px] w-[240px]">
            <div className="px-1 py-1.5 flex items-center justify-between group/header">
                <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stage.color || '#3b82f6' }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover/header:text-foreground transition-colors">
                        {stage.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-black border-border bg-muted/50 text-muted-foreground group-hover/header:text-blue-500 transition-colors">
                        {deals.length}
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md hover:bg-muted border border-transparent hover:border-border transition-all"
                    onClick={() => onAddDeal(stage.id)}
                >
                    <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>

            <div ref={setNodeRef} className="flex-1 px-1 overflow-y-auto min-h-[500px] scrollbar-hide">
                <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    <div className="py-2">
                        {deals.map((deal) => (
                            <SortableDealCard key={deal.id} deal={deal} onDelete={onDeleteDeal} onClick={() => onOpenDeal(deal.id)} />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

export function KanbanBoard({ pipelines, currentPipelineId, initialDeals }: KanbanBoardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [deals, setDeals] = useState<SafeDeal[]>(initialDeals);
    const [activeDragItem, setActiveDragItem] = useState<SafeDeal | null>(null);
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        setDeals(initialDeals);
    }, [initialDeals]);

    // Activation constraint додано для уникнення конфлікту між кліком та початком тяжіння
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const currentPipeline = pipelines.find((p) => p.id === currentPipelineId);
    const stages = currentPipeline?.stages || [];

    const [isNewDealOpen, setIsNewDealOpen] = useState(false);
    const [newDealStageId, setNewDealStageId] = useState('');
    const [newDealTitle, setNewDealTitle] = useState('');
    const [newDealAmount, setNewDealAmount] = useState('');

    const handlePipelineChange = (value: string) => {
        router.push(`${pathname}?pipelineId=${value}`);
    };

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Deal') {
            setActiveDragItem(event.active.data.current.deal);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id;
        const overId = over.id;
        const isActiveDeal = active.data.current?.type === 'Deal';
        const isOverDeal = over.data.current?.type === 'Deal';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveDeal) return;

        const activeDeal = deals.find(d => d.id === activeId);
        const overDeal = deals.find(d => d.id === overId);
        const overStage = stages.find((s: Stage) => s.id === overId);

        if (!activeDeal) return;

        if (isActiveDeal && isOverDeal && overDeal) {
            if (activeDeal.stageId !== overDeal.stageId) {
                setDeals((items) => items.map(item => item.id === activeId ? { ...item, stageId: overDeal.stageId } : item));
            }
        }

        if (isActiveDeal && isOverColumn && overStage) {
            if (activeDeal.stageId !== overStage.id) {
                setDeals((items) => items.map(item => item.id === activeId ? { ...item, stageId: overStage.id } : item));
            }
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id as string;
        const activeDeal = deals.find((d) => d.id === activeId);
        if (!activeDeal) return;

        let finalStageId = activeDeal.stageId;
        if (over.data.current?.type === 'Column') {
            finalStageId = over.id as string;
        } else if (over.data.current?.type === 'Deal') {
            finalStageId = over.data.current.deal.stageId;
        }

        if (finalStageId !== initialDeals.find(d => d.id === activeId)?.stageId) {
            await updateDealStage(activeId, finalStageId);
            toast({ title: 'Оновлено та синхронізовано' });
        }
    };

    const handleAddDealClick = (stageId: string) => {
        setNewDealStageId(stageId);
        setIsNewDealOpen(true);
    };

    const handleCreateDeal = async () => {
        if (!newDealTitle || !newDealAmount) return;
        const amount = parseFloat(newDealAmount);
        const res = await createDeal(newDealTitle, amount, newDealStageId);
        if (res.success && res.data) {
            toast({ title: 'Logic Entry: Workframe Created' });
            setIsNewDealOpen(false);
            setNewDealTitle('');
            setNewDealAmount('');
            const newDeal: SafeDeal = {
                id: res.data.id,
                title: res.data.title,
                amount: Number(res.data.amount),
                stageId: res.data.stageId,
                status: res.data.status,
                createdAt: res.data.createdAt,
                updatedAt: res.data.updatedAt
            };
            setDeals([...deals, newDeal]);
        } else {
            toast({ variant: "destructive", title: 'Critical Error: Entry Failure' });
        }
    };

    const handleDeleteDeal = async (id: string) => {
        if (confirm('Terminate workframe?')) {
            setDeals(deals.filter(d => d.id !== id));
            await deleteDeal(id);
            toast({ title: 'Registry Update: Entry Purged' });
        }
    };

    const handleOpenDeal = (id: string) => {
        setSelectedDealId(id);
        setIsDrawerOpen(true);
    };

    return (
        <div className="h-full flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 px-2 bg-muted border border-border rounded-md flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Active Pipeline</span>
                        <div className="h-2.5 w-[1px] bg-border" />
                        <Select value={currentPipelineId} onValueChange={handlePipelineChange}>
                            <SelectTrigger className="h-full border-none bg-transparent p-0 text-xs font-bold text-foreground focus:ring-0 w-[140px]">
                                <SelectValue placeholder="Pipeline Selection" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                {pipelines.map((p) => (
                                    <SelectItem key={p.id} value={p.id} className="focus:bg-accent focus:text-accent-foreground rounded-md cursor-pointer text-xs font-medium">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-border text-muted-foreground font-bold uppercase text-[10px] px-3">
                        Total Value: ${deals.reduce((acc, d) => acc + d.amount, 0).toLocaleString()}
                    </Badge>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden max-w-full min-h-0 scrollbar-hide">
                <DndContext
                    sensors={sensors}
                    collisionDetection={rectIntersection}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <div className="flex h-full gap-3 pb-3 w-max">
                        {stages.map((stage: Stage) => (
                            <KanbanColumn
                                key={stage.id}
                                stage={stage}
                                deals={deals.filter(d => d.stageId === stage.id)}
                                onAddDeal={handleAddDealClick}
                                onDeleteDeal={handleDeleteDeal}
                                onOpenDeal={handleOpenDeal}
                            />
                        ))}
                    </div>
                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeDragItem ? (
                            <div className="w-[240px] rotate-2 opacity-90 shadow-xl cursor-grabbing rounded-xl bg-background border border-blue-500/50">
                                <DealCardItem deal={activeDragItem} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <DealDetailsDrawer
                dealId={selectedDealId}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onUpdate={() => { }}
            />

            <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
                <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden rounded-lg border-border bg-card shadow-2xl">
                    <div className="p-3 border-b border-border bg-muted/30">
                        <h2 className="text-sm font-black text-foreground leading-none">Initialize Workframe</h2>
                        <p className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground mt-1">Logic Layer Activation</p>
                    </div>
                    <div className="p-3 space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Title Designation</label>
                            <Input
                                placeholder="Core operational unit title"
                                value={newDealTitle}
                                onChange={(e) => setNewDealTitle(e.target.value)}
                                className="h-8 bg-background border-border rounded-md focus:border-blue-500/50 transition-all text-xs font-bold placeholder:font-normal"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Numeric Value ($)</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={newDealAmount}
                                onChange={(e) => setNewDealAmount(e.target.value)}
                                className="h-8 bg-background border-border rounded-md focus:border-blue-500/50 transition-all text-xs font-mono"
                            />
                        </div>
                    </div>
                    <div className="px-3 py-3 bg-muted/30 flex items-center justify-between border-t border-border">
                        <Button type="button" variant="ghost" onClick={() => setIsNewDealOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors px-0 font-bold text-[10px] h-7">DISCARD</Button>
                        <Button onClick={handleCreateDeal} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-4 rounded-md tracking-tight h-8 text-[10px]">
                            EXECUTE SEQUENCE
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}