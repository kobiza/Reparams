import React, { useEffect, useRef, useState, KeyboardEventHandler, SyntheticEvent } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import classNames from 'classnames';
import { EditorStore, SettingsPackage } from '../../types/types';
import { CustomTabPanel, a11yProps } from './CustomTabPanel';
import PresetsEditor from './PresetsEditor';
import PackageSettingsEditor from './PackageSettingsEditor';
import PackageGistLinkActions from './PackageGistLinkActions';
import { isPackageLocked } from '../../utils/utils';

type PackagePanelProps = {
    packageData: SettingsPackage,
    packageKey: string,
    editorStore: EditorStore
}

const PackagePanel = ({ packageData, packageKey, editorStore }: PackagePanelProps) => {
    const { key, label, presets, paramsWithDelimiter, conditions, paramHistory } = packageData
    const isLocked = isPackageLocked(packageData)
    const [value, setValue] = useState(0);
    const {
        addNewPackage,
        addPackages,
        updatePackagePreset,
        updatePackageParamsWithDelimiter,
        updatePackageLabel,
        updatePackageUrlPatterns,
        updatePackageDomSelectors,
        deletePackage,
        clearPackageParamHistory,
        unlinkPackage
    } = editorStore

    const [accordionOpen, setAccordionOpen] = useState(false)
    const [accordionLock, setAccordionLock] = useState(false)

    const packageNameInputRef = useRef<HTMLInputElement>(null)

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const updateCurrentPackageLabel = (newLabel: string) => {
        updatePackageLabel(packageKey, newLabel)
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
            >
                <div className="package-name-wrapper">
                    <div className={classNames("package-name-view", { 'hidden-x': isRenameActive })}>
                        <Typography sx={{ paddingLeft: '6px' }}>{label}</Typography>
                        {isLocked && (
                            <Tooltip title="Linked to a GitHub Gist — read-only. Use Sync or Unlink to manage.">
                                <LockIcon aria-label="locked" color="primary" fontSize="small"
                                    sx={{ marginLeft: '8px' }} />
                            </Tooltip>
                        )}
                        {!isLocked && (
                            <IconButton aria-label="rename" color="primary" size="small"
                                sx={{ padding: '0', marginLeft: '10px' }} onClick={startRenameMode}>
                                <EditIcon fontSize="inherit" />
                            </IconButton>
                        )}
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
                                <Tab label="Settings" {...a11yProps(1)} disableRipple={true} />
                            </Tabs>
                        </Box>
                        <CustomTabPanel value={value} index={0}>
                            <PresetsEditor packageKey={packageKey} presets={presets}
                                isLocked={isLocked}
                                updatePackagePreset={updatePackagePreset} />
                        </CustomTabPanel>
                        <CustomTabPanel value={value} index={1}>
                            <PackageSettingsEditor packageKey={packageKey}
                                label={label}
                                isLocked={isLocked}
                                paramsWithDelimiter={paramsWithDelimiter}
                                paramHistoryCount={paramHistory?.length ?? 0}
                                addNewPackage={addNewPackage}
                                updatePackageParamsWithDelimiter={updatePackageParamsWithDelimiter}
                                urlPatterns={conditions.urlPatterns}
                                domSelectors={conditions.domSelectors}
                                updatePackageDomSelectors={updatePackageDomSelectors}
                                updatePackageUrlPatterns={updatePackageUrlPatterns}
                                deletePackage={deletePackage}
                                clearPackageParamHistory={clearPackageParamHistory}
                                gistLinkActions={isLocked ? (
                                    <PackageGistLinkActions
                                        packageData={packageData}
                                        addPackages={addPackages}
                                        unlinkPackage={unlinkPackage}
                                    />
                                ) : undefined}
                            />
                        </CustomTabPanel>
                    </Box>
                ) :
                    <div />
                }
            </AccordionDetails>
        </Accordion>
    )
}

export default PackagePanel;
