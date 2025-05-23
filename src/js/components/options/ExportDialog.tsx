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
import { replaceItem } from "../../utils/arrayUtils";
import { EditorModel, SettingsPackage } from "../../types/types";
import { useEffect, useState } from "react";
import { pick } from 'lodash';

type PackageItem = { key: string, label: string, checked: boolean }
type ExportDialogContentProps = {
    selectedPackages: PackageItem[],
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>
}

function ExportDialogContent({ selectedPackages, setSelectedPackages }: ExportDialogContentProps) {

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

type ExportDialogProps = {
    packages: { [key: string]: SettingsPackage }
    isOpen: boolean
    closeDialog: () => void
}

export default function ExportDialog({ packages, isOpen, closeDialog }: ExportDialogProps) {
    const [selectedPackages, setSelectedPackages] = useState<Array<PackageItem>>([])

    useEffect(() => {
        setSelectedPackages(Object.values(packages || {}).map(v => ({
            key: v.key,
            label: v.label,
            checked: true
        })))
    }, [packages])

    const exportPackages = () => {
        const packagesToExport = pick(packages, selectedPackages.map(v => v.key))
        const e: EditorModel = {
            packages: packagesToExport,
            modelVersion: '1.0.0'
        }
        navigator.clipboard.writeText(JSON.stringify(e))
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
                <ExportDialogContent selectedPackages={selectedPackages} setSelectedPackages={setSelectedPackages} />
            </DialogContent>
            <DialogActions>
                <Button onClick={exportPackages} autoFocus>Export</Button>
                <Button onClick={closeDialog}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}
