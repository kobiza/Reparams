import React, { useEffect, useRef } from "react";
import { ParamsWithDelimiterViewModel, ParamSuggestions, SearchParamsEntries, SetEntries } from "../../types/types";
import { parseQuickPaste, updateEntryKey, updateEntryValue } from "../../utils/searchParamsUtils";
import './SearchParams.scss'
import Autocomplete from '@mui/material/Autocomplete';
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
import { autocompleteListboxSx } from "./autocompleteListboxSx";

type SearchParamsProps = {
    entries: SearchParamsEntries
    setEntries: SetEntries
    paramsWithDelimiter: ParamsWithDelimiterViewModel
    className?: string,
    suggestions?: ParamSuggestions
}

const SearchParams = ({ entries, setEntries, paramsWithDelimiter, className, suggestions }: SearchParamsProps) => {
    const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
    const indexToFocusAfterDelete = useRef<number | null>(null)

    const renderedRows: SearchParamsEntries = [...entries, ['', '']]

    useEffect(() => {
        itemsRef.current = itemsRef.current.slice(0, renderedRows.length);
    }, [renderedRows.length]);

    const prevEntriesLength = usePrevious<number>(entries.length)

    useEffect(() => {
        if (indexToFocusAfterDelete.current !== null) {
            const target = indexToFocusAfterDelete.current
            itemsRef.current[target]?.focus()
            indexToFocusAfterDelete.current = null
        }
    }, [entries.length, prevEntriesLength])

    const items = renderedRows.map(([key, value], index) => {
        const isTrailing = index === entries.length

        const updateCurrentEntryValue = (newValue: string) => {
            if (isTrailing) {
                setEntries([...entries, ['', newValue]])
                return
            }
            setEntries(updateEntryValue(entries, newValue, index))
        }

        const updateCurrentEntryKey = (newKey: string) => {
            if (isTrailing) {
                setEntries([...entries, [newKey, '']])
                return
            }
            setEntries(updateEntryKey(entries, newKey, index))
        }

        const removeSearchParam = () => {
            const newLength = entries.length - 1
            if (newLength === 0) {
                indexToFocusAfterDelete.current = 0
            } else if (index >= newLength) {
                indexToFocusAfterDelete.current = newLength - 1
            } else {
                indexToFocusAfterDelete.current = index
            }
            setEntries(removeItem(entries, index))
        }

        const handleRowKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
            if (isTrailing) return
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

        const keyPlaceholder = isTrailing ? 'Add param' : 'Key'

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
                ListboxProps={{ sx: autocompleteListboxSx }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        hiddenLabel
                        placeholder={keyPlaceholder}
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
                placeholder={keyPlaceholder}
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
                ListboxProps={{ sx: autocompleteListboxSx }}
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
                <span className="query-param-input-delete-slot">
                    {!isTrailing && (
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
                                sx={{ padding: '0' }} onClick={removeSearchParam}>
                                <ClearIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                    )}
                </span>
            </li>
        )
    })

    return (
        <div className={classNames(className)}>
            <ul>
                {items}
            </ul>
        </div>
    )
}

export default SearchParams
