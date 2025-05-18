import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import { useState } from "react";
import { EditorModel, EditorStore, SettingsPackage } from "../../types/types";
import isUndefined from 'lodash/isUndefined';
import { isObject } from 'lodash';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

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

function SettingsHeader({ packages, addPackages, onMenuClick }: SettingsHeaderProps & { onMenuClick: () => void }) {
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
                    <IconButton
                        size="large"
                        edge="end"
                        color="inherit"
                        aria-label="menu"
                        onClick={onMenuClick}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
export default SettingsHeader;
