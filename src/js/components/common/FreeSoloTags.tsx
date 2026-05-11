import React, { KeyboardEventHandler, useRef, useState } from "react";
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
    const highlightedRef = useRef<string | null>(null)
    const [inputValue, setInputValue] = useState('')

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
            id="multiple-limit-tags"
            options={options}
            freeSolo={true}
            value={values}
            inputValue={inputValue}
            onInputChange={(_e, v) => setInputValue(v)}
            onChange={onChangeHandler}
            onHighlightChange={(_e, option) => { highlightedRef.current = option }}
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            ListboxProps={{ sx: autocompleteListboxSx }}

            renderInput={(params) => {
                const muiKeyDown = (params.inputProps as any).onKeyDown
                return (
                    <TextField
                        hiddenLabel={true}
                        {...params}
                        size="small"
                        placeholder={placeholderText}
                        autoFocus={autoFocus}
                        onKeyUp={onKeyUp}
                        inputProps={{
                            ...params.inputProps,
                            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Tab') {
                                    const highlighted = highlightedRef.current
                                    const typed = inputValue.trim()
                                    if (highlighted && !values.includes(highlighted)) {
                                        onChange([...values, highlighted])
                                        setInputValue('')
                                    } else if (typed && !values.includes(typed)) {
                                        onChange([...values, typed])
                                        setInputValue('')
                                    }
                                }
                                muiKeyDown?.(e)
                            },
                        }}
                    />
                )
            }}
        />
    )
}

export default FreeSoloTags
