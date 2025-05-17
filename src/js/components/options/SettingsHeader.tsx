import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { useState } from "react";
import ExportDialog from "./ExportDialog";
import { EditorModel, EditorStore, SettingsPackage } from "../../types/types";
import ImportDialog from "./ImportDialog";
import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import { isObject } from 'lodash';

type SettingsHeaderProps = {
    packages: { [key: string]: SettingsPackage }
    addPackages: EditorStore['addPackages']
}


//key: 'kobiz-package',
//     label: 'kobiz package',
//     urlPatterns: [{id: 'p-1', value: '*://*/*'}],
//     presets,
//     paramsWithDelimiter,
//     quickActions
const getEditorModelFromClipboard = (text: string) => {
    try {
        const clipboardJson = JSON.parse(text)
        if (isObject(clipboardJson) && !isUndefined((clipboardJson as EditorModel).packages)) {
            return clipboardJson as EditorModel
        } else {
            return null
        }
    } catch (e) {
        return null
    }
}

function SettingsHeader({ packages, addPackages }: SettingsHeaderProps) {
    const [importDialogData, setImportDialogData] = useState<{ [key: string]: SettingsPackage } | null>(null)
    const openImportDialog = () => {
        navigator.clipboard.readText()
            .then(text => {
                const editorModel = getEditorModelFromClipboard(text)
                setImportDialogData(editorModel?.packages || null);
            })
    };

    const closeImportDialog = () => {
        setImportDialogData(null);
    };

    const importPackages = () => {
        // import
        closeImportDialog()
    }

    const [exportDialog, setExportDialog] = useState(false)
    const openExportDialog = () => {
        setExportDialog(true);
    };

    const closeExportDialog = () => {
        setExportDialog(false);
    };

    return (
        <AppBar position="relative" component="nav">
            <Container maxWidth={false}>
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                            mr: 2,
                            fontFamily: ['Leckerli One', 'monospace'].join(','),
                            fontWeight: 700,
                            letterSpacing: '2px',
                            color: 'inherit',
                            textDecoration: 'none',
                            flexGrow: 1
                        }}
                    >
                        {`ReParams - Settings`}
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button startIcon={<DownloadIcon />} sx={{ color: '#fff' }} onClick={openImportDialog}>
                            Import
                        </Button>
                        <ImportDialog packages={packages} packagesToImport={importDialogData} isOpen={!!importDialogData} closeDialog={closeImportDialog} addPackages={addPackages} />
                        <Button startIcon={<UploadIcon />} sx={{ color: '#fff' }} onClick={openExportDialog}>
                            Export
                        </Button>
                        <ExportDialog packages={packages} isOpen={exportDialog} closeDialog={closeExportDialog} />
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
export default SettingsHeader;
