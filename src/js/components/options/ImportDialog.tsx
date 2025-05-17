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
import { replaceItem, toTrueObj } from "../../utils/arrayUtils";
import { EditorStore, SettingsPackage } from "../../types/types";
import { useEffect, useState } from "react";
import * as trace_events from "trace_events";

type PackageItem = { key: string, label: string, checked: boolean }
type ImportDialogContentProps = {
    selectedPackages: PackageItem[],
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>
}

function ImportDialogContent({ selectedPackages, setSelectedPackages }: ImportDialogContentProps) {

    return (
        <List sx={{ width: '400px', bgcolor: 'background.paper' }}>
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
    packagesToImport: { [key: string]: SettingsPackage } | null
    isOpen: boolean
    closeDialog: () => void
    addPackages: EditorStore['addPackages']
}

type AreYouSureModalProps = {
    message: string
    replacePackages: () => void
    duplicatePackages: () => void
    isOpen: boolean
    closeDialog: () => void
}

function AreYouSureModal({ message, replacePackages, duplicatePackages, isOpen, closeDialog }: AreYouSureModalProps) {
    const replaceAndClose = () => {
        replacePackages()
        closeDialog()
    }
    const duplicateAndClose = () => {
        duplicatePackages()
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
                <Button variant="outlined" onClick={duplicateAndClose}>Keep both</Button>
                <Button onClick={closeDialog}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}

export default function ImportDialog({
    packagesToImport,
    isOpen,
    closeDialog,
    packages,
    addPackages
}: ImportDialogProps) {
    const [selectedPackages, setSelectedPackages] = useState<Array<PackageItem>>([])

    useEffect(() => {
        setSelectedPackages(Object.values(packagesToImport || {}).map(v => ({
            key: v.key,
            label: v.label,
            checked: true
        })))
    }, [packagesToImport])

    const [replaceRequiredModal, setReplaceRequiredModal] = useState(false)

    const forceImportPackages = (replace: boolean) => () => {
        const selectedPackagesToImport = Object.values(packagesToImport || {}).filter((v, index) => {
            return selectedPackages[index].checked
        })
        const packagesObj = Object.fromEntries(selectedPackagesToImport.map(pkg => [pkg.key, pkg]))
        addPackages(packagesObj, replace)
        closeDialog()
    }

    const importPackages = () => {
        const selectedPackagesToImport = Object.values(packagesToImport || {}).filter((v, index) => {
            return selectedPackages[index].checked
        })
        const packagesKeys = Object.keys(packages)
        const isReplaceRequired = selectedPackagesToImport.some((v) => {
            const keyAlreadyExist = packagesKeys.includes(v.key)
            return keyAlreadyExist
        })
        const packagesObj = Object.fromEntries(selectedPackagesToImport.map(pkg => [pkg.key, pkg]))
        if (!isReplaceRequired) {
            addPackages(packagesObj, false)
            closeDialog()
        } else {
            setReplaceRequiredModal(true)
        }
    }

    const closeReplaceRequiredModal = () => {
        setReplaceRequiredModal(false)
    }

    return (
        <React.Fragment>
            <Dialog
                open={isOpen}
                onClose={closeDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Import packages"}
                </DialogTitle>
                <DialogContent>
                    <Typography>Select packages to import</Typography>
                    <ImportDialogContent selectedPackages={selectedPackages} setSelectedPackages={setSelectedPackages} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={importPackages} autoFocus>Import</Button>
                    <Button onClick={closeDialog}>Close</Button>
                </DialogActions>
            </Dialog>
            <AreYouSureModal message="Some of the packages already exist, choose an action"
                replacePackages={forceImportPackages(true)} duplicatePackages={forceImportPackages(false)}
                isOpen={replaceRequiredModal} closeDialog={closeReplaceRequiredModal} />
        </React.Fragment>
    )
}
