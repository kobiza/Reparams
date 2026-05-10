import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
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

        const hasEntries = presetData.entries.length > 0

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
                <Box>
                    {hasEntries && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Typography variant="caption" sx={{ flex: 1, opacity: 0.7 }}>Param key</Typography>
                            <Typography variant="caption" sx={{ flex: 2, opacity: 0.7 }}>Value</Typography>
                            <Box sx={{ flex: '0 0 28px' }} />
                        </Box>
                    )}
                    <SearchParams entries={presetData.entries} setEntries={updatePresetEntries} paramsWithDelimiter={{}} />
                </Box>
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
            <Typography variant="body2" sx={{ opacity: 0.7, paddingBottom: 1 }}>
                A preset is a named bundle of URL params. Apply it from the popup to set all params in one click. Type into the empty row at the bottom of a preset to add a new param.
            </Typography>
            {presetsItems}
            <Button sx={{ marginTop: '10px' }} onClick={addNewPreset}
                variant="text">Add Preset</Button>
        </div>
    )
}

export default PresetsEditor;
