import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import {replaceItem} from "../../utils/arrayUtils";
import {EditorModel} from "../../types/types";
import {useEffect, useState} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";

type PackageItem = { key: string, label: string, checked: boolean }
type ExportDialogContentProps = {
    selectedPackages: PackageItem[],
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>
}

function ExportDialogContent({selectedPackages, setSelectedPackages}: ExportDialogContentProps) {

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

type ExportDialogProps = {
    packages: EditorModel
    isOpen: boolean
    closeDialog: () => void
}

export default function ExportDialog({packages, isOpen, closeDialog}: ExportDialogProps) {
    const [selectedPackages, setSelectedPackages] = useState<Array<PackageItem>>([])

    useEffect(() => {
        setSelectedPackages((packages || []).map(v => ({
            key: v.key,
            label: v.label,
            checked: true
        })))
    }, [packages])

    const exportPackages = () => {
        const packagesToExport = packages.filter((v, index) => {
            return selectedPackages[index].checked
        })

        navigator.clipboard.writeText(JSON.stringify(packagesToExport))

        closeDialog()
    }
    return (
        <Dialog
            open={isOpen}
            onClose={closeDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {"Export packages"}
            </DialogTitle>
            <DialogContent>
                <ExportDialogContent selectedPackages={selectedPackages} setSelectedPackages={setSelectedPackages}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={exportPackages} autoFocus>Export</Button>
                <Button onClick={closeDialog}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}