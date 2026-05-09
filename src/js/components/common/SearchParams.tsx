import React, { useEffect, useRef } from "react";
import { ParamsWithDelimiterViewModel, ParamSuggestions, SearchParamsEntries, SetEntries } from "../../types/types";
import { parseQuickPaste, updateEntryKey, updateEntryValue } from "../../utils/searchParamsUtils";
import './SearchParams.scss'
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import ClearIcon from '@mui/icons-material/Clear';
import { removeItem } from "../../utils/arrayUtils";
import { decodeIfEncoded } from "../../utils/encodingUtils";
import usePrevious from "./usePrevious";
import ParamWithDelimiterValueInput from "./ParamWithDelimiterValueInput";
import ShortcutHint from "./ShortcutHint";
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
    const indexToFocusAfterDelete = useRef<number | null>(null)
    const addParamButtonRef = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        itemsRef.current = itemsRef.current.slice(0, entries.length);
    }, [entries]);

    const prevEntriesLength = usePrevious<number>(entries.length)

    useEffect(() => {
        if (shouldFocusNewParam.current && prevEntriesLength === entries.length - 1) {
            itemsRef.current[entries.length - 1]!.focus()

            shouldFocusNewParam.current = false
        }
        if (indexToFocusAfterDelete.current !== null) {
            const target = indexToFocusAfterDelete.current
            if (target >= 0 && target < entries.length) {
                itemsRef.current[target]!.focus()
            } else {
                addParamButtonRef.current?.focus()
            }
            indexToFocusAfterDelete.current = null
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
            const newLength = entries.length - 1
            if (newLength === 0) {
                indexToFocusAfterDelete.current = -1
            } else if (index >= newLength) {
                indexToFocusAfterDelete.current = newLength - 1
            } else {
                indexToFocusAfterDelete.current = index
            }
            setEntries(removeItem(entries, index))
        }

        const handleRowKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
                e.preventDefault()
                e.stopPropagation()
                removeSearchParam()
            }
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
                autoSelect
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
                autoSelect
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
            <li className="query-param-input" key={index} onKeyDown={handleRowKeyDown}>
                {keyInput}
                {valueInput}
                <Tooltip
                    title={
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            Remove param <ShortcutHint keys={['Mod', 'Backspace']} />
                        </span>
                    }
                    placement="top"
                    componentsProps={{ tooltip: { sx: { fontSize: '0.85rem', p: 1 } } }}
                >
                    <IconButton aria-label="delete" color="primary" size="small"
                        sx={{ padding: '0', marginLeft: '10px' }} onClick={removeSearchParam}>
                        <ClearIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
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
            <Button ref={addParamButtonRef} color="secondary" sx={{ marginTop: '14px', marginBottom: '10px' }} onClick={addNewEntry} variant="text">Add param</Button>
        </div>
    )
}

export default SearchParams
