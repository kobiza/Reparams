import React from "react";
import { Theme } from "@mui/material";
import { SxProps } from "@mui/system";
import FreeSoloTags from "./FreeSoloTags";
import { decodeIfEncoded } from "../../utils/encodingUtils";

export type ParamWithDelimiterValueInputProps = {
    value: string,
    delimiter: string,
    onChange: (newValue: string) => void,
    className?: string,
    limitTags?: number,
    sx?: SxProps<Theme>,
    suggestions?: Array<string>,
    autoFocus?: boolean,
    disabled?: boolean,
}

const ParamWithDelimiterValueInput = ({ value, delimiter, onChange, sx, className, limitTags, suggestions, autoFocus, disabled }: ParamWithDelimiterValueInputProps) => {
    const values = value ? value.split(delimiter) : []
    const onChangeHandler = (newValues: Array<string>) => {
        onChange(newValues.map(v => decodeIfEncoded(v.trim())).join(delimiter))
    }

    return (
        <FreeSoloTags
            values={values}
            onChange={onChangeHandler}
            limitTags={limitTags}
            sx={sx}
            className={className}
            placeholderText="Add value"
            options={suggestions}
            autoFocus={autoFocus}
            disabled={disabled}
        />
    )
}

export default ParamWithDelimiterValueInput
