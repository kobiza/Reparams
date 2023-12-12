import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import {Download, Upload} from "@mui/icons-material";
import {useState} from "react";
import ExportDialog from "./ExportDialog";
import {EditorModel, EditorStore} from "../types/types";
import ImportDialog from "./ImportDialog";
import _ from 'lodash'

type SettingsHeaderProps = {
    packages: EditorModel
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
        if (_.isArray(clipboardJson) &&
            ['key', 'label', 'urlPatterns', 'presets', 'paramsWithDelimiter', 'quickActions'].every(key => {
                return !_.isUndefined(clipboardJson[0][key])
            })) {
            return clipboardJson as EditorModel
        } else {
            return null
        }
    } catch (e) {
        return null
    }
}

function SettingsHeader({packages, addPackages}: SettingsHeaderProps) {
    const [importDialogData, setImportDialogData] = useState<EditorModel | null>(null)
    const openImportDialog = () => {
        navigator.clipboard.readText()
            .then(text => {
                const editorModel = getEditorModelFromClipboard(text)
                setImportDialogData(editorModel);
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
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                            mr: 2,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            flexGrow: 1
                        }}
                    >
                        {`bili - Settings`}
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button startIcon={<Download/>} sx={{ color: '#fff' }} onClick={openImportDialog}>
                            Import
                        </Button>
                        <ImportDialog packages={packages} packagesToImport={importDialogData} isOpen={!!importDialogData} closeDialog={closeImportDialog} addPackages={addPackages}/>
                        <Button startIcon={<Upload/>} sx={{ color: '#fff' }} onClick={openExportDialog}>
                            Export
                        </Button>
                        <ExportDialog packages={packages} isOpen={exportDialog} closeDialog={closeExportDialog}/>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
export default SettingsHeader;