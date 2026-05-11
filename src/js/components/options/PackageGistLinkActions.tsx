import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import { EditorStore, SettingsPackage } from '../../types/types';
import { syncPackage, SyncFailureReason } from '../../utils/gistSync';

type Props = {
    packageData: SettingsPackage;
    addPackages: EditorStore['addPackages'];
    unlinkPackage: EditorStore['unlinkPackage'];
};

const syncErrorMessages: Record<SyncFailureReason, string> = {
    'invalid-input': "Couldn't recognize the Gist URL or ID.",
    'fetch-failed': "Couldn't reach the Gist (network or 4xx/5xx).",
    'no-json-file': "That Gist doesn't contain a .json file.",
    'parse': "The Gist's JSON file couldn't be parsed.",
    'fixer-threw': "Couldn't upgrade the Gist's data to the current model version.",
    'future-version': 'Gist is from a newer extension version — please update first.',
    'package-missing-in-gist': "This package isn't in the Gist anymore.",
};

const PackageGistLinkActions = ({ packageData, addPackages, unlinkPackage }: Props) => {
    const [syncing, setSyncing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [statusKind, setStatusKind] = useState<'info' | 'error' | null>(null);
    const [confirmingUnlink, setConfirmingUnlink] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        setStatus(null);
        setStatusKind(null);
        const result = await syncPackage(packageData);
        if (result.outcome.kind === 'up-to-date') {
            setStatus('Already up to date.');
            setStatusKind('info');
        } else if (result.outcome.kind === 'synced' && result.replacement) {
            addPackages({ [packageData.key]: result.replacement }, true);
            setStatus(`Synced to ${result.outcome.newRevision.slice(0, 7)}.`);
            setStatusKind('info');
        } else if (result.outcome.kind === 'error') {
            setStatus(syncErrorMessages[result.outcome.reason]);
            setStatusKind('error');
        }
        setSyncing(false);
    };

    const handleUnlink = () => {
        unlinkPackage(packageData.key);
        setConfirmingUnlink(false);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, paddingLeft: 1, paddingTop: 1 }}>
                <Button
                    variant="text"
                    onClick={handleSync}
                    disabled={syncing}
                    startIcon={syncing ? <CircularProgress size={16} /> : undefined}
                >
                    Sync
                </Button>
                <Button
                    variant="text"
                    color="warning"
                    onClick={() => setConfirmingUnlink(true)}
                    disabled={syncing}
                >
                    Unlink
                </Button>
            </Box>
            {status && (
                <Typography
                    variant="body2"
                    sx={{ paddingLeft: 1, paddingTop: 0.5, color: statusKind === 'error' ? 'error.main' : 'text.secondary' }}
                >
                    {status}
                </Typography>
            )}
            <Dialog
                open={confirmingUnlink}
                onClose={() => setConfirmingUnlink(false)}
                aria-labelledby="unlink-dialog-title"
            >
                <DialogContent>
                    <DialogContentText id="unlink-dialog-title">
                        Unlink this package from its Gist? It will become editable again.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUnlink}>Yes</Button>
                    <Button onClick={() => setConfirmingUnlink(false)} autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PackageGistLinkActions;
