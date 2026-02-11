'use client';

import { Activity, BarChart3, Briefcase, ChevronRight, Globe, Layers, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-col h-full items-center justify-center min-h-[70vh] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-4xl w-full space-y-12 text-center isolate">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-muted text-blue-500 border-border text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Operational Hub v1.0.4
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tightest text-foreground leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            CRM <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600">Command</span> Center
          </h1>
          <p className="text-muted-foreground text-sm md:text-md font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Unified Interface for Enterprise Resource Orchestration & Matrix Management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <DashboardModule
            icon={<Users className="h-5 w-5" />}
            label="Nodes"
            title="Counterparties"
            desc="Entity Registry"
            href="/counterparties"
          />
          <DashboardModule
            icon={<Layers className="h-5 w-5" />}
            label="Pipelines"
            title="Deal Stream"
            desc="Kanban Logic"
            href="/deals"
          />
          <DashboardModule
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Assets"
            title="Products"
            desc="Valuation Buffer"
            href="/products"
          />
        </div>

        <div className="flex items-center justify-center gap-3 pt-3 animate-in fade-in zoom-in-95 duration-1000 delay-500">
          <Button asChild className="h-9 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-md shadow-md shadow-blue-500/10 group">
            <Link href="/deals" className="flex items-center gap-2">
              Initialize Terminal <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
          <div className="h-6 w-[1px] bg-border" />
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">System Status</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-12 opacity-30 hover:opacity-100 transition-opacity duration-700 cursor-default">
        <Metric label="Uptime" val="99.99%" />
        <Metric label="Latency" val="14ms" />
        <Metric label="Nodes" val="2,104" />
      </div>
    </div>
  );
}

function DashboardModule({ icon, label, title, desc, href }: { icon: React.ReactNode, label: string, title: string, desc: string, href: string }) {
  return (
    <Link href={href} className="group relative block p-3 bg-card border border-border rounded-lg hover:border-blue-500/50 hover:bg-muted/30 transition-all duration-300 shadow-sm overflow-hidden">
      <div className="absolute -top-3 -right-3 h-16 w-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />

      <div className="relative space-y-2 text-center">
        <div className="h-8 w-8 rounded-md bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all">
          {icon}
        </div>
        <div className="space-y-0.5">
          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.1em] group-hover:text-blue-500/70 transition-colors">{label}</span>
          <h3 className="text-sm font-black text-foreground">{title}</h3>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{desc}</p>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
        <ChevronRight className="h-3 w-3 text-blue-500" />
      </div>
    </Link>
  );
}

function Metric({ label, val }: { label: string, val: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</span>
      <span className="text-[10px] font-black text-muted-foreground font-mono">{val}</span>
    </div>
  );
}
