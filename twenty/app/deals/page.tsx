import { getPipelines } from '@/app/actions/pipeline';
import { getDealsByPipeline } from '@/app/actions/deal';
import { KanbanBoard, SafeDeal } from '@/components/kanban-board';
import { Deal } from '@prisma/client';

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { pipelineId?: string };
}) {
  const pipelines = await getPipelines();

  // Determine current pipeline
  let currentPipelineId = searchParams.pipelineId;

  if (!currentPipelineId && pipelines.length > 0) {
    currentPipelineId = pipelines[0].id;
  }

  // If still no pipeline (empty DB), handle gracefully
  if (!currentPipelineId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Pipelines Found</h2>
          <p className="text-muted-foreground">Please create a pipeline in Settings first.</p>
        </div>
      </div>
    );
  }

  const rawDeals = await getDealsByPipeline(currentPipelineId);

  // Serialize deals
  const deals: SafeDeal[] = rawDeals.map((deal: Deal) => ({
    id: deal.id,
    title: deal.title,
    amount: Number(deal.amount), // Convert Decimal to number
    stageId: deal.stageId,
    status: deal.status,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString()
  }));

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Deals Board</h1>
      </div>
      <div className="flex-1 h-0"> {/* height 0 to let flex take over */}
        <KanbanBoard
          pipelines={pipelines}
          currentPipelineId={currentPipelineId}
          initialDeals={deals}
        />
      </div>
    </div>
  );
}
