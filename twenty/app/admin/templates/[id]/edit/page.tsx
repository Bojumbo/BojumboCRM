
import { getTemplateById } from "@/app/actions/documents";
import { TemplateEditorClient } from "./editor-client";
import { notFound } from "next/navigation";

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
    const template = await getTemplateById(params.id);

    if (!template) {
        notFound();
    }

    return <TemplateEditorClient template={template} />;
}
