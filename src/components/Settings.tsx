import React, {KeyboardEventHandler, SyntheticEvent, useContext, useEffect, useRef, useState} from "react";
import {EditorStoreContext} from "./UseEditorStoreContext";
import {EditorStore, SearchParamsEntries, SettingsPackage} from "../types/types";
import {uuidv4} from "../utils/utils";

import './Settings.scss'
import SearchParams from "./SearchParams";
import {removeItem, replaceItem, toTrueObj} from "../utils/arrayUtils";
import Tags, {TagsProps} from "./MuiTags";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box, Button,
    IconButton, Paper,
    Tab,
    Tabs,
    TextField, Typography,
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {Delete, Edit} from "@mui/icons-material";
import classNames from "classnames";
import {forEach} from "lodash";
import SettingsHeader from "./SettingsHeader";


export type SettingsPages = 'Packages' | 'Shortcuts'

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{p: 3}}>
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

const PresetsEditor = ({packageIndex, presets, updatePackagePreset}: PresetsEditorProps) => {
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
                        <Delete fontSize="inherit"/>
                    </IconButton>
                </div>
                <SearchParams entries={presetData.entries} setEntries={updatePresetEntries}/>
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
            <Button color="secondary" sx={{color: '#fff', marginTop: '10px'}} onClick={addNewPreset}
                    variant="contained">Add new Preset</Button>
        </div>
    )
}
type ParamsEditorProps = {
    packageIndex: number
    paramsWithMultipleValues: SettingsPackage['paramsWithMultipleValues']
    updatePackageParamsWithMultipleValues: EditorStore['updatePackageParamsWithMultipleValues']
}

const ParamsEditor = ({
                          packageIndex,
                          paramsWithMultipleValues,
                          updatePackageParamsWithMultipleValues
                      }: ParamsEditorProps) => {
    const paramsItems = Object.keys(paramsWithMultipleValues).map(id => {
        const {label, separator} = paramsWithMultipleValues[id]

        const updateParamLabel = (newParamLabel: string) => {
            const newPresets: SettingsPackage['paramsWithMultipleValues'] = {
                ...paramsWithMultipleValues,
                [id]: {
                    ...paramsWithMultipleValues[id],
                    label: newParamLabel
                }
            }

            updatePackageParamsWithMultipleValues(packageIndex, newPresets)
        }

        const updateParamSeparator = (newParamSeparator: string) => {
            const newPresets: SettingsPackage['paramsWithMultipleValues'] = {
                ...paramsWithMultipleValues,
                [id]: {
                    ...paramsWithMultipleValues[id],
                    separator: newParamSeparator
                }
            }

            updatePackageParamsWithMultipleValues(packageIndex, newPresets)
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
                    placeholder="Separator"
                    size="small"
                    value={separator} onChange={e => updateParamSeparator(e.target.value)}
                />
            </div>
        )
    })

    const addNewMultiParam = () => {
        const newParamsWithMultipleValues: SettingsPackage['paramsWithMultipleValues'] = {
            ...paramsWithMultipleValues,
            [uuidv4()]: {
                label: '',
                separator: ''
            }
        }

        updatePackageParamsWithMultipleValues(packageIndex, newParamsWithMultipleValues)
    }
    return (
        <div>
            <Typography variant="h6" padding={1}>Params with multiple values</Typography>
            {paramsItems}
            <Button color="secondary" sx={{color: '#fff', marginTop: '10px'}} onClick={addNewMultiParam}
                    variant="contained">Add</Button>
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
    const quickActionsItems = quickActions.map(({label, presets, shortcut, id}, index) => {
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
        const selected: TagsProps['selected'] = presets.map(v => ({label: v, value: v}))
        const suggestions: TagsProps['suggestions'] = Object.values(allPresets).map(({label}) => ({
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
                <Tags sx={{width: 'auto'}} onAdd={onAdd} onDelete={onDelete} selected={selected}
                      suggestions={suggestions} placeholderText='New preset'/>
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
            <Button color="secondary" sx={{color: '#fff', marginTop: '10px'}} onClick={addNewQuickAction}
                    variant="contained">Add</Button>
        </div>
    )
}

type PackagePanelProps = {
    packageData: SettingsPackage,
    packageIndex: number,
    editorStore: EditorStore
}

const PackagePanel = ({packageData, packageIndex, editorStore}: PackagePanelProps) => {
    const {key, label, presets, paramsWithMultipleValues, quickActions} = packageData
    const [value, setValue] = React.useState(0);
    const {
        updatePackagePreset,
        updatePackageParamsWithMultipleValues,
        updatePackageQuickActions,
        updatePackageLabel
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
                expandIcon={<ExpandMoreIcon/>}
                aria-controls="panel1a-content"
                id="panel1a-header"
                sx={{
                    '&.Mui-focusVisible': {
                        backgroundColor: '#fff'
                    }
                }}
            >
                <div className="package-name-wrapper">
                    <div className={classNames("package-name-view", {'hidden-x': isRenameActive})}>
                        <Typography sx={{paddingLeft: '6px'}}>{label}</Typography>
                        <IconButton aria-label="delete" color="primary" size="small"
                                    sx={{padding: '0', marginLeft: '10px'}} onClick={startRenameMode}>
                            <Edit fontSize="inherit"/>
                        </IconButton>
                    </div>
                    <div className={classNames("package-name-edit", {'hidden-x': !isRenameActive})}>
                        <TextField inputRef={packageNameInputRef} type="text" value={label}
                                   onKeyUp={handleRenameKey}
                                   onChange={e => updateCurrentPackageLabel(e.target.value)}
                                   onBlur={stopRenameMode} inputProps={{sx: {padding: '0px', paddingLeft: '6px'},
                        }}
                        ></TextField>
                    </div>
                </div>

            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{width: '100%'}}>
                    <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                            <Tab label="Presets" {...a11yProps(0)} disableRipple={true}/>
                            <Tab label="Params" {...a11yProps(1)} disableRipple={true}/>
                            <Tab label="Quick Actions" {...a11yProps(2)} disableRipple={true}/>
                        </Tabs>
                    </Box>
                    <CustomTabPanel value={value} index={0}>
                        <PresetsEditor packageIndex={packageIndex} presets={presets}
                                       updatePackagePreset={updatePackagePreset}/>
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={1}>
                        <ParamsEditor packageIndex={packageIndex} paramsWithMultipleValues={paramsWithMultipleValues}
                                      updatePackageParamsWithMultipleValues={updatePackageParamsWithMultipleValues}/>
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={2}>
                        <QuickActionsEditor packageIndex={packageIndex} quickActions={quickActions}
                                            updatePackageQuickActions={updatePackageQuickActions} presets={presets}/>
                    </CustomTabPanel>
                </Box>
            </AccordionDetails>
        </Accordion>
    )
}

const PackagesPage = () => {
    const editorStore = useContext(EditorStoreContext)
    const {
        state: appState,
        addNewPackage,
    } = editorStore
    const packagesList = appState.map((packageData, packageIndex) => {
        return (
            <PackagePanel key={packageData.key} packageData={packageData} packageIndex={packageIndex}
                          editorStore={editorStore}/>
        )
    })
    return (
        <div>
            {packagesList}
            <Button color="secondary" sx={{color: '#fff', marginTop: '10px'}} onClick={addNewPackage}
                    variant="contained">Add new Package</Button>
        </div>
    )
}

const ShortcutsPage = () => {
    return (
        <div></div>
    )
}

const Settings = () => {
    const [currentPage, setCurrentPage] = useState<SettingsPages>('Packages')
    return (
        <div className="settings-pages">
            <SettingsHeader currentPage={currentPage} setCurrentPage={(page) => setCurrentPage(page)}></SettingsHeader>
            {currentPage === 'Packages' ? <PackagesPage/> : <ShortcutsPage/>}
        </div>
    )
}

export default Settings