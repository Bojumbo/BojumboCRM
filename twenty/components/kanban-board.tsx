'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    DndContext,
    DragOverlay,
    closestCorners,
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
import { Plus, Trash2 } from 'lucide-react';
import { Pipeline, Stage } from '@prisma/client';
import { updateDealStage, createDeal, deleteDeal } from '@/app/actions/deal';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DealDetailsDrawer } from './deal-details-drawer';

// Define a type for Deal that is safe for client components (Decimal as string/number)
export type SafeDeal = {
    id: string;
    title: string;
    amount: number;
    stageId: string;
    status: string;
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
                className="opacity-30 bg-secondary/50 p-4 rounded-md border-2 border-primary h-[100px]"
            />
        );
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="mb-2 cursor-pointer hover:border-primary transition-colors group relative"
            onClick={(e) => {
                // Prevent opening if clicking delete button
                if ((e.target as HTMLElement).closest('button')) return;
                onClick();
            }}
        >
            <div {...attributes} {...listeners} className="p-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm line-clamp-2">{deal.title}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                    <Badge variant="outline" className="text-xs font-normal">
                        ${Number(deal.amount).toLocaleString()}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(deal.id);
                        }}
                    >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                </div>
            </div>
        </Card>
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
        <div className="flex flex-col h-full min-w-[280px] w-[280px] rounded-lg bg-secondary/20 border border-border/50">
            <div className="p-3 font-medium flex items-center justify-between border-b border-border/50 bg-secondary/10 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#94a3b8' }} />
                    <span className="text-sm">{stage.name}</span>
                    <span className="text-xs text-muted-foreground ml-1">({deals.length})</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddDeal(stage.id)}>
                    <select hidden /> {/* Dummy to avoid hydration mismatch if needed */}
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto min-h-[500px]">
                <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    {deals.map((deal) => (
                        <SortableDealCard key={deal.id} deal={deal} onDelete={onDeleteDeal} onClick={() => onOpenDeal(deal.id)} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

export function KanbanBoard({ pipelines, currentPipelineId, initialDeals }: KanbanBoardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    // State for deals
    const [deals, setDeals] = useState<SafeDeal[]>(initialDeals);
    const [activeDragItem, setActiveDragItem] = useState<SafeDeal | null>(null);

    // Drawer state
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Sync deals when initialDeals prop changes (e.g. navigation)
    useEffect(() => {
        setDeals(initialDeals);
    }, [initialDeals]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const currentPipeline = pipelines.find((p) => p.id === currentPipelineId);
    const stages = currentPipeline?.stages || [];

    // Dialog State for New Deal
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

        // Im finding the container (stage) for active and over items
        const activeDeal = deals.find(d => d.id === activeId);
        const overDeal = deals.find(d => d.id === overId);
        const overStage = stages.find((s: Stage) => s.id === overId);

        if (!activeDeal) return;

        // Scenario 1: Dragging over another deal
        if (isActiveDeal && isOverDeal && overDeal) {
            if (activeDeal.stageId !== overDeal.stageId) {
                setDeals((items) => {
                    return items.map(item => {
                        if (item.id === activeId) {
                            return { ...item, stageId: overDeal.stageId };
                        }
                        return item;
                    })
                });
            }
        }

        // Scenario 2: Dragging over a column (empty or not)
        if (isActiveDeal && isOverColumn && overStage) {
            if (activeDeal.stageId !== overStage.id) {
                setDeals((items) => {
                    return items.map(item => {
                        if (item.id === activeId) {
                            return { ...item, stageId: overStage.id };
                        }
                        return item;
                    })
                });
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
            toast({ title: 'Deal updated' });
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
            toast({ title: 'Deal created' });
            setIsNewDealOpen(false);
            setNewDealTitle('');
            setNewDealAmount('');
            const newDeal: SafeDeal = {
                id: res.data.id,
                title: res.data.title,
                amount: Number(res.data.amount),
                stageId: res.data.stageId,
                status: res.data.status,
                createdAt: res.data.createdAt.toISOString(),
                updatedAt: res.data.updatedAt.toISOString()
            };
            setDeals([...deals, newDeal]);
        } else {
            toast({ variant: "destructive", title: 'Failed to create deal' });
        }
    };

    const handleDeleteDeal = async (id: string) => {
        if (confirm('Delete deal?')) {
            setDeals(deals.filter(d => d.id !== id)); // Optimistic
            await deleteDeal(id);
            toast({ title: 'Deal deleted' });
        }
    };

    const handleOpenDeal = (id: string) => {
        setSelectedDealId(id);
        setIsDrawerOpen(true);
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Select value={currentPipelineId} onValueChange={handlePipelineChange}>
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select Pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                        {pipelines.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden max-w-full min-h-0">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <div className="flex h-full gap-4 pb-4 w-max">
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
                            <div className="w-[260px]">
                                <SortableDealCard deal={activeDragItem} onDelete={() => { }} onClick={() => { }} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <DealDetailsDrawer
                dealId={selectedDealId}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onUpdate={() => {
                    // Refresh data from server if needed, 
                    // though Server Actions with revalidatePath usually handle it via initialDeals prop
                }}
            />

            <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Deal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Deal Title"
                                value={newDealTitle}
                                onChange={(e) => setNewDealTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="number"
                                placeholder="Amount ($)"
                                value={newDealAmount}
                                onChange={(e) => setNewDealAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateDeal}>Create Deal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
