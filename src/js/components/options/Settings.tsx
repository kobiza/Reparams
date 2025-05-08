import React, { KeyboardEventHandler, SyntheticEvent, useContext, useEffect, useRef, useState } from "react";
import { EditorStoreContext } from "./UseEditorStoreContext";
import { EditorStore, SearchParamsEntries, SettingsPackage } from "../../types/types";
import { uuidv4 } from "../../utils/utils";

import './Settings.scss'
import SearchParams from "../common/SearchParams";
import { removeItem, replaceItem, toTrueObj } from "../../utils/arrayUtils";
import Tags, { TagsProps } from "../common/MuiTags";
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import classNames from "classnames";
import { forEach } from "lodash";
import SettingsHeader from "./SettingsHeader";


export type SettingsPages = 'Packages' | 'Shortcuts'

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

type PresetsEditorProps = {
    packageIndex: number
    presets: SettingsPackage['presets']
    updatePackagePreset: EditorStore['updatePackagePreset']
}

const PresetsEditor = ({ packageIndex, presets, updatePackagePreset }: PresetsEditorProps) => {
    const presetsItems = Object.entries(presets).map(([presetKey, presetData]) => {
        const presetRename = (newName: string) => {
            const newPresets: SettingsPackage['presets'] = {
                ...presets,
                [presetKey]: {
                    ...presets[presetKey],
                    label: newName
                }
            }

            updatePackagePreset(packageIndex, newPresets)
        }

        const updatePresetEntries = (newSearchParamsEntries: SearchParamsEntries) => {
            const newPresets: SettingsPackage['presets'] = {
                ...presets,
                [presetKey]: {
                    ...presets[presetKey],
                    entries: newSearchParamsEntries
                }
            }

            updatePackagePreset(packageIndex, newPresets)
        }

        const removePreset = () => {
            const newPresets: SettingsPackage['presets'] = {
                ...presets
            }

            delete newPresets[presetKey]

            updatePackagePreset(packageIndex, newPresets)
        }

        return (
            <Paper key={presetKey} elevation={2} className="preset-item">
                <div className="preset-name-wrapper">
                    <TextField
                        label="Preset name"
                        size="small"
                        value={presetData.label} onChange={e => presetRename(e.target.value)}
                    />
                    <IconButton aria-label="delete" color="primary" size="small"
                        onClick={removePreset}>
                        <DeleteIcon fontSize="inherit" />
                    </IconButton>
                </div>
                <SearchParams entries={presetData.entries} setEntries={updatePresetEntries} paramsWithDelimiter={{}} />
            </Paper>
        )
    })

    const addNewPreset = () => {
        const newPresets: SettingsPackage['presets'] = {
            ...presets,
            [uuidv4()]: {
                entries: [],
                label: ''
            }
        }

        updatePackagePreset(packageIndex, newPresets)
    }

    return (
        <div>
            {presetsItems}
            <Button sx={{ marginTop: '10px' }} onClick={addNewPreset}
                variant="text">Add Preset</Button>
        </div>
    )
}
type ParamsEditorProps = {
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

type QuickActionsEditorProps = {
    packageIndex: number
    quickActions: SettingsPackage['quickActions']
    presets: SettingsPackage['presets']
    updatePackageQuickActions: EditorStore['updatePackageQuickActions']
}

const QuickActionsEditor = ({
    packageIndex,
    quickActions,
    updatePackageQuickActions,
    presets: allPresets
}: QuickActionsEditorProps) => {
    const quickActionsItems = quickActions.map(({ label, presets, shortcut, id }, index) => {
        const updateButtonLabel = (newParamLabel: string) => {
            const newQuickActions: SettingsPackage['quickActions'] = replaceItem(quickActions, {
                ...quickActions[index],
                label: newParamLabel
            }, index)

            updatePackageQuickActions(packageIndex, newQuickActions)
        }

        const addPresets = (presetsKeys: Array<string>) => {
            const newPresets = [...quickActions[index].presets, ...presetsKeys]
            const newQuickActions: SettingsPackage['quickActions'] = replaceItem(quickActions, {
                ...quickActions[index],
                presets: newPresets
            }, index)

            updatePackageQuickActions(packageIndex, newQuickActions)
        }

        const removePresets = (presets: Array<string>) => {
            const keysToRemoveMap = toTrueObj(presets, item => item)
            const newPresets = quickActions[index].presets.filter(presetKey => !keysToRemoveMap[presetKey])

            const newQuickActions: SettingsPackage['quickActions'] = replaceItem(quickActions, {
                ...quickActions[index],
                presets: newPresets
            }, index)

            updatePackageQuickActions(packageIndex, newQuickActions)
        }

        const onAdd: TagsProps['onAdd'] = (presets) => {
            addPresets(presets.map(v => v.value))
        }
        const onDelete: TagsProps['onDelete'] = (presets) => {
            removePresets(presets.map(v => v.value))
        }
        const selected: TagsProps['selected'] = presets.map(v => ({ label: v, value: v }))
        const suggestions: TagsProps['suggestions'] = Object.values(allPresets).map(({ label }) => ({
            label: label,
            value: label
        }))

        return (
            <Paper key={id} elevation={2} className="preset-item">
                <TextField
                    InputLabelProps={{
                        sx: {
                            zIndex: 'unset'
                        }
                    }}
                    label="Quick action label"
                    size="small"
                    value={label} onChange={e => updateButtonLabel(e.target.value)}
                />
                <Tags sx={{ width: 'auto' }} onAdd={onAdd} onDelete={onDelete} selected={selected}
                    suggestions={suggestions} placeholderText='New preset' />
            </Paper>
        )
    })

    const addNewQuickAction = () => {
        const newQuickActions: SettingsPackage['quickActions'] = [...quickActions, {
            id: uuidv4(),
            label: 'New action',
            shortcut: -1,
            presets: []
        }]

        updatePackageQuickActions(packageIndex, newQuickActions)
    }

    return (
        <div>
            {quickActionsItems}
            <Button sx={{ marginTop: '10px' }} onClick={addNewQuickAction}
                variant="text">Add Quick Action</Button>
        </div>
    )
}

type PackagePanelProps = {
    packageData: SettingsPackage,
    packageIndex: number,
    editorStore: EditorStore
}

const PackagePanel = ({ packageData, packageIndex, editorStore }: PackagePanelProps) => {
    const { key, label, presets, paramsWithDelimiter, quickActions, urlPatterns } = packageData
    const [value, setValue] = React.useState(0);
    const {
        addNewPackage,
        updatePackagePreset,
        updatePackageParamsWithDelimiter,
        updatePackageQuickActions,
        updatePackageLabel,
        updatePackageUrlPatterns,
        deletePackage
    } = editorStore

    const [accordionOpen, setAccordionOpen] = useState(false)
    const [accordionLock, setAccordionLock] = useState(false)

    const packageNameInputRef = useRef<HTMLInputElement>(null)

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const updateCurrentPackageLabel = (newLabel: string) => {
        updatePackageLabel(packageIndex, newLabel)
    }

    const [isRenameActive, setIsRenameActive] = useState(false)

    const startRenameMode = (e: SyntheticEvent) => {
        setAccordionLock(true)
        setIsRenameActive(true)
        e.stopPropagation()
    }

    const stopRenameMode = (e: SyntheticEvent) => {
        setIsRenameActive(false)
    }

    const handleRenameKey: KeyboardEventHandler = (e) => {
        if (e.key === 'Enter') {
            setIsRenameActive(false)
        }
    }

    useEffect(() => {
        if (isRenameActive) {
            packageNameInputRef.current!.focus()
        } else {
            // after exit rename mode
            setTimeout(() => setAccordionLock(false), 500)
        }
    }, [isRenameActive])

    const handleAccordionChange = (e: React.SyntheticEvent, expand: boolean) => {
        if (accordionLock) {
            return
        }
        if (expand) {
            setAccordionOpen(true)
        } else {
            setAccordionOpen(false)
        }
    }

    return (
        <Accordion key={key} expanded={accordionOpen} onChange={handleAccordionChange}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                sx={{
                    '&.Mui-focusVisible': {
                        backgroundColor: '#fff'
                    }
                }}
            >
                <div className="package-name-wrapper">
                    <div className={classNames("package-name-view", { 'hidden-x': isRenameActive })}>
                        <Typography sx={{ paddingLeft: '6px' }}>{label}</Typography>
                        <IconButton aria-label="delete" color="primary" size="small"
                            sx={{ padding: '0', marginLeft: '10px' }} onClick={startRenameMode}>
                            <EditIcon fontSize="inherit" />
                        </IconButton>
                    </div>
                    <div className={classNames("package-name-edit", { 'hidden-x': !isRenameActive })}>
                        <TextField inputRef={packageNameInputRef} type="text" value={label}
                            onKeyUp={handleRenameKey}
                            onChange={e => updateCurrentPackageLabel(e.target.value)}
                            onBlur={stopRenameMode} inputProps={{
                                sx: { padding: '0px', paddingLeft: '6px' },
                            }}
                        ></TextField>
                    </div>
                </div>

            </AccordionSummary>
            <AccordionDetails>
                {accordionOpen ? (
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                                <Tab label="Presets" {...a11yProps(0)} disableRipple={true} />
                                <Tab label="Quick Actions" {...a11yProps(1)} disableRipple={true} />
                                <Tab label="Settings" {...a11yProps(2)} disableRipple={true} />
                            </Tabs>
                        </Box>
                        <CustomTabPanel value={value} index={0}>
                            <PresetsEditor packageIndex={packageIndex} presets={presets}
                                updatePackagePreset={updatePackagePreset} />
                        </CustomTabPanel>

                        <CustomTabPanel value={value} index={1}>
                            <QuickActionsEditor packageIndex={packageIndex} quickActions={quickActions}
                                updatePackageQuickActions={updatePackageQuickActions} presets={presets} />
                        </CustomTabPanel>
                        <CustomTabPanel value={value} index={2}>
                            <PackageSettingsEditor packageIndex={packageIndex}
                                label={label}
                                paramsWithDelimiter={paramsWithDelimiter}
                                addNewPackage={addNewPackage}
                                updatePackageParamsWithDelimiter={updatePackageParamsWithDelimiter}
                                urlPatterns={urlPatterns}
                                updatePackageUrlPatterns={updatePackageUrlPatterns}
                                deletePackage={deletePackage} />
                        </CustomTabPanel>
                    </Box>
                ) : (
                    <div />
                )}
            </AccordionDetails>
        </Accordion>
    )
}

const PackagesPage = () => {
    const editorStore = useContext(EditorStoreContext)
    const {
        state: appState,
        addNewPackage,
        addPackages,
    } = editorStore
    const packagesList = appState.map((packageData, packageIndex) => {
        return (
            <PackagePanel key={packageData.key} packageData={packageData} packageIndex={packageIndex}
                editorStore={editorStore} />
        )
    })
    return (
        <div>
            {packagesList}
            <Button sx={{ marginTop: '10px' }} onClick={() => addNewPackage()}
                variant="text">Add Package</Button>
        </div>
    )
}

const Settings = () => {
    const editorStore = useContext(EditorStoreContext)
    const {
        state: packages,
    } = editorStore
    return (
        <div className="settings-pages">
            <SettingsHeader packages={packages} addPackages={editorStore.addPackages} />
            <PackagesPage />
        </div>
    )
}

export default Settings
