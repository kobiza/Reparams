import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { uuidv4 } from '../../utils/utils';
import { SettingsPackage, EditorStore } from '../../types/types';
import { replaceItem } from '../../utils/arrayUtils';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
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

        const removeParam = () => {
            const newParamsWithDelimiter = paramsWithDelimiter.filter((_, i) => i !== index)
            updatePackageParamsWithDelimiter(packageIndex, newParamsWithDelimiter)
        }

        return (
            <div key={id} className="multi-param-input-row" style={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                    sx={{ marginRight: '10px', flex: 1 }}
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
                <IconButton aria-label="delete" color="primary" size="small"
                    sx={{ padding: '0', marginLeft: '10px' }} onClick={removeParam}>
                    <ClearIcon fontSize="inherit" />
                </IconButton>
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
        const removePattern = () => {
            const newUrlPatterns = urlPatterns.filter((_, i) => i !== index)
            updatePackageUrlPatterns(packageIndex, newUrlPatterns)
        }
        return (
            <div key={v.id} style={{ display: 'flex', marginTop: '10px', alignItems: 'center' }}>
                <TextField
                    sx={{ flex: '1' }}
                    hiddenLabel
                    size="small"
                    value={v.value} onChange={e => updateCurrentPattern(e.target.value)}
                />
                <IconButton aria-label="delete" color="primary" size="small"
                    sx={{ padding: '0', marginLeft: '10px' }} onClick={removePattern}>
                    <ClearIcon fontSize="inherit" />
                </IconButton>
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
