import { getPipelines } from '@/app/actions/pipeline';
import { getDealsByPipeline } from '@/app/actions/deal';
import { KanbanBoard, SafeDeal } from '@/components/kanban-board';
import { getCounterparties } from '@/app/actions/counterparty';
import { getAllUsers } from '@/app/actions/user';
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

  const [rawDeals, counterparties, users] = await Promise.all([
    getDealsByPipeline(currentPipelineId),
    getCounterparties(),
    getAllUsers()
  ]);

  // Serialize deals
  const deals: SafeDeal[] = rawDeals.map((deal: any) => ({
    id: deal.id,
    title: deal.title,
    amount: Number(deal.amount),
    stageId: deal.stageId,
    status: deal.status,
    counterparty: deal.counterparty,
    managers: (deal.managers || []).map((m: any) => ({
      id: m.id,
      name: m.name
    })),
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString()
  }));

  return (
    <div className="h-full flex flex-col space-y-1">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-black tracking-tight uppercase text-muted-foreground">Deals Board</h1>
      </div>
      <div className="flex-1 h-0"> {/* height 0 to let flex take over */}
        <KanbanBoard
          pipelines={pipelines}
          currentPipelineId={currentPipelineId}
          initialDeals={deals}
          users={users.map(u => ({ id: u.id, name: u.name }))}
          counterparties={counterparties.map(c => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
