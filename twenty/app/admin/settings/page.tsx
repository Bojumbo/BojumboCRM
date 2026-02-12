'use client';

import { useState, useEffect, startTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllSettings, saveSystemSetting } from "@/app/actions/settings";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        getAllSettings().then((data) => {
            setSettings(data);
            setOriginalSettings(data);
            setLoading(false);
        });
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save all settings one by one
            for (const key of Object.keys(settings)) {
                await saveSystemSetting(key, settings[key]);
            }
            setOriginalSettings({ ...settings });
            toast({ title: "Settings Saved", description: "Your configuration has been updated." });
            router.refresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save settings." });
        } finally {
            setSaving(false);
        }
    };

    const handleGoogleAuth = () => {
        const hasUnsavedChanges =
            settings['GOOGLE_CLIENT_ID'] !== originalSettings['GOOGLE_CLIENT_ID'] ||
            settings['GOOGLE_CLIENT_SECRET'] !== originalSettings['GOOGLE_CLIENT_SECRET'];

        if (hasUnsavedChanges) {
            toast({
                variant: "destructive",
                title: "Save Required",
                description: "Settings are not saved in database. Click 'Save Configuration' first."
            });
            return;
        }

        // Redirect to our auth endpoint
        window.location.href = '/api/auth/google';
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    const isConnected = !!settings['GOOGLE_ACCESS_TOKEN'];
    const hasCredentials = !!settings['GOOGLE_CLIENT_ID'] && !!settings['GOOGLE_CLIENT_SECRET'];
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : '';

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">System Settings</h1>
                <p className="text-muted-foreground">Configure global application settings and integrations.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Google Drive Integration (OAuth 2.0)
                        {isConnected ?
                            <span className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200 uppercase tracking-wide font-bold">
                                <CheckCircle className="h-3 w-3 mr-1" /> Connected
                            </span>
                            :
                            <span className="flex items-center text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200 uppercase tracking-wide font-bold">
                                <XCircle className="h-3 w-3 mr-1" /> Not Connected
                            </span>
                        }
                    </CardTitle>
                    <CardDescription>
                        Configure Google OAuth to allow generating documents directly to your Drive.
                        <br />
                        <span className="text-xs font-mono bg-muted px-1 rounded mt-1 inline-block">Redirect URI: {redirectUri}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Client ID</label>
                            <Input
                                placeholder="From Google Cloud Console"
                                value={settings['GOOGLE_CLIENT_ID'] || ''}
                                onChange={(e) => handleChange('GOOGLE_CLIENT_ID', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Client Secret</label>
                            <Input
                                type="password"
                                placeholder="From Google Cloud Console"
                                value={settings['GOOGLE_CLIENT_SECRET'] || ''}
                                onChange={(e) => handleChange('GOOGLE_CLIENT_SECRET', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Default Destination Folder ID</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Optional: Folder ID to save generated docs"
                                value={settings['GOOGLE_DRIVE_FOLDER_ID'] || ''}
                                onChange={(e) => handleChange('GOOGLE_DRIVE_FOLDER_ID', e.target.value)}
                                className="font-mono text-xs"
                            />
                            <a
                                href="https://drive.google.com/drive/my-drive"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-3 border border-input rounded-md hover:bg-muted transition-colors"
                            >
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            If set, all documents without a template-specific folder will be saved here.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {!isConnected && hasCredentials && (
                                <p>Credentials saved. Now connect your account.</p>
                            )}
                            {isConnected && (
                                <p className="text-green-600 font-medium">Your Google Account is successfully linked!</p>
                            )}
                        </div>

                        <Button
                            variant={isConnected ? "outline" : "default"}
                            onClick={handleGoogleAuth}
                            disabled={!hasCredentials || saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            {isConnected ? "Reconnect Account" : "Connect Google Account"}
                        </Button>
                    </div>

                </CardContent>
                <CardFooter className="bg-muted/30 border-t border-border flex justify-end py-3">
                    <Button onClick={handleSave} disabled={saving} className="font-bold relative pl-8">
                        {saving ? <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin" /> : <Save className="absolute left-2.5 top-2.5 h-4 w-4" />}
                        Save Configuration
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
