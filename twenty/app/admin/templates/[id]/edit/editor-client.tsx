'use client';

import { useState } from 'react';
import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Save,
    ArrowLeft,
    Loader2,
    Hash,
    Settings,
    Layout,
    FileCode,
    Eye
} from "lucide-react";
import Link from "next/link";
import { updateTemplate, generateTemplateDocx } from "@/app/actions/documents";
import { getLatestDeal } from "@/app/actions/deal";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from 'file-saver';
import { DocumentTemplate } from "@prisma/client";

export function TemplateEditorClient({ template }: { template: DocumentTemplate }) {
    const [content, setContent] = useState(template.content);
    const [name, setName] = useState(template.name);
    const [saving, setSaving] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [editor, setEditor] = useState<any>(null);
    const { toast } = useToast();

    const insertToken = (token: string) => {
        if (editor) {
            editor.chain().focus().insertContent(token).run();
            toast({ title: "Token Injected", description: `${token} added to document buffer.` });
        } else {
            toast({ variant: "destructive", title: "Editor Not Ready", description: "Wait for system initialization." });
        }
    };

    const handlePreview = async () => {
        setPreviewing(true);
        try {
            const latestDeal = await getLatestDeal();
            if (!latestDeal) {
                toast({ variant: "destructive", title: "Preview Error", description: "No deals found in system to use as test data." });
                return;
            }

            const res = await generateTemplateDocx(template.id, latestDeal.id);
            if (res.success && res.data) {
                const byteCharacters = atob(res.data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

                saveAs(blob, res.filename || `PREVIEW_${template.name}.docx`);
                toast({ title: "Preview Generated", description: `Synthesized with deal: ${latestDeal.title}` });
            } else {
                toast({ variant: "destructive", title: "Preview Failure", description: res.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Preview Offline", description: (error as Error).message });
        } finally {
            setPreviewing(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await updateTemplate(template.id, { name, content });
        setSaving(false);

        if (res.success) {
            toast({ title: "Blueprint Synchronized", description: "All changes committed to registry." });
        } else {
            toast({ variant: "destructive", title: "Sync Failure", description: res.error });
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/5 animate-in fade-in duration-700">
            {/* Action Bar */}
            <div className="h-16 border-b border-border bg-background flex items-center justify-between px-8 shrink-0 z-30 shadow-sm">
                <div className="flex items-center gap-6">
                    <Link href="/admin/templates">
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-muted transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-transparent border-transparent hover:border-border focus:border-blue-500/50 h-9 font-black uppercase tracking-tighter text-xl px-2 -ml-2 transition-all w-[300px]"
                        />
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            <Hash className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tabular-nums tracking-widest">{template.id.split('-')[0]}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePreview}
                        disabled={previewing}
                        className="font-black text-[11px] uppercase tracking-widest px-6 h-10 border-border hover:bg-muted transition-all active:scale-95 gap-2"
                    >
                        {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        Test Preview
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest px-8 h-10 shadow-lg shadow-blue-500/20 gap-2 transition-all active:scale-95"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Synchronizing..." : "Commit Changes"}
                    </Button>
                </div>
            </div>

            <main className="flex-1 flex overflow-hidden">
                {/* Editor Surface */}
                <div className="flex-1 overflow-y-auto p-10 bg-muted/50 scrollbar-thin scrollbar-thumb-border">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <Editor content={content} onChange={setContent} onEditorReady={setEditor} />
                    </div>
                </div>

                {/* Sidebar Configuration */}
                <aside className="w-[340px] bg-background border-l border-border flex flex-col shrink-0">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Available Tokens</h4>
                        </div>
                    </div>

                    <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Layout className="h-3.5 w-3.5 text-blue-500" />
                                    <h5 className="text-[10px] font-black uppercase tracking-widest">Injection Blocks</h5>
                                </div>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Live</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed tracking-tight">
                                Select a token to insert into the operational blueprint.
                            </p>

                            <div className="grid gap-2">
                                {[
                                    { tag: '{{title}}', label: 'Deal Title' },
                                    { tag: '{{amount}}', label: 'Valuation' },
                                    { tag: '{{cp_name}}', label: 'Counterparty' },
                                    { tag: '{{date}}', label: 'Current Date' },
                                    { tag: '{#products} {{name}} - {{price}} x {{quantity}} {/products}', label: 'Product Table' },
                                ].map((v) => (
                                    <button
                                        key={v.label}
                                        onClick={() => insertToken(v.tag)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 group hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left active:scale-[0.98]"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase opacity-70 group-hover:text-foreground transition-colors">{v.label}</span>
                                            <code className="text-[10px] font-bold text-blue-600 font-mono break-all">{v.tag.length > 30 ? v.tag.substring(0, 30) + '...' : v.tag}</code>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4 p-4 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800">
                            <div className="flex items-center gap-2">
                                <FileCode className="h-3.5 w-3.5 text-orange-500" />
                                <h5 className="text-[10px] font-black uppercase tracking-widest">Syntax Note</h5>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] text-zinc-400 font-medium uppercase leading-relaxed">
                                    Для виведення списку товарів використовуйте цикл:
                                </p>
                                <div className="p-3 rounded bg-zinc-900 font-mono text-[10px] text-orange-400 leading-relaxed border border-zinc-800">
                                    <span className="text-zinc-500">{`{#products}`}</span><br />
                                    &nbsp;&nbsp;{`{{name}} - {{price}} x {{quantity}}`}<br />
                                    <span className="text-zinc-500">{`{/products}`}</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="p-6 border-t border-border bg-muted/10">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Blueprint Core Active</span>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}
