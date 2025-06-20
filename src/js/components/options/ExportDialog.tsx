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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { replaceItem } from "../../utils/arrayUtils";
import { EditorModel, SettingsPackage } from "../../types/types";
import { useEffect, useState } from "react";
import { pick } from 'lodash';

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
            id={`export-tabpanel-${index}`}
            aria-labelledby={`export-tab-${index}`}
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
        id: `export-tab-${index}`,
        'aria-controls': `export-tabpanel-${index}`,
    };
}

type ExportDialogContentProps = {
    selectedPackages: PackageItem[],
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>
}

function ExportDialogContent({ selectedPackages, setSelectedPackages }: ExportDialogContentProps) {
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

type ExportDialogProps = {
    packages: { [key: string]: SettingsPackage }
    isOpen: boolean
    closeDialog: () => void
}

export default function ExportDialog({ packages, isOpen, closeDialog }: ExportDialogProps) {
    const [selectedPackages, setSelectedPackages] = useState<Array<PackageItem>>([])
    const [tabValue, setTabValue] = useState(0);
    const [fileName, setFileName] = useState('reparams-export.json');

    useEffect(() => {
        setSelectedPackages(Object.values(packages || {}).map(v => ({
            key: v.key,
            label: v.label,
            checked: true
        })))
    }, [packages])

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const getExportData = (): EditorModel => {
        const packagesToExport = pick(packages, selectedPackages.filter(p => p.checked).map(v => v.key))
        return {
            packages: packagesToExport,
            modelVersion: '1.0.0'
        }
    }

    const exportToClipboard = () => {
        const exportData = getExportData();
        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
        closeDialog();
    }

    const exportToFile = () => {
        const exportData = getExportData();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        closeDialog();
    }

    const handleExport = () => {
        if (tabValue === 0) {
            exportToClipboard();
        } else if (tabValue === 1) {
            exportToFile();
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={closeDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="alert-dialog-title">
                Export packages
            </DialogTitle>
            <DialogContent>
                <Box sx={{ width: '100%' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange} aria-label="export methods">
                            <Tab icon={<ContentCopyIcon />} label="Clipboard" {...a11yProps(0)} />
                            <Tab icon={<DownloadIcon />} label="Local File" {...a11yProps(1)} />
                        </Tabs>
                    </Box>
                    <TabPanel value={tabValue} index={0}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Copy the selected packages as JSON to your clipboard.
                        </Typography>
                        <ExportDialogContent selectedPackages={selectedPackages} setSelectedPackages={setSelectedPackages} />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Download the selected packages as a JSON file to your computer.
                        </Typography>
                        <TextField
                            fullWidth
                            label="File name"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            sx={{ mb: 2 }}
                            size="small"
                        />
                        <ExportDialogContent selectedPackages={selectedPackages} setSelectedPackages={setSelectedPackages} />
                    </TabPanel>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleExport} autoFocus variant="contained">
                    {tabValue === 0 ? 'Copy to Clipboard' : 'Download File'}
                </Button>
                <Button onClick={closeDialog}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
