'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, ChevronRight, Globe, Fingerprint } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast({
                    variant: 'destructive',
                    title: 'Gateway Error',
                    description: 'Invalid credentials or unauthorized node access.',
                });
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            toast({
                variant: 'destructive',
                title: 'System Failure',
                description: 'Operational error during handshake sequence.',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-50" />

            <div className="w-full max-w-[420px] isolate relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                        <Fingerprint className="h-6 w-6 text-blue-500 animate-pulse" />
                    </div>
                </div>

                <Card className="bg-[#0a0a0a] border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden pt-6">
                    <CardHeader className="space-y-1 pb-8 px-10 text-center">
                        <Badge variant="outline" className="w-fit mx-auto mb-3 bg-zinc-950 text-zinc-600 border-zinc-900 text-[9px] font-black uppercase tracking-[0.2em] py-0.5">
                            Terminal Access
                        </Badge>
                        <CardTitle className="text-3xl font-black tracking-tighter text-white">Gateway Authentication</CardTitle>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">System-wide operational interface v1.0.4</p>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 px-10">
                            <div className="space-y-2.5 relative group">
                                <Label
                                    htmlFor="email"
                                    className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${focusedField === 'email' ? 'text-blue-500' : 'text-zinc-600'}`}
                                >
                                    Admin Identifier
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="node_admin@system.proto"
                                        required
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className="h-12 bg-zinc-950 border-zinc-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 rounded-xl transition-all text-sm pl-11 font-medium"
                                    />
                                    <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === 'email' ? 'text-blue-500' : 'text-zinc-700'}`} />
                                </div>
                            </div>

                            <div className="space-y-2.5 relative group">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${focusedField === 'password' ? 'text-blue-500' : 'text-zinc-600'}`}
                                    >
                                        Encryption Key
                                    </Label>
                                    <Link href="#" className="text-[9px] font-black text-zinc-700 hover:text-zinc-400 uppercase tracking-tighter transition-colors">
                                        Lost Key?
                                    </Link>
                                </div>
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
                                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black tracking-tight rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 group/btn translate-y-0 active:translate-y-0.5"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-3">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        COMMENCING HANDSHAKE...
                                    </span>
                                ) : (
                                    <>
                                        INITIALIZE SESSION
                                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">
                                    No node assigned?{' '}
                                    <Link href="/register" className="text-zinc-400 hover:text-white font-black transition-colors underline-offset-4 hover:underline">
                                        REQUEST ACCESS
                                    </Link>
                                </span>
                            </div>
                        </CardFooter>
                    </form>
                </Card>

                <div className="mt-8 flex items-center justify-center gap-8 opacity-20 hover:opacity-50 transition-opacity duration-500">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Instance</span>
                        <span className="text-[10px] font-bold text-zinc-400">Stable-42</span>
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Protocol</span>
                        <span className="text-[10px] font-bold text-zinc-400">TLS_1.3_E2E</span>
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Uptime</span>
                        <span className="text-[10px] font-bold text-zinc-400">99.98%</span>
                    </div>
                </div>
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
