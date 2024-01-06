
import React, {KeyboardEventHandler} from "react";
import {Autocomplete, TextField, Theme} from "@mui/material";
import {SxProps} from "@mui/system";
import FreeSoloTags from "./FreeSoloTags";

export type ParamWithDelimiterValueInputProps = {
    value: string,
    delimiter: string
    onChange: (newValue: string) => void,
    onTextInputKeyUp: KeyboardEventHandler
    className?: string,
    limitTags?: number,
    sx?: SxProps<Theme>
}

const ParamWithDelimiterValueInput = ({value, delimiter, onChange, sx, className, limitTags, onTextInputKeyUp}: ParamWithDelimiterValueInputProps) => {
    const values = value ? value.split(delimiter) : []
    const onChangeHandler = (newValues: Array<string>) => {
        onChange(newValues.map(v => v.trim()).join(delimiter))
    }

    return (
        <FreeSoloTags
            values={values}
            onChange={onChangeHandler}
            limitTags={limitTags}
            sx={sx}
            onKeyUp={onTextInputKeyUp}
            className={className}
            placeholderText="Add value"
        />
    )
}

export default ParamWithDelimiterValueInput