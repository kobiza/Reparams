import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import { EditorStore, SettingsPackage } from '../../types/types';
import { pullPackageFromSource, UpdateCheckFailureReason } from '../../utils/connectedSync';

type Props = {
    packageData: SettingsPackage;
    addPackages: EditorStore['addPackages'];
    disconnectPackage: EditorStore['disconnectPackage'];
    showNotification: EditorStore['showNotification'];
};

const errorMessages: Record<UpdateCheckFailureReason, string> = {
    'fetch-failed': "Couldn't reach the source URL (network or 4xx/5xx).",
    'parse': "The source JSON couldn't be parsed.",
    'fixer-threw': "Couldn't upgrade the source data to the current model version.",
    'future-version': 'Source is from a newer extension version — please update first.',
    'package-missing-in-source': "This package isn't in the source anymore.",
};

const ConnectedPackageActions = ({ packageData, addPackages, disconnectPackage, showNotification }: Props) => {
    const [pulling, setPulling] = useState(false);
    const [pullError, setPullError] = useState<string | null>(null);
    const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
    const [confirmingPullOverride, setConfirmingPullOverride] = useState(false);

    const runPull = async () => {
        setPulling(true);
        setPullError(null);
        const result = await pullPackageFromSource(packageData);
        if (result.ok) {
            addPackages({ [packageData.key]: result.replacement }, true);
            showNotification(`Updated "${result.replacement.label}" from the source.`);
        } else {
            setPullError(errorMessages[result.reason]);
        }
        setPulling(false);
    };

    const handlePull = () => {
        if (packageData.isOverride) {
            setConfirmingPullOverride(true);
        } else {
            void runPull();
        }
    };

    const confirmPullOverride = () => {
        setConfirmingPullOverride(false);
        void runPull();
    };

    const handleDisconnect = () => {
        disconnectPackage(packageData.key);
        setConfirmingDisconnect(false);
    };

    return (
        <Box>
            <Typography variant="body2" sx={{ paddingLeft: 1, wordBreak: 'break-all', opacity: 0.85 }}>
                {packageData.sourceUrl}
            </Typography>
            {packageData.isOverride && (
                <Box sx={{ paddingLeft: 1, paddingTop: 0.5 }}>
                    <Chip label="Overridden" color="warning" size="small" />
                </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, paddingLeft: 1, paddingTop: 1 }}>
                <Button
                    variant="text"
                    onClick={handlePull}
                    disabled={pulling}
                    startIcon={pulling ? <CircularProgress size={16} /> : undefined}
                >
                    Pull latest
                </Button>
                <Button
                    variant="text"
                    color="warning"
                    onClick={() => setConfirmingDisconnect(true)}
                    disabled={pulling}
                >
                    Disconnect
                </Button>
            </Box>
            {pullError && (
                <Typography
                    variant="body2"
                    sx={{ paddingLeft: 1, paddingTop: 0.5, color: 'error.main' }}
                >
                    {pullError}
                </Typography>
            )}
            <Dialog
                open={confirmingDisconnect}
                onClose={() => setConfirmingDisconnect(false)}
                aria-labelledby="disconnect-dialog-title"
            >
                <DialogContent>
                    <DialogContentText id="disconnect-dialog-title">
                        Disconnect this package from its source URL? It will keep its current contents but won&apos;t receive updates anymore.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDisconnect}>Yes</Button>
                    <Button onClick={() => setConfirmingDisconnect(false)} autoFocus>No</Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={confirmingPullOverride}
                onClose={() => setConfirmingPullOverride(false)}
                aria-labelledby="pull-override-dialog-title"
            >
                <DialogContent>
                    <DialogContentText id="pull-override-dialog-title">
                        This package has local overrides. Pulling will replace them with the source version. Continue?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={confirmPullOverride}>Yes, replace</Button>
                    <Button onClick={() => setConfirmingPullOverride(false)} autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ConnectedPackageActions;
