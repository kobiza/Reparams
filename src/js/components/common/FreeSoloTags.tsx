import React, { KeyboardEventHandler } from "react";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { Theme } from '@mui/material/styles';
import type { SxProps } from "@mui/system";

export type FreeSoloTagsProps = {
    values: Array<string>,
    onChange: (newValues: Array<string>) => void,
    placeholderText: string,
    onKeyUp?: KeyboardEventHandler,
    limitTags?: number,
    className?: string,
    sx?: SxProps<Theme>
}

const FreeSoloTags = ({ values, onChange, sx, className, placeholderText, limitTags, onKeyUp }: FreeSoloTagsProps) => {
    const onChangeHandler = (e: any, newValues: any) => {
        onChange(newValues as Array<string>)
    }
    return (
        <Autocomplete
            sx={sx}
            className={className}
            multiple
            limitTags={limitTags}
            disableCloseOnSelect
            id="multiple-limit-tags"
            options={[]}
            freeSolo={true}
            value={values}
            onChange={onChangeHandler}
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            ListboxProps={{ sx: { maxHeight: '340px' } }}

            renderInput={(params) => (
                <TextField hiddenLabel={true} {...params} placeholder={placeholderText} autoFocus={true} onKeyUp={onKeyUp} />
            )}
        />
    )
}

export default FreeSoloTags
