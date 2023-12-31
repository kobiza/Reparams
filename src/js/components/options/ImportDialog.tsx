import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import {replaceItem, toTrueObj} from "../../utils/arrayUtils";
import {EditorModel, EditorStore} from "../../types/types";
import {useEffect, useState} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "@mui/material";
import * as trace_events from "trace_events";

type PackageItem = { key: string, label: string, checked: boolean }
type ImportDialogContentProps = {
    selectedPackages: PackageItem[],
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>
}

function ImportDialogContent({selectedPackages, setSelectedPackages}: ImportDialogContentProps) {

    return (
        <List sx={{width: '400px', bgcolor: 'background.paper'}}>
            {selectedPackages.map(({key, label, checked}, index) => {
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
                                    inputProps={{'aria-labelledby': labelId}}
                                />
                            </ListItemIcon>
                            <ListItemText id={labelId} primary={label}/>
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    );
}

type ImportDialogProps = {
    packages: EditorModel
    packagesToImport: EditorModel | null
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

function AreYouSureModal({message, replacePackages, duplicatePackages, isOpen, closeDialog}: AreYouSureModalProps) {
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
        setSelectedPackages((packagesToImport || []).map(v => ({
            key: v.key,
            label: v.label,
            checked: true
        })))
    }, [packagesToImport])

    const [replaceRequiredModal, setReplaceRequiredModal] = useState(false)

    const forceImportPackages = (replace: boolean) => () => {
        const selectedPackagesToImport = packagesToImport!.filter((v, index) => {
            return selectedPackages[index].checked
        })
        addPackages(selectedPackagesToImport, replace)
        closeDialog()
    }

    const importPackages = () => {
        const selectedPackagesToImport = packagesToImport!.filter((v, index) => {
            return selectedPackages[index].checked
        })

        const packagesKeys = toTrueObj(packages, v => v.key)

        const isReplaceRequired = selectedPackagesToImport.some((v) => {
            const keyAlreadyExist = packagesKeys[v.key]

            return keyAlreadyExist
        })

        if (!isReplaceRequired) {
            addPackages(selectedPackagesToImport, false)
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
                    <ImportDialogContent selectedPackages={selectedPackages} setSelectedPackages={setSelectedPackages}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={importPackages} autoFocus>Import</Button>
                    <Button onClick={closeDialog}>Close</Button>
                </DialogActions>
            </Dialog>
            <AreYouSureModal message="Some of the packages already exist, choose an action"
                             replacePackages={forceImportPackages(true)} duplicatePackages={forceImportPackages(false)}
                             isOpen={replaceRequiredModal} closeDialog={closeReplaceRequiredModal}/>
        </React.Fragment>
    )
}