import React from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import { uuidv4 } from '../../utils/utils';
import { SettingsPackage, EditorStore, SearchParamsEntries } from '../../types/types';
import SearchParams from '../common/SearchParams';

interface PresetsEditorProps {
    packageKey: string
    presets: SettingsPackage['presets']
    updatePackagePreset: (packageKey: string, presets: SettingsPackage['presets']) => void
}

const PresetsEditor = ({ packageKey, presets, updatePackagePreset }: PresetsEditorProps) => {
    const presetsItems = Object.entries(presets).map(([presetKey, presetData]) => {
        const presetRename = (newName: string) => {
            const newPresets: SettingsPackage['presets'] = {
                ...presets,
                [presetKey]: {
                    ...presets[presetKey],
                    label: newName
                }
            }
            updatePackagePreset(packageKey, newPresets)
        }

        const updatePresetEntries = (newSearchParamsEntries: SearchParamsEntries) => {
            const newPresets: SettingsPackage['presets'] = {
                ...presets,
                [presetKey]: {
                    ...presets[presetKey],
                    entries: newSearchParamsEntries
                }
            }
            updatePackagePreset(packageKey, newPresets)
        }

        const removePreset = () => {
            const newPresets: SettingsPackage['presets'] = {
                ...presets
            }
            delete newPresets[presetKey]
            updatePackagePreset(packageKey, newPresets)
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
        updatePackagePreset(packageKey, newPresets)
    }

    return (
        <div>
            {presetsItems}
            <Button sx={{ marginTop: '10px' }} onClick={addNewPreset}
                variant="text">Add Preset</Button>
        </div>
    )
}

export default PresetsEditor;
