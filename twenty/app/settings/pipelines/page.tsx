import { getPipelines } from '@/app/actions/pipeline';
import PipelineList from '@/components/pipeline-list';

export default async function PipelinesPage() {
    const pipelines = await getPipelines();

    return (
        <div className="space-y-6">
            <PipelineList pipelines={pipelines} />
        </div>
    );
}
