import React, { KeyboardEventHandler } from "react";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { Theme } from '@mui/material/styles';
import type { SxProps } from "@mui/system";
import { autocompleteListboxSx } from "./autocompleteListboxSx";

export type FreeSoloTagsProps = {
    values: Array<string>,
    onChange: (newValues: Array<string>) => void,
    placeholderText: string,
    onKeyUp?: KeyboardEventHandler,
    limitTags?: number,
    className?: string,
    sx?: SxProps<Theme>,
    options?: Array<string>,
    autoFocus?: boolean,
}

const FreeSoloTags = ({ values, onChange, sx, className, placeholderText, limitTags, onKeyUp, options = [], autoFocus = true }: FreeSoloTagsProps) => {
    const onChangeHandler = (e: any, newValues: any) => {
        onChange(newValues as Array<string>)
    }
    return (
        <Autocomplete
            sx={sx}
            className={className}
            multiple
            size="small"
            limitTags={limitTags}
            disableCloseOnSelect
            filterSelectedOptions
            autoSelect
            id="multiple-limit-tags"
            options={options}
            freeSolo={true}
            value={values}
            onChange={onChangeHandler}
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            ListboxProps={{ sx: autocompleteListboxSx }}

            renderInput={(params) => (
                <TextField hiddenLabel={true} {...params} size="small" placeholder={placeholderText} autoFocus={autoFocus} onKeyUp={onKeyUp} />
            )}
        />
    )
}

export default FreeSoloTags
