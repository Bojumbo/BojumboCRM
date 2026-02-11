'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Pipeline, Stage as PrismaStage } from '@prisma/client';
import { createPipeline, deletePipeline, deleteStage, addStage, updateStage, reorderStages } from '@/app/actions/pipeline';
import { useToast } from '@/hooks/use-toast';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type PipelineWithStages = Pipeline & {
    stages: PrismaStage[];
};

interface PipelineCardProps {
    pipeline: PipelineWithStages;
}

function SortableStage({ stage, onUpdate }: { stage: PrismaStage; onUpdate: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [name, setName] = useState(stage.name);
    const { toast } = useToast();

    const handleDelete = async () => {
        await deleteStage(stage.id);
        toast({ title: 'Stage deleted' });
        onUpdate();
    }

    const handleUpdateName = async () => {
        if (name === stage.name) return;
        await updateStage(stage.id, { name });
        toast({ title: 'Stage renamed' });
        onUpdate();
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md mb-2 group">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: stage.color || '#94a3b8' }}
            />
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleUpdateName}
                className="h-8 flex-1 bg-transparent border-transparent focus:bg-background focus:border-input transition-colors"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    )
}

function PipelineCard({ pipeline }: PipelineCardProps) {
    const { toast } = useToast();
    const [stages, setStages] = useState(pipeline.stages);

    useEffect(() => {
        setStages(pipeline.stages);
    }, [pipeline.stages]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setStages((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Optimistic update done, now sync with server
                const reorderedPayload = newOrder.map((stage, index) => ({
                    id: stage.id,
                    orderIndex: index
                }));
                reorderStages(pipeline.id, reorderedPayload);

                return newOrder;
            });
        }
    };

    const handleAddStage = async () => {
        await addStage(pipeline.id, 'New Stage');
        toast({ title: 'Stage added' });
    }

    const handleDeletePipeline = async () => {
        if (confirm('Are you sure you want to delete this pipeline?')) {
            await deletePipeline(pipeline.id);
            toast({ title: 'Pipeline deleted' });
        }
    }

    return (
        <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {pipeline.name}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleDeletePipeline}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={stages}
                            strategy={verticalListSortingStrategy}
                        >
                            {stages.map((stage) => (
                                <SortableStage key={stage.id} stage={stage} onUpdate={() => { }} />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleAddStage}>
                        <Plus className="mr-2 h-4 w-4" /> Add Stage
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PipelineList({ pipelines }: { pipelines: PipelineWithStages[] }) {
    const [newPipelineName, setNewPipelineName] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleCreatePipeline = async () => {
        if (!newPipelineName) return;
        await createPipeline(newPipelineName);
        setNewPipelineName('');
        setIsDialogOpen(false);
        toast({ title: 'Pipeline created' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Pipeline Settings</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Pipeline
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Pipeline</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input
                                id="name"
                                placeholder="Pipeline Name (e.g., Sales Pipeline)"
                                value={newPipelineName}
                                onChange={(e) => setNewPipelineName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreatePipeline}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pipelines.map((pipeline) => (
                    <PipelineCard key={pipeline.id} pipeline={pipeline} />
                ))}
            </div>
        </div>
    );
}
