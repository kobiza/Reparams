import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { EditorStoreContext } from './UseEditorStoreContext';

const FirstEditPromptDialog = () => {
    const { pendingFirstEdit, confirmOverride, forkAsNewPackage, cancelPendingEdit } =
        useContext(EditorStoreContext);

    const isOpen = pendingFirstEdit !== null;
    const label = pendingFirstEdit?.packageLabel ?? '';

    return (
        <Dialog
            open={isOpen}
            onClose={cancelPendingEdit}
            aria-labelledby="first-edit-dialog-title"
            aria-describedby="first-edit-dialog-description"
        >
            <DialogTitle id="first-edit-dialog-title">Edit connected package?</DialogTitle>
            <DialogContent>
                <DialogContentText id="first-edit-dialog-description" component="div">
                    <p>{`"${label}" is connected to a source URL. How do you want to proceed?`}</p>
                    <ul>
                        <li><strong>Override locally</strong> — apply your edits and keep the connection. Future updates will ask before overwriting.</li>
                        <li><strong>Create a copy</strong> — leave the original untouched and start a new package with the same activation conditions and params.</li>
                    </ul>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={cancelPendingEdit} autoFocus>Cancel</Button>
                <Button onClick={forkAsNewPackage}>Create new with same settings</Button>
                <Button onClick={confirmOverride} variant="contained" color="warning">Override</Button>
            </DialogActions>
        </Dialog>
    );
};

export default FirstEditPromptDialog;
