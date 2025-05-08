import React from 'react';
import { Button, Paper, TextField } from '@mui/material';
import { uuidv4 } from '../../utils/utils';
import { SettingsPackage, EditorStore } from '../../types/types';
import { replaceItem, toTrueObj } from '../../utils/arrayUtils';
import Tags, { TagsProps } from '../common/MuiTags';

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

export default QuickActionsEditor;
