
import { getDocumentTemplates, createTemplate, deleteTemplate } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    FileText,
    Plus,
    Trash2,
    Edit,
    Layout,
    History,
    FileCode
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CreateTemplateDialog } from "./create-dialog";

export default async function TemplatesPage() {
    const templates = await getDocumentTemplates();

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter uppercase tabular-nums">Document Templates</h1>
                    <p className="text-muted-foreground text-sm font-medium">Manage and compose automated document blueprints.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/settings">
                        <Button variant="outline" className="h-10 text-[11px] font-black uppercase tracking-widest px-4 border-border hover:bg-muted/50">
                            Configure Drive
                        </Button>
                    </Link>
                    <CreateTemplateDialog />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm backdrop-blur-xl">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Blueprint Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Google Docs</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Initialization Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-6">Terminal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40 space-y-4">
                                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                                    <FileCode className="h-8 w-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest">No blueprints detected</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-tighter">System awaiting template injection...</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    templates.map((template) => (
                                        <TableRow key={template.id} className="group hover:bg-muted/30 transition-all border-b border-border/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-tight text-foreground">{template.name}</p>
                                                        <p className="text-[9px] text-muted-foreground font-mono opacity-60">ID: {template.id.split('-')[0]}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={`https://docs.google.com/document/d/${template.googleDocId}/edit`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[9px] font-bold text-blue-500 hover:text-blue-400 uppercase group/link"
                                                >
                                                    <span className="font-mono truncate max-w-[120px]">{template.googleDocId}</span>
                                                    <svg className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                                    <History className="h-3 w-3" />
                                                    {new Date(template.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                                    READY_FOR_DEPLOY
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex items-center justify-end gap-2 outline-none">
                                                    <form action={async () => { 'use server'; await deleteTemplate(template.id); }}>
                                                        <Button type="submit" variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-red-500/10 hover:text-red-500 focus:outline-none">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </form>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4 dark:bg-zinc-900 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-zinc-400 dark:bg-zinc-800">
                                <FileCode className="h-4 w-4" />
                            </div>
                            <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest dark:text-white">Available Variables</h3>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2 dark:text-zinc-600 dark:border-zinc-800">
                                <span>Variable Tag</span>
                                <span>Description</span>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 group/var">
                                    <code className="text-[10px] text-blue-600 font-mono bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 self-start dark:text-blue-400">{"{{title}}"}</code>
                                    <span className="text-[9px] text-muted-foreground font-medium leading-relaxed dark:text-zinc-400">Name of the Deal / Blueprint Title</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 group/var">
                                    <code className="text-[10px] text-blue-600 font-mono bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 self-start dark:text-blue-400">{"{{doc_number}}"}</code>
                                    <span className="text-[9px] text-muted-foreground font-medium leading-relaxed dark:text-zinc-400">Unique Document Identifier</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 group/var">
                                    <code className="text-[10px] text-blue-600 font-mono bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 self-start dark:text-blue-400">{"{{amount}}"}</code>
                                    <span className="text-[9px] text-muted-foreground font-medium leading-relaxed dark:text-zinc-400">Total Deal Value (Formatted)</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 group/var">
                                    <code className="text-[10px] text-blue-600 font-mono bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 self-start dark:text-blue-400">{"{{cp_name}}"}</code>
                                    <span className="text-[9px] text-muted-foreground font-medium leading-relaxed dark:text-zinc-400">Counterparty / Customer Name</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 group/var">
                                    <code className="text-[10px] text-blue-600 font-mono bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 self-start dark:text-blue-400">{"{{date}}"}</code>
                                    <span className="text-[9px] text-muted-foreground font-medium leading-relaxed dark:text-zinc-400">Current Generation Date</span>
                                </div>

                                <div className="pt-2 border-t border-border dark:border-zinc-800/50">
                                    <div className="grid grid-cols-2 gap-2 group/var">
                                        <code className="text-[10px] text-emerald-600 font-mono bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 self-start dark:text-emerald-400">{"{{products_table}}"}</code>
                                        <span className="text-[9px] text-muted-foreground font-medium leading-relaxed font-bold uppercase tracking-tight dark:text-zinc-400">Dynamic Grid: Inserts a table with Items, Qty, Price, Total.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <p className="text-[9px] text-blue-600 font-medium leading-relaxed uppercase dark:text-blue-400/80">
                                💡 Place these tags anywhere in your Google Doc. The engine will automatically inject live data during generation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
