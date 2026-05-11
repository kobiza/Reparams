import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { EditorStore, SettingsPackage } from '../../types/types';
import { BulkCheckResult, checkForUpdates, SyncFailureReason } from '../../utils/gistSync';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    packages: { [key: string]: SettingsPackage };
    addPackages: EditorStore['addPackages'];
};

const errorReasonLabel: Record<SyncFailureReason, string> = {
    'invalid-input': "couldn't recognize Gist ID",
    'fetch-failed': "couldn't reach the Gist",
    'no-json-file': 'Gist has no .json file',
    'parse': 'Gist JSON malformed',
    'fixer-threw': "couldn't upgrade the Gist's data",
    'future-version': 'Gist is from a newer extension version',
    'package-missing-in-gist': 'package no longer in Gist',
};

const BulkSyncDialog = ({ isOpen, onClose, packages, addPackages }: Props) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<BulkCheckResult | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setLoading(true);
        setResult(null);
        (async () => {
            const r = await checkForUpdates(packages);
            if (!cancelled) {
                setResult(r);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [isOpen, packages]);

    const handleSyncAll = () => {
        if (!result || result.outOfDate.length === 0) return;
        const replacements = Object.fromEntries(
            result.outOfDate.map(({ replacement }) => [replacement.key, replacement])
        );
        addPackages(replacements, true);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Gist updates</DialogTitle>
            <DialogContent>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress />
                    </Box>
                )}
                {!loading && result && (
                    <Box>
                        <Typography sx={{ mb: 1 }}>
                            {result.outOfDate.length} of {result.checked} linked package{result.checked === 1 ? '' : 's'} {result.checked === 1 ? 'has' : 'have'} updates.
                        </Typography>
                        {result.outOfDate.length > 0 && (
                            <List dense>
                                {result.outOfDate.map(({ pkg }) => (
                                    <ListItem key={pkg.key} disableGutters>
                                        <ListItemText primary={pkg.label} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                        {result.errors.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                                    Errors:
                                </Typography>
                                <List dense>
                                    {result.errors.map(({ packageKey, reason }) => {
                                        const pkg = packages[packageKey];
                                        return (
                                            <ListItem key={packageKey} disableGutters>
                                                <ListItemText
                                                    primary={pkg?.label ?? packageKey}
                                                    secondary={errorReasonLabel[reason]}
                                                />
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleSyncAll}
                    variant="contained"
                    disabled={loading || !result || result.outOfDate.length === 0}
                >
                    Sync all out-of-date
                </Button>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkSyncDialog;
