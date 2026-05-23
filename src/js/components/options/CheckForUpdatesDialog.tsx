import React, { useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import { EditorStore, SettingsPackage } from '../../types/types';
import {
    checkConnectedPackagesForUpdates,
    ConnectedCheckResult,
    UpdateCheckFailureReason,
} from '../../utils/connectedSync';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    packages: { [key: string]: SettingsPackage };
    addPackages: EditorStore['addPackages'];
};

type OverrideChoice = 'pull' | 'keep';

const errorReasonLabel: Record<UpdateCheckFailureReason, string> = {
    'fetch-failed': "couldn't reach the source URL",
    'parse': 'source JSON malformed',
    'fixer-threw': "couldn't upgrade the source data",
    'future-version': 'source is from a newer extension version',
    'package-missing-in-source': 'package no longer in source',
};

const CheckForUpdatesDialog = ({ isOpen, onClose, packages, addPackages }: Props) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ConnectedCheckResult | null>(null);
    const [overrideChoices, setOverrideChoices] = useState<Record<string, OverrideChoice>>({});
    const [applied, setApplied] = useState<SettingsPackage[] | null>(null);

    // Snapshot `packages` via a ref so Apply's `addPackages` call doesn't
    // re-trigger this effect (Apply → store update → new packages prop would
    // otherwise reset the dialog to loading and re-fetch).
    const packagesRef = useRef(packages);
    packagesRef.current = packages;

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setLoading(true);
        setResult(null);
        setOverrideChoices({});
        setApplied(null);
        (async () => {
            const r = await checkConnectedPackagesForUpdates(packagesRef.current);
            if (!cancelled) {
                const initialChoices: Record<string, OverrideChoice> = {};
                r.overrideConflicts.forEach(({ pkg }) => {
                    initialChoices[pkg.key] = 'keep';
                });
                setOverrideChoices(initialChoices);
                setResult(r);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [isOpen]);

    const setChoice = (packageKey: string, choice: OverrideChoice) => {
        setOverrideChoices(prev => ({ ...prev, [packageKey]: choice }));
    };

    const handleApply = () => {
        if (!result) return;
        const replacements: { [key: string]: SettingsPackage } = {};
        result.autoApplied.forEach(({ replacement }) => {
            replacements[replacement.key] = replacement;
        });
        result.overrideConflicts.forEach(({ replacement }) => {
            if (overrideChoices[replacement.key] === 'pull') {
                replacements[replacement.key] = replacement;
            }
        });
        const updatedList = Object.values(replacements);
        if (updatedList.length > 0) {
            addPackages(replacements, true);
        }
        setApplied(updatedList);
    };

    const hasResults = !!result && (
        result.autoApplied.length > 0 ||
        result.overrideConflicts.length > 0 ||
        result.errors.length > 0
    );

    const someOverrideToPull = !!result && result.overrideConflicts.some(
        ({ replacement }) => overrideChoices[replacement.key] === 'pull'
    );
    const canApply = !!result && (result.autoApplied.length > 0 || someOverrideToPull);

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Check for updates</DialogTitle>
            <DialogContent>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress />
                    </Box>
                )}
                {applied && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                        <AlertTitle>Sync finished</AlertTitle>
                        {applied.length === 0 ? (
                            'No packages were updated.'
                        ) : (
                            <>
                                Updated {applied.length} package{applied.length === 1 ? '' : 's'}:
                                <List dense sx={{ mt: 0.5 }}>
                                    {applied.map((pkg) => (
                                        <ListItem key={pkg.key} disableGutters sx={{ py: 0 }}>
                                            <ListItemText primary={pkg.label} />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        )}
                    </Alert>
                )}
                {!applied && !loading && result && !hasResults && (
                    <Typography>
                        {result.checked === 0
                            ? 'No connected packages.'
                            : 'No connected packages to update.'}
                    </Typography>
                )}
                {!applied && !loading && result && hasResults && (
                    <Box>
                        <Typography sx={{ mb: 1 }}>
                            Checked {result.checked} connected package{result.checked === 1 ? '' : 's'}.
                        </Typography>

                        {result.autoApplied.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                                    Will be updated:
                                </Typography>
                                <List dense>
                                    {result.autoApplied.map(({ pkg }) => (
                                        <ListItem key={pkg.key} disableGutters>
                                            <ListItemText primary={pkg.label} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {result.overrideConflicts.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                                    Overridden packages — choose per package:
                                </Typography>
                                <List dense>
                                    {result.overrideConflicts.map(({ pkg }) => (
                                        <ListItem key={pkg.key} disableGutters sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <ListItemText primary={pkg.label} />
                                            <FormControl>
                                                <RadioGroup
                                                    row
                                                    value={overrideChoices[pkg.key] ?? 'keep'}
                                                    onChange={(e) => setChoice(pkg.key, e.target.value as OverrideChoice)}
                                                >
                                                    <FormControlLabel value="keep" control={<Radio size="small" />} label="Keep existing" />
                                                    <FormControlLabel value="pull" control={<Radio size="small" />} label="Pull update" />
                                                </RadioGroup>
                                            </FormControl>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
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
                {applied ? (
                    <Button onClick={onClose} variant="contained" autoFocus>Close</Button>
                ) : (
                    <>
                        <Button
                            onClick={handleApply}
                            variant="contained"
                            disabled={loading || !canApply}
                        >
                            Apply
                        </Button>
                        <Button onClick={onClose}>Cancel</Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CheckForUpdatesDialog;
