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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface ParamsEditorProps {
    packageKey: string
    paramsWithDelimiter: SettingsPackage['paramsWithDelimiter']
    urlPatterns: SettingsPackage['conditions']['urlPatterns']
    domSelectors: SettingsPackage['conditions']['domSelectors']
    label: SettingsPackage['label']
    paramHistoryCount: number
    isLocked?: boolean
    gistLinkActions?: React.ReactNode
    addNewPackage: EditorStore['addNewPackage']
    updatePackageParamsWithDelimiter: EditorStore['updatePackageParamsWithDelimiter']
    updatePackageUrlPatterns: EditorStore['updatePackageUrlPatterns']
    updatePackageDomSelectors: EditorStore['updatePackageDomSelectors']
    deletePackage: EditorStore['deletePackage']
    clearPackageParamHistory: EditorStore['clearPackageParamHistory']
}

const PackageSettingsEditor = ({
    packageKey,
    paramsWithDelimiter,
    urlPatterns,
    domSelectors,
    label,
    paramHistoryCount,
    isLocked,
    gistLinkActions,
    addNewPackage,
    updatePackageParamsWithDelimiter,
    updatePackageUrlPatterns,
    updatePackageDomSelectors,
    deletePackage,
    clearPackageParamHistory
}: ParamsEditorProps) => {
    const paramsItems = paramsWithDelimiter.map((paramData, index) => {
        const { label, separator, id } = paramData

        const updateParamLabel = (newParamLabel: string) => {
            const prevItem = paramsWithDelimiter[index]
            const newItem = { ...prevItem, label: newParamLabel }
            const newParamsWithDelimiter = replaceItem(paramsWithDelimiter, newItem, index)

            updateParamsWithDelimiter(newParamsWithDelimiter)
        }

        const updateParamSeparator = (newParamSeparator: string) => {
            const prevItem = paramsWithDelimiter[index]
            const newItem = { ...prevItem, separator: newParamSeparator }
            const newParamsWithDelimiter = replaceItem(paramsWithDelimiter, newItem, index)

            updateParamsWithDelimiter(newParamsWithDelimiter)
        }

        const removeParam = () => {
            const newParamsWithDelimiter = paramsWithDelimiter.filter((_, i) => i !== index)
            updateParamsWithDelimiter(newParamsWithDelimiter)
        }

        return (
            <Box key={id} className="multi-param-input-row" sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                    sx={{ marginRight: '10px', flex: 1 }}
                    hiddenLabel
                    placeholder="Parameter key"
                    size="small"
                    disabled={isLocked}
                    value={label} onChange={e => updateParamLabel(e.target.value)}
                />
                <TextField
                    sx={{ width: 72 }}
                    hiddenLabel
                    placeholder="e.g. ,"
                    size="small"
                    disabled={isLocked}
                    value={separator} onChange={e => updateParamSeparator(e.target.value)}
                />
                <IconButton aria-label="delete" color="primary" size="small"
                    disabled={isLocked}
                    sx={{ padding: '0', marginLeft: '10px' }} onClick={removeParam}>
                    <ClearIcon fontSize="inherit" />
                </IconButton>
            </Box>
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

        updateParamsWithDelimiter(newParamsWithDelimiter)
    }

    const patternsInput = urlPatterns.map((v, index) => {
        const updateCurrentPattern = (value: string) => {
            const newUrlPatterns = replaceItem(urlPatterns, { value, id: v.id }, index)
            updateUrlPatterns(newUrlPatterns)
        }
        const removePattern = () => {
            const newUrlPatterns = urlPatterns.filter((_, i) => i !== index)
            updateUrlPatterns(newUrlPatterns)
        }
        return (
            <Box key={v.id} sx={{ display: 'flex', marginTop: '8px', alignItems: 'center' }}>
                <TextField
                    sx={{ flex: '1' }}
                    hiddenLabel
                    size="small"
                    disabled={isLocked}
                    value={v.value} onChange={e => updateCurrentPattern(e.target.value)}
                />
                <IconButton aria-label="delete" color="primary" size="small"
                    disabled={isLocked}
                    sx={{ padding: '0', marginLeft: '10px' }} onClick={removePattern}>
                    <ClearIcon fontSize="inherit" />
                </IconButton>
            </Box>
        )
    })

    const addNewUrlPattern = () => {
        updateUrlPatterns([...urlPatterns, { id: uuidv4(), value: '*://*/*' }])
    }

    const addPackageWithSameSettings = () => {
        addNewPackage({ paramsWithDelimiter, conditions: { urlPatterns, domSelectors } })
    }

    const [deletePackageDialog, setDeletePackageDialog] = useState(false)
    const openDeleteDialog = () => {
        setDeletePackageDialog(true);
    };

    const closeDeleteDialog = () => {
        setDeletePackageDialog(false);
    };

    const handleDelete = () => {
        deletePackage(packageKey)
        closeDeleteDialog()
    }

    const [clearHistoryDialog, setClearHistoryDialog] = useState(false)
    const openClearHistoryDialog = () => setClearHistoryDialog(true)
    const closeClearHistoryDialog = () => setClearHistoryDialog(false)
    const handleClearHistory = () => {
        clearPackageParamHistory(packageKey)
        closeClearHistoryDialog()
    }

    const domSelectorsInput = domSelectors.map((v, index) => {
        const updateCurrentDomSelectorPath = (value: string) => {
            const prevItem = domSelectors[index]
            const newItem = { ...prevItem, path: value }
            const newDomSelectors = replaceItem(domSelectors, newItem, index)
            updateDomSelectors(newDomSelectors)
        }
        const updateCurrentDomSelectorValue = (value: string) => {
            const prevItem = domSelectors[index]
            const newItem = { ...prevItem, value }
            const newDomSelectors = replaceItem(domSelectors, newItem, index)
            updateDomSelectors(newDomSelectors)
        }
        const removeDomSelector = () => {
            const newDomSelectors = domSelectors.filter((_, i) => i !== index)
            updateDomSelectors(newDomSelectors)
        }
        return (
            <Box key={v.id} sx={{ display: 'flex', marginTop: '8px', alignItems: 'center' }}>
                <TextField
                    sx={{ flex: '1' }}
                    hiddenLabel
                    size="small"
                    disabled={isLocked}
                    value={v.value} onChange={e => updateCurrentDomSelectorValue(e.target.value)}
                />
                <IconButton aria-label="delete" color="primary" size="small"
                    disabled={isLocked}
                    sx={{ padding: '0', marginLeft: '10px' }} onClick={removeDomSelector}>
                    <ClearIcon fontSize="inherit" />
                </IconButton>
            </Box>
        )
    })

    const addNewDomSelector = () => {
        updateDomSelectors([...domSelectors, { id: uuidv4(), value: '' }])
    }

    const updateParamsWithDelimiter = (params: SettingsPackage['paramsWithDelimiter']) => {
        updatePackageParamsWithDelimiter(packageKey, params)
    }

    const updateUrlPatterns = (patterns: SettingsPackage['conditions']['urlPatterns']) => {
        updatePackageUrlPatterns(packageKey, patterns)
    }

    const updateDomSelectors = (selectors: SettingsPackage['conditions']['domSelectors']) => {
        updatePackageDomSelectors(packageKey, selectors)
    }

    return (
        <div>
            <Typography fontWeight="bold" sx={{ paddingY: 0.5 }}>Activation conditions</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, paddingBottom: 1 }}>
                Where this package&apos;s presets are available. The package activates when any URL pattern matches, or when any DOM selector is present on the page.
            </Typography>

            <Box sx={{ paddingLeft: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', paddingTop: 1 }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>Url patterns</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        Match-pattern syntax (e.g. https://example.com/*).
                    </Typography>
                </Box>
                <Box>
                    {patternsInput}
                    <Button sx={{ marginTop: '8px' }} onClick={addNewUrlPattern}
                        disabled={isLocked}
                        variant="text" startIcon={<AddIcon />}>Add</Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', paddingTop: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>Dom selectors</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        Optional. Activates the package if any selector matches.
                    </Typography>
                </Box>
                <Box>
                    {domSelectorsInput}
                    <Button sx={{ marginTop: '8px' }} onClick={addNewDomSelector}
                        disabled={isLocked}
                        variant="text" startIcon={<AddIcon />}>Add</Button>
                </Box>
            </Box>

            <Divider sx={{ margin: '12px 0' }} />
            <Typography fontWeight="bold" sx={{ paddingY: 0.5 }}>Params with delimiter</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, paddingBottom: 1 }}>
                Params whose values should be treated as multi-value (e.g. comma-separated tags).
            </Typography>
            <Box>
                {paramsWithDelimiter.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', paddingTop: '4px' }}>
                        <Typography variant="caption" sx={{ flex: 1, marginRight: '10px', opacity: 0.7 }}>Param key</Typography>
                        <Typography variant="caption" sx={{ width: 72, opacity: 0.7 }}>Delimiter</Typography>
                        <Box sx={{ width: 24, marginLeft: '10px' }} />
                    </Box>
                )}
                {paramsItems}
                <Button sx={{ marginTop: '8px' }} onClick={addNewMultiParam}
                    disabled={isLocked}
                    variant="text" startIcon={<AddIcon />}>Add</Button>
            </Box>
            <Divider sx={{ margin: '12px 0' }} />
            <Typography fontWeight="bold" sx={{ paddingY: 0.5 }}>Param history</Typography>
            <Box sx={{ paddingLeft: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {paramHistoryCount === 0 ? 'No entries yet' : `${paramHistoryCount} entries`}
                </Typography>
                <Button
                    color="warning"
                    sx={{ marginTop: '8px' }}
                    disabled={isLocked || paramHistoryCount === 0}
                    onClick={openClearHistoryDialog}
                    variant="text"
                >
                    Clear param history
                </Button>
                <Dialog
                    open={clearHistoryDialog}
                    onClose={closeClearHistoryDialog}
                    aria-labelledby="clear-history-dialog-title"
                    aria-describedby="clear-history-dialog-description"
                >
                    <DialogContent>
                        <DialogContentText id="clear-history-dialog-description">
                            {`Clear param history for "${label}"?`}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClearHistory}>Yes</Button>
                        <Button onClick={closeClearHistoryDialog} autoFocus>No</Button>
                    </DialogActions>
                </Dialog>
            </Box>
            <Divider sx={{ margin: '12px 0' }} />
            <div>
                <Button sx={{ marginTop: '10px' }} onClick={() => addPackageWithSameSettings()}
                    disabled={isLocked}
                    variant="text">Add package with same settings</Button>
            </div>
            {gistLinkActions && (
                <Box sx={{ marginTop: '12px' }}>
                    <Divider sx={{ margin: '12px 0' }} />
                    <Typography fontWeight="bold" sx={{ paddingY: 0.5 }}>Gist link</Typography>
                    {gistLinkActions}
                </Box>
            )}
            <div>
                <Button color="warning" sx={{ marginTop: '10px' }} onClick={openDeleteDialog}
                    disabled={isLocked}
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
                        <Button onClick={handleDelete}>Yes</Button>
                        <Button onClick={closeDeleteDialog} autoFocus>No</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    )
}

export default PackageSettingsEditor;
