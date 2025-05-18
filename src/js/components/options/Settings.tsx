import React, { useState } from 'react';
import { EditorStoreContext } from "./UseEditorStoreContext";
import SettingsHeader from "./SettingsHeader";
import PackagesPage from "./PackagesPage";
import './Settings.scss';
import { Drawer, IconButton, Typography, ToggleButtonGroup, ToggleButton, Box, Button } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ImportDialog from './ImportDialog';
import ExportDialog from './ExportDialog';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';

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
                <Typography variant="subtitle2" sx={{ mb: 1, letterSpacing: 1 }}>MODE</Typography>
                <ToggleButtonGroup
                    value={themeMode}
                    exclusive
                    onChange={(_e, value) => value && onThemeChange(value)}
                    fullWidth
                    sx={{ mb: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', p: 0.5 }}
                >
                    <ToggleButton value="light" sx={{ flex: 1, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <LightModeIcon sx={{ mb: 0.5 }} />
                        Light
                    </ToggleButton>
                    <ToggleButton value="dark" sx={{ flex: 1, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <DarkModeIcon sx={{ mb: 0.5 }} />
                        Dark
                    </ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <Button startIcon={<DownloadIcon />} variant="outlined" onClick={openImportDialog}>
                        Import
                    </Button>
                    <Button startIcon={<UploadIcon />} variant="outlined" onClick={openExportDialog}>
                        Export
                    </Button>
                </Box>
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
