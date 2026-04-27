import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { localStorageKey } from '../../utils/consts';
import { MigrateFailureReason } from '../../utils/dataFixer';

type DataIssueDialogProps = {
    isOpen: boolean;
    reason: MigrateFailureReason;
    onDismiss: () => void;
    onReset: () => void;
};

const reasonSubtitle: Record<MigrateFailureReason, string> = {
    parse: "The saved data appears to be corrupted and couldn't be read.",
    'fixer-threw': "We couldn't upgrade your saved data to the current version. A future release may be able to recover it.",
    'future-version': "Your saved data is from a newer version of the extension. Downgrading isn't supported.",
};

const exportRawData = () => {
    const raw = localStorage.getItem(localStorageKey) ?? '';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reparams-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export default function DataIssueDialog({ isOpen, reason, onDismiss, onReset }: DataIssueDialogProps) {
    const [confirmingReset, setConfirmingReset] = useState(false);

    const handleClose = () => {
        setConfirmingReset(false);
        onDismiss();
    };

    const handleResetClick = () => setConfirmingReset(true);
    const handleResetConfirm = () => {
        setConfirmingReset(false);
        onReset();
    };
    const handleResetCancel = () => setConfirmingReset(false);

    return (
        <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>We ran into an issue loading your saved settings</DialogTitle>
            <DialogContent>
                <Typography>{reasonSubtitle[reason]}</Typography>
                {confirmingReset && (
                    <Typography sx={{ mt: 2, color: 'warning.main' }}>
                        This will delete all your saved packages. Continue?
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                {confirmingReset ? (
                    <>
                        <Button color="warning" variant="contained" onClick={handleResetConfirm}>
                            Confirm reset
                        </Button>
                        <Button onClick={handleResetCancel}>Cancel</Button>
                    </>
                ) : (
                    <>
                        <Button variant="outlined" onClick={exportRawData}>
                            Export raw data
                        </Button>
                        <Button color="warning" onClick={handleResetClick}>
                            Reset
                        </Button>
                        <Button onClick={handleClose}>Dismiss</Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
