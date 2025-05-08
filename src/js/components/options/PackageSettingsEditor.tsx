import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, Divider, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { uuidv4 } from '../../utils/utils';
import { SettingsPackage, EditorStore } from '../../types/types';
import { replaceItem } from '../../utils/arrayUtils';

interface ParamsEditorProps {
    packageIndex: number
    paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']
    urlPatterns: SettingsPackage['urlPatterns']
    label: SettingsPackage['label']
    addNewPackage: EditorStore['addNewPackage']
    updatePackageParamsWithDelimiter: EditorStore['updatePackageParamsWithDelimiter']
    updatePackageUrlPatterns: EditorStore['updatePackageUrlPatterns']
    deletePackage: EditorStore['deletePackage']
}

const PackageSettingsEditor = ({
    packageIndex,
    paramsWithDelimiter,
    updatePackageParamsWithDelimiter,
    urlPatterns,
    label,
    addNewPackage,
    updatePackageUrlPatterns,
    deletePackage
}: ParamsEditorProps) => {
    const paramsItems = paramsWithDelimiter.map((paramData, index) => {
        const { label, separator, id } = paramData

        const updateParamLabel = (newParamLabel: string) => {
            const prevItem = paramsWithDelimiter[index]
            const newItem = { ...prevItem, label: newParamLabel }
            const newParamsWithDelimiter = replaceItem(paramsWithDelimiter, newItem, index)

            updatePackageParamsWithDelimiter(packageIndex, newParamsWithDelimiter)
        }

        const updateParamSeparator = (newParamSeparator: string) => {
            const prevItem = paramsWithDelimiter[index]
            const newItem = { ...prevItem, separator: newParamSeparator }
            const newParamsWithDelimiter = replaceItem(paramsWithDelimiter, newItem, index)

            updatePackageParamsWithDelimiter(packageIndex, newParamsWithDelimiter)
        }

        return (
            <div key={id} className="multi-param-input-row">
                <TextField
                    sx={{
                        marginRight: '10px'
                    }}
                    hiddenLabel
                    placeholder="Parameter key"
                    size="small"
                    value={label} onChange={e => updateParamLabel(e.target.value)}
                />
                <TextField
                    hiddenLabel
                    placeholder="Delimeter"
                    size="small"
                    value={separator} onChange={e => updateParamSeparator(e.target.value)}
                />
            </div>
        )
    })

    const addNewMultiParam = () => {
        const newParamsWithDelimiter = [
            ...paramsWithDelimiter,
            {
                id: uuidv4(),
                label: '',
                separator: ''
            }
        ]

        updatePackageParamsWithDelimiter(packageIndex, newParamsWithDelimiter)
    }

    const patternsInput = urlPatterns.map((v, index) => {
        const updateCurrentPattern = (value: string) => {
            const newUrlPatterns = replaceItem(urlPatterns, { value, id: v.id }, index)

            updatePackageUrlPatterns(packageIndex, newUrlPatterns)
        }
        return (
            <div key={v.id} style={{ display: 'flex', marginTop: '10px' }}>
                <TextField
                    sx={{ flex: '1' }}
                    hiddenLabel
                    size="small"
                    value={v.value} onChange={e => updateCurrentPattern(e.target.value)}
                />
            </div>
        )
    })

    const addNewUrlPattern = () => {
        updatePackageUrlPatterns(packageIndex, [...urlPatterns, { id: uuidv4(), value: '*://*/*' }])
    }

    const addPackageWithSameSettings = () => {
        addNewPackage({ paramsWithDelimiter, urlPatterns })
    }

    const [deletePackageDialog, setDeletePackageDialog] = useState(false)
    const openDeleteDialog = () => {
        setDeletePackageDialog(true);
    };

    const closeDeleteDialog = () => {
        setDeletePackageDialog(false);
    };

    const deleteCurrentPackage = () => {
        deletePackage(packageIndex)
        closeDeleteDialog()
    }

    return (
        <div>
            <Typography fontWeight="bold" padding={1}>Url patterns</Typography>
            <Box>
                {patternsInput}
                <Button sx={{ marginTop: '10px' }} onClick={addNewUrlPattern}
                    variant="text" startIcon={<AddIcon />}>Add</Button>
            </Box>
            <Divider sx={{ margin: '15px 0' }} />
            <Typography fontWeight="bold" padding={1}>Params with delimiter</Typography>
            <Box>
                {paramsItems}
                <Button sx={{ marginTop: '10px' }} onClick={addNewMultiParam}
                    variant="text" startIcon={<AddIcon />}>Add</Button>
            </Box>
            <Divider sx={{ margin: '15px 0' }} />
            <div>
                <Button sx={{ marginTop: '10px' }} onClick={() => addPackageWithSameSettings()}
                    variant="text">Add package with same settings</Button>
            </div>
            <div>
                <Button color="warning" sx={{ marginTop: '10px' }} onClick={openDeleteDialog}
                    variant="text">Delete Package</Button>
                <Dialog
                    open={deletePackageDialog}
                    onClose={closeDeleteDialog}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            {`Delete package "${label}"?`}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={deleteCurrentPackage}>Yes</Button>
                        <Button onClick={closeDeleteDialog} autoFocus>No</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    )
}

export default PackageSettingsEditor;
