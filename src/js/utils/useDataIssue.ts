import { useEffect, useState } from 'react';
import { localStorageKey } from './consts';
import { MigrateResult, migrateModel, resetAppData } from './dataFixer';

export type DataIssue = Extract<MigrateResult, { ok: false }>;

export const useDataIssue = () => {
    const [issue, setIssue] = useState<DataIssue | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem(localStorageKey);
        const result = migrateModel(raw);
        if (!result.ok) {
            setIssue(result);
        }
    }, []);

    const dismiss = () => setIssue(null);

    const reset = () => {
        resetAppData();
        window.location.reload();
    };

    return { issue, dismiss, reset };
};
