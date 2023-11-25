import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import {Download, Upload} from "@mui/icons-material";
import {useState} from "react";
import ExportDialog from "./ExportDialog";
import {EditorModel} from "../types/types";

type SettingsHeaderProps = {
    packages: EditorModel
}

function SettingsHeader({packages}: SettingsHeaderProps) {
    const [importDialog, setImportDialog] = useState(false)
    const openImportDialog = () => {
        setImportDialog(true);
    };

    const closeImportDialog = () => {
        setImportDialog(false);
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
                        {`ReParams - Settings`}
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button startIcon={<Download/>} sx={{ color: '#fff' }} onClick={() => {}}>
                            Import
                        </Button>
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