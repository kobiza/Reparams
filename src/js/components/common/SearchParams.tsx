import React, { useEffect, useRef } from "react";
import { ParamsWithDelimiterViewModel, ParamSuggestions, SearchParamsEntries, SetEntries } from "../../types/types";
import { parseQuickPaste, updateEntryKey, updateEntryValue } from "../../utils/searchParamsUtils";
import './SearchParams.scss'
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import ClearIcon from '@mui/icons-material/Clear';
import { removeItem } from "../../utils/arrayUtils";
import { decodeIfEncoded } from "../../utils/encodingUtils";
import usePrevious from "./usePrevious";
import ParamWithDelimiterValueInput from "./ParamWithDelimiterValueInput";
import classNames from "classnames";

type SearchParamsProps = {
    entries: SearchParamsEntries
    setEntries: SetEntries
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    className?: string,
    suggestions?: ParamSuggestions
}

const SearchParams = ({ entries, setEntries, paramsWithDelimiter, className, suggestions }: SearchParamsProps) => {
    const shouldFocusNewParam = useRef<boolean>(false)
    const itemsRef = useRef<Array<HTMLDivElement | null>>([]);

    useEffect(() => {
        itemsRef.current = itemsRef.current.slice(0, entries.length);
    }, [entries]);

    const prevEntriesLength = usePrevious<number>(entries.length)

    useEffect(() => {
        if (shouldFocusNewParam.current && prevEntriesLength === entries.length - 1) {
            itemsRef.current[entries.length - 1]!.focus()

            shouldFocusNewParam.current = false
        }
    }, [entries.length, prevEntriesLength, shouldFocusNewParam.current])

    const items = entries.map(([key, value], index) => {
        const updateCurrentEntryValue = (newValue: string) => {
            const newEntries = updateEntryValue(entries, newValue, index)

            setEntries(newEntries)
        }

        const updateCurrentEntryKey = (newKey: string) => {
            const newEntries = updateEntryKey(entries, newKey, index)

            setEntries(newEntries)
        }

        const removeSearchParam = () => {
            const newEntries = removeItem(entries, index)

            setEntries(newEntries)
        }

        const isParamsWithDelimiter = !!paramsWithDelimiter[key]

        const handleKeyPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
            const pasted = e.clipboardData.getData('text')
            if (key === '' && value === '') {
                const parsed = parseQuickPaste(pasted)
                if (parsed) {
                    e.preventDefault()
                    const newEntries = [
                        ...entries.slice(0, index),
                        ...parsed,
                        ...entries.slice(index + 1),
                    ] as SearchParamsEntries
                    setEntries(newEntries)
                    return
                }
            }
            const decoded = decodeIfEncoded(pasted)
            if (decoded !== pasted) {
                e.preventDefault()
                document.execCommand('insertText', false, decoded)
            }
        }

        const handleValuePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
            const pasted = e.clipboardData.getData('text')
            const decoded = decodeIfEncoded(pasted)
            if (decoded !== pasted) {
                e.preventDefault()
                document.execCommand('insertText', false, decoded)
            }
        }

        const keyInput = suggestions ? (
            <Autocomplete
                className="query-param-input-key"
                freeSolo
                options={suggestions.keys}
                value={key}
                inputValue={key}
                onInputChange={(_e, newInputValue) => updateCurrentEntryKey(newInputValue)}
                onChange={(_e, newValue) => updateCurrentEntryKey(newValue ?? '')}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        hiddenLabel
                        placeholder="Key"
                        size="small"
                        inputRef={el => itemsRef.current[index] = el}
                        inputProps={{
                            ...params.inputProps,
                            onPaste: handleKeyPaste,
                        }}
                    />
                )}
            />
        ) : (
            <TextField
                className="query-param-input-key"
                hiddenLabel
                placeholder="Key"
                size="small"
                value={key}
                onChange={e => updateCurrentEntryKey(e.target.value)}
                inputRef={el => itemsRef.current[index] = el}
                inputProps={{
                    onPaste: handleKeyPaste,
                }}
            />
        )

        const valueOptions = suggestions ? (suggestions.valuesByKey[key] ?? []) : []

        const valueInput = suggestions && isParamsWithDelimiter ? (
            <ParamWithDelimiterValueInput
                className="query-param-input-value"
                value={value}
                delimiter={paramsWithDelimiter[key].separator}
                onChange={updateCurrentEntryValue}
                suggestions={valueOptions}
                autoFocus={false}
            />
        ) : suggestions ? (
            <Autocomplete
                className="query-param-input-value"
                freeSolo
                options={valueOptions}
                value={value}
                inputValue={value}
                onInputChange={(_e, newInputValue) => updateCurrentEntryValue(newInputValue)}
                onChange={(_e, newValue) => updateCurrentEntryValue(newValue ?? '')}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        hiddenLabel
                        placeholder="Value"
                        size="small"
                        inputProps={{
                            ...params.inputProps,
                            onPaste: handleValuePaste,
                        }}
                    />
                )}
            />
        ) : (
            <TextField
                className="query-param-input-value"
                hiddenLabel
                placeholder="Value"
                size="small"
                value={value}
                onChange={e => updateCurrentEntryValue(e.target.value)}
                inputProps={{
                    onPaste: handleValuePaste,
                }}
            />
        )

        return (
            <li className="query-param-input" key={index}>
                {keyInput}
                {valueInput}
                <IconButton aria-label="delete" color="primary" size="small"
                    sx={{ padding: '0', marginLeft: '10px' }} onClick={removeSearchParam}>
                    <ClearIcon fontSize="inherit" />
                </IconButton>
            </li>
        )
    })

    const addNewEntry = () => {
        shouldFocusNewParam.current = true
        setEntries([...entries, ['', '']])
    }

    return (
        <div className={classNames(className)}>
            <ul>
                {items}
            </ul>
            <Button color="secondary" sx={{ marginTop: '14px', marginBottom: '10px' }} onClick={addNewEntry} variant="text">Add param</Button>
        </div>
    )
}

export default SearchParams
