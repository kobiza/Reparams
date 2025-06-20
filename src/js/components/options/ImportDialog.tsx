import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LinkIcon from '@mui/icons-material/Link';
import { replaceItem, toTrueObj } from "../../utils/arrayUtils";
import { EditorStore, EditorModel, SettingsPackage } from "../../types/types";
import { useEffect, useState } from "react";

type PackageItem = { key: string, label: string, checked: boolean }

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`import-tabpanel-${index}`}
            aria-labelledby={`import-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `import-tab-${index}`,
        'aria-controls': `import-tabpanel-${index}`,
    };
}

type ImportDialogContentProps = {
    selectedPackages: PackageItem[],
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>
}

function ImportDialogContent({ selectedPackages, setSelectedPackages }: ImportDialogContentProps) {
    return (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {selectedPackages.map(({ key, label, checked }, index) => {
                const labelId = `checkbox-list-label-${key}`;
                const handleToggle = () => {
                    const newVal = replaceItem(selectedPackages, {
                        ...selectedPackages[index],
                        checked: !selectedPackages[index].checked
                    }, index)
                    setSelectedPackages(newVal)
                }

                return (
                    <ListItem
                        key={key}
                        disablePadding
                    >
                        <ListItemButton role={undefined} onClick={handleToggle} dense>
                            <ListItemIcon>
                                <Checkbox
                                    edge="start"
                                    checked={checked}
                                    tabIndex={-1}
                                    disableRipple
                                    inputProps={{ 'aria-labelledby': labelId }}
                                />
                            </ListItemIcon>
                            <ListItemText id={labelId} primary={label} />
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    );
}

type ImportDialogProps = {
    packages: { [key: string]: SettingsPackage }
    isOpen: boolean
    closeDialog: () => void
    addPackages: EditorStore['addPackages']
}

type AreYouSureModalProps = {
    message: string
    replacePackages: () => void
    isOpen: boolean
    closeDialog: () => void
}

function AreYouSureModal({ message, replacePackages, isOpen, closeDialog }: AreYouSureModalProps) {
    const replaceAndClose = () => {
        replacePackages()
        closeDialog()
    }
    return (
        <Dialog
            open={isOpen}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button color="warning" variant="outlined" onClick={replaceAndClose}>Override</Button>
                <Button onClick={closeDialog}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}

export default function ImportDialog({
    isOpen,
    closeDialog,
    packages,
    addPackages
}: ImportDialogProps) {
    const [selectedPackages, setSelectedPackages] = useState<Array<PackageItem>>([])
    const [tabValue, setTabValue] = useState(0);
    const [packagesToImport, setPackagesToImport] = useState<{ [key: string]: SettingsPackage } | null>(null);
    const [importUrl, setImportUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replaceRequiredModal, setReplaceRequiredModal] = useState(false);

    useEffect(() => {
        if (packagesToImport) {
            setSelectedPackages(Object.values(packagesToImport).map(v => ({
                key: v.key,
                label: v.label,
                checked: true
            })));
        }
    }, [packagesToImport]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        setError(null);
        setPackagesToImport(null);
        setSelectedPackages([]);
    };

    const parseImportData = (jsonString: string): EditorModel | null => {
        try {
            const data = JSON.parse(jsonString);
            if (data && data.packages) {
                return data;
            }
            setError('Invalid format: JSON must contain a "packages" property');
            return null;
        } catch (err) {
            setError('Invalid JSON format');
            return null;
        }
    };

    const importFromClipboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const text = await navigator.clipboard.readText();
            const data = parseImportData(text);
            if (data) {
                setPackagesToImport(data.packages);
            }
        } catch (err) {
            setError('Failed to read from clipboard');
        }
        setLoading(false);
    };

    const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const data = parseImportData(text);
            if (data) {
                setPackagesToImport(data.packages);
            }
            setLoading(false);
        };
        reader.onerror = () => {
            setError('Failed to read file');
            setLoading(false);
        };
        reader.readAsText(file);
    };

    const importFromUrl = async () => {
        if (!importUrl.trim()) {
            setError('Please enter a URL');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(importUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const text = await response.text();
            const data = parseImportData(text);
            if (data) {
                setPackagesToImport(data.packages);
            }
        } catch (err) {
            setError(`Failed to fetch from URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        setLoading(false);
    };

    const forceImportPackages = (replace: boolean) => () => {
        if (!packagesToImport) return;

        const selectedPackagesToImport = Object.values(packagesToImport).filter((v, index) => {
            return selectedPackages[index]?.checked;
        });
        const packagesObj = Object.fromEntries(selectedPackagesToImport.map(pkg => [pkg.key, pkg]));
        addPackages(packagesObj, replace);
        closeDialog();
        resetState();
    };

    const resetState = () => {
        setPackagesToImport(null);
        setSelectedPackages([]);
        setError(null);
        setImportUrl('');
        setTabValue(0);
    };

    const importPackages = () => {
        if (!packagesToImport) return;

        const selectedPackagesToImport = Object.values(packagesToImport).filter((v, index) => {
            return selectedPackages[index]?.checked;
        });
        const packagesKeys = Object.keys(packages);
        const isReplaceRequired = selectedPackagesToImport.some((v) => {
            return packagesKeys.includes(v.key);
        });

        if (!isReplaceRequired) {
            const packagesObj = Object.fromEntries(selectedPackagesToImport.map(pkg => [pkg.key, pkg]));
            addPackages(packagesObj, false);
            closeDialog();
            resetState();
        } else {
            setReplaceRequiredModal(true);
        }
    };

    const closeReplaceRequiredModal = () => {
        setReplaceRequiredModal(false);
    };

    const handleDialogClose = () => {
        closeDialog();
        resetState();
    };

    const canImport = packagesToImport && selectedPackages.some(p => p.checked);

    return (
        <React.Fragment>
            <Dialog
                open={isOpen}
                onClose={handleDialogClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { minHeight: '420px' } }}
            >
                <DialogTitle id="alert-dialog-title">
                    Import packages
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="import methods">
                                <Tab icon={<ContentPasteIcon />} label="Clipboard" {...a11yProps(0)} />
                                <Tab icon={<UploadFileIcon />} label="Local File" {...a11yProps(1)} />
                                <Tab icon={<LinkIcon />} label="From URL" {...a11yProps(2)} />
                            </Tabs>
                        </Box>
                        <TabPanel value={tabValue} index={0}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Import packages from JSON data in your clipboard.
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={importFromClipboard}
                                disabled={loading}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                {loading ? <CircularProgress size={20} /> : 'Read from Clipboard'}
                            </Button>
                        </TabPanel>
                        <TabPanel value={tabValue} index={1}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Import packages from a JSON file on your computer.
                            </Typography>
                            <input
                                accept=".json,application/json"
                                style={{ display: 'none' }}
                                id="file-upload"
                                type="file"
                                onChange={importFromFile}
                            />
                            <label htmlFor="file-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    disabled={loading}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    {loading ? <CircularProgress size={20} /> : 'Choose File'}
                                </Button>
                            </label>
                        </TabPanel>
                        <TabPanel value={tabValue} index={2}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Import packages from a URL that returns JSON data.
                            </Typography>
                            <TextField
                                fullWidth
                                label="JSON URL"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                placeholder="https://example.com/packages.json"
                                sx={{ mb: 2 }}
                                size="small"
                            />
                            <Button
                                variant="outlined"
                                onClick={importFromUrl}
                                disabled={loading || !importUrl.trim()}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                {loading ? <CircularProgress size={20} /> : 'Fetch from URL'}
                            </Button>
                        </TabPanel>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {packagesToImport && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Select packages to import:
                                </Typography>
                                <ImportDialogContent
                                    selectedPackages={selectedPackages}
                                    setSelectedPackages={setSelectedPackages}
                                />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={importPackages}
                        autoFocus
                        variant="contained"
                        disabled={!canImport}
                    >
                        Import Selected
                    </Button>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                </DialogActions>
            </Dialog>
            <AreYouSureModal
                message="Some of the packages already exist, choose an action"
                replacePackages={forceImportPackages(true)}
                isOpen={replaceRequiredModal}
                closeDialog={closeReplaceRequiredModal}
            />
        </React.Fragment>
    )
}
