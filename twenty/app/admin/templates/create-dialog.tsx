'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, ExternalLink, Folder } from "lucide-react";
import { createTemplate } from "@/app/actions/documents";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function CreateTemplateDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [googleDocId, setGoogleDocId] = useState("");
    const [folderId, setFolderId] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleCreate = async () => {
        if (!name.trim() || !googleDocId.trim()) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Both template name and Google Doc ID are required." });
            return;
        }

        setLoading(true);
        const res = await createTemplate(name, googleDocId, folderId);
        setLoading(false);

        if (res.success && res.data) {
            setOpen(false);
            setName("");
            setGoogleDocId("");
            setFolderId("");
            toast({ title: "Template Created", description: `${name} has been linked to Google Docs successfully.` });
            router.refresh();
        } else {
            toast({ variant: "destructive", title: "Registration Error", description: res.error });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest px-6 h-10 shadow-lg shadow-blue-500/20 gap-2">
                    <Plus className="h-4 w-4" />
                    Initialize Blueprint
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">New Google Docs Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Template Name</label>
                        <Input
                            placeholder="e.g. Sales Agreement v2.0"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-muted/50 border-border"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Google Doc ID</label>
                            <a
                                href="https://docs.google.com/document/u/0/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-blue-500 hover:text-blue-400 flex items-center gap-1 font-bold uppercase"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Open Google Docs
                            </a>
                        </div>
                        <Input
                            placeholder="Paste the document ID from URL"
                            value={googleDocId}
                            onChange={(e) => setGoogleDocId(e.target.value)}
                            className="bg-muted/50 border-border font-mono text-xs"
                        />
                        <p className="text-[9px] text-muted-foreground italic">
                            Copy from URL: docs.google.com/document/d/<span className="font-bold text-blue-500">[THIS_PART]</span>/edit
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination Folder ID (Optional)</label>
                            <a
                                href="https://drive.google.com/drive/u/0/my-drive"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-bold uppercase"
                            >
                                <Folder className="h-3 w-3" />
                                Open Drive
                            </a>
                        </div>
                        <Input
                            placeholder="Paste the folder ID from URL"
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                            className="bg-muted/50 border-border font-mono text-xs"
                        />
                        <p className="text-[9px] text-muted-foreground italic">
                            Save location: drive.google.com/drive/folders/<span className="font-bold text-emerald-500">[ID]</span>
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !name.trim() || !googleDocId.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-[11px]"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Link to Registry
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
