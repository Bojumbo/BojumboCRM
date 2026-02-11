'use client';

import { useState, useEffect } from 'react';
import { getMyPermissions } from '@/app/actions/permissions';

type Action = 'view' | 'create' | 'edit' | 'delete';
type Resource = 'deals' | 'products' | 'settings' | 'users' | 'counterparties';

interface Permissions {
    [resource: string]: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export function usePermission() {
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Bypass permission fetching
        setLoading(false);
    }, []);

    const can = (resource: Resource, action: Action): boolean => {
        // Temporary bypass: allow everything
        return true;
    };

    return { can, loading, permissions };
}
