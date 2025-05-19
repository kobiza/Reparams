import React, { useState } from 'react';
import { EditorStoreContext } from "./UseEditorStoreContext";
import SettingsHeader from "./SettingsHeader";
import PackagesPage from "./PackagesPage";
import './Settings.scss';
import { Drawer, Typography, ToggleButtonGroup, ToggleButton, ListItemButton } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ImportDialog from './ImportDialog';
import ExportDialog from './ExportDialog';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ContrastIcon from '@mui/icons-material/Contrast';

const Settings = ({ themeMode, onThemeChange }: { themeMode: 'light' | 'dark', onThemeChange: (mode: 'light' | 'dark') => void }) => {
    const editorStore = React.useContext(EditorStoreContext)
    const {
        state,
        addPackages
    } = editorStore
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [importDialogData, setImportDialogData] = useState<any>(null);
    const [exportDialog, setExportDialog] = useState(false);

    const openImportDialog = () => {
        navigator.clipboard.readText()
            .then(text => {
                try {
                    const clipboardJson = JSON.parse(text);
                    if (clipboardJson && clipboardJson.packages) {
                        setImportDialogData(clipboardJson.packages);
                    }
                } catch { }
            })
    };
    const closeImportDialog = () => setImportDialogData(null);
    const openExportDialog = () => setExportDialog(true);
    const closeExportDialog = () => setExportDialog(false);

    return (
        <div className='settings-pages'>
            <SettingsHeader packages={state.packages} addPackages={addPackages} onMenuClick={() => setDrawerOpen(true)} />
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: 320, bgcolor: 'background.default', color: 'text.primary', p: 2 } }}
            >
                <Typography variant="h6" sx={{ mb: 2 }}>Settings</Typography>
                <List>
                    <ListItem>
                        <ListItemIcon><ContrastIcon /></ListItemIcon>
                        <ListItemText primary="Theme" />
                        <ToggleButtonGroup
                            value={themeMode}
                            exclusive
                            onChange={(_e, value) => value && onThemeChange(value)}
                            size="small"
                            sx={{ ml: 2 }}
                        >
                            <ToggleButton value="light"><LightModeIcon /></ToggleButton>
                            <ToggleButton value="dark"><DarkModeIcon /></ToggleButton>
                        </ToggleButtonGroup>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={openImportDialog}>
                            <ListItemIcon><DownloadIcon /></ListItemIcon>
                            <ListItemText primary="Import" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={openExportDialog}>
                            <ListItemIcon><UploadIcon /></ListItemIcon>
                            <ListItemText primary="Export" />
                        </ListItemButton>
                    </ListItem>
                </List>
                <ImportDialog packages={state.packages} packagesToImport={importDialogData} isOpen={!!importDialogData} closeDialog={closeImportDialog} addPackages={addPackages} />
                <ExportDialog packages={state.packages} isOpen={exportDialog} closeDialog={closeExportDialog} />
            </Drawer>
            <div>
                <PackagesPage />
            </div>
        </div>
    )
}

export default Settings;
