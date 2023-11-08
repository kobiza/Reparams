import React from 'react'

import './Tags.scss'
import {Autocomplete, Checkbox, Chip, TextField, Theme} from "@mui/material";
import {toTrueObj} from "../utils/arrayUtils";

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import {SxProps} from "@mui/system";

export type TagsItem = { value: string; label: string; }

export type TagsProps = {
    onAdd: (itemsToAdd: Array<TagsItem>) => void
    onDelete: (itemsToDelete: Array<TagsItem>) => void
    selected: Array<TagsItem>,
    suggestions: Array<TagsItem>,
    placeholderText: string,
    className?: string,
    sx?: SxProps<Theme>
}

const Tags = ({selected, suggestions, placeholderText, className, onAdd, onDelete, sx}: TagsProps) => {
    const onChange = (e: any, newSelected: Array<{ value: string; label: string; }>) => {
        console.log('onChange', newSelected)
        const prevTrueObj = toTrueObj(selected, (v) => v.value)
        const nextTrueObj = toTrueObj(newSelected, (v) => v.value)

        const added = Object.keys(nextTrueObj).filter(v => !prevTrueObj[v])
        const removed = Object.keys(prevTrueObj).filter(v => !nextTrueObj[v])

        if (removed.length) {
            onDelete(removed.map(v => ({value: v, label: v})))
        }

        if (added.length) {
            onAdd(added.map(v => ({value: v, label: v})))
        }
    }

    const icon = <CheckBoxOutlineBlankIcon fontSize="small"/>;
    const checkedIcon = <CheckBoxIcon fontSize="small"/>;
    return (
        <Autocomplete
            sx={sx}
            className={className}
            multiple
            disableCloseOnSelect
            id="multiple-limit-tags"
            options={suggestions}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            value={selected}
            onChange={onChange}
            // renderTags={(tagValue, getTagProps) => {
            //     return tagValue.map((option, index) => (
            //         <Chip {...getTagProps({ index })} label={option.value} color="secondary"/>
            //     ));
            // }}
            renderOption={(props, option, {selected}) => {
                return (
                    <li {...props}>
                        <Checkbox
                            icon={icon}
                            checkedIcon={checkedIcon}
                            style={{marginRight: 8}}
                            checked={selected}
                        />
                        {option.label}
                    </li>
                )
            }}
            renderInput={(params) => (
                <TextField hiddenLabel={true} {...params} placeholder={placeholderText}/>
            )}
        />
    )
}

export default Tags