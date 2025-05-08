import React from 'react';
import { Button, IconButton, Paper, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { uuidv4 } from '../../utils/utils';
import { SettingsPackage, EditorStore, SearchParamsEntries } from '../../types/types';
import SearchParams from '../common/SearchParams';

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

export default PresetsEditor;
