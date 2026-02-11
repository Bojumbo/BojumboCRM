'use client';

import { useState } from 'react';
import { registerUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Lock, User, ChevronRight, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const { toast } = useToast();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await registerUser(formData);

        if (result?.error) {
            toast({
                variant: 'destructive',
                title: 'Provisioning Error',
                description: result.error,
            });
            setLoading(false);
        } else {
            setIsSubmitted(true);
            setLoading(false);
        }
    }

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
                <div className="w-full max-w-[420px] isolate relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        </div>
                    </div>
                    <Card className="bg-[#0a0a0a] border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden p-10 text-center">
                        <CardHeader className="p-0 space-y-4">
                            <Badge variant="outline" className="w-fit mx-auto bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.2em] py-0.5">
                                Protocol Initialized
                            </Badge>
                            <CardTitle className="text-3xl font-black tracking-tighter text-white">Access Requested</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 py-8">
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                                Your account provisioning request has been sent to the primary node administrator.
                                <span className="block mt-4 text-emerald-500/80">Awaiting clearance.</span>
                            </p>
                        </CardContent>
                        <CardFooter className="p-0">
                            <Button className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 font-black rounded-xl transition-all" asChild>
                                <Link href="/login">RETURN TO GATEWAY</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[460px] isolate relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                        <Cpu className="h-6 w-6 text-blue-500 animate-pulse" />
                    </div>
                </div>

                <Card className="bg-[#0a0a0a] border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden pt-6">
                    <CardHeader className="space-y-1 pb-8 px-10 text-center">
                        <Badge variant="outline" className="w-fit mx-auto mb-3 bg-zinc-950 text-zinc-600 border-zinc-900 text-[9px] font-black uppercase tracking-[0.2em] py-0.5">
                            New Node Protocol
                        </Badge>
                        <CardTitle className="text-3xl font-black tracking-tighter text-white">Join the Infrastructure</CardTitle>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">Request administrative clearance for node access</p>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 px-10">
                            <div className="space-y-2.5 relative group">
                                <Label
                                    htmlFor="name"
                                    className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${focusedField === 'name' ? 'text-blue-500' : 'text-zinc-600'}`}
                                >
                                    Full Identity Label
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Cipher Algos"
                                        required
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField(null)}
                                        className="h-12 bg-zinc-950 border-zinc-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 rounded-xl transition-all text-sm pl-11 font-medium"
                                    />
                                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'name' ? 'text-blue-500' : 'text-zinc-700'}`} />
                                </div>
                            </div>

                            <div className="space-y-2.5 relative group">
                                <Label
                                    htmlFor="email"
                                    className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${focusedField === 'email' ? 'text-blue-500' : 'text-zinc-600'}`}
                                >
                                    Communication Endpoint
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="operator@system.proto"
                                        required
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className="h-12 bg-zinc-950 border-zinc-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 rounded-xl transition-all text-sm pl-11 font-medium"
                                    />
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'email' ? 'text-blue-500' : 'text-zinc-700'}`} />
                                </div>
                            </div>

                            <div className="space-y-2.5 relative group">
                                <Label
                                    htmlFor="password"
                                    className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${focusedField === 'password' ? 'text-blue-500' : 'text-zinc-600'}`}
                                >
                                    Static Encryption Key
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="h-12 bg-zinc-950 border-zinc-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 rounded-xl transition-all text-sm pl-11 tracking-widest font-mono"
                                    />
                                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'password' ? 'text-blue-500' : 'text-zinc-700'}`} />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-6 px-10 pb-10 mt-4">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-zinc-100 hover:bg-white text-black font-black tracking-tight rounded-xl transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-white/5 active:translate-y-0.5"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-3">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        PROVISIONING NODE...
                                    </span>
                                ) : (
                                    <>
                                        COMMENCE REGISTRATION
                                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">
                                    Already have clearance?{' '}
                                    <Link href="/login" className="text-zinc-400 hover:text-white font-black transition-colors underline-offset-4 hover:underline">
                                        ACCESS GATEWAY
                                    </Link>
                                </span>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg
            className={cn("animate-spin", className)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    )
}
