import React, {KeyboardEventHandler, useEffect, useRef, useState} from "react";
import {ParamsWithDelimiterViewModel, SearchParamsEntries, SetEntries} from "../../types/types";
import {updateEntryKey, updateEntryValue} from "../../utils/searchParamsUtils";
import './SearchParams.scss'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    TextField
} from "@mui/material";
import {Clear, ZoomIn} from "@mui/icons-material";
import {removeItem} from "../../utils/arrayUtils";
import usePrevious from "./usePrevious";
import FreeSoloTags from "./FreeSoloTags";
import ParamWithDelimiterValueInput from "./ParamWithDelimiterValueInput";

type SearchParamsProps = {
    entries: SearchParamsEntries
    setEntries: SetEntries
    paramsWithDelimiter: ParamsWithDelimiterViewModel
}

const ZoomInDialog = ({entries, setEntries, paramsWithDelimiter, itemInZoomDialog, closeDialog}: SearchParamsProps & {itemInZoomDialog: number, closeDialog: () => void}) => {
    const [zoomInKey, zoomInValue] = entries[itemInZoomDialog]
    const lastKey = useRef('')

    const handleRenameKey: KeyboardEventHandler = (e) => {
        if (e.key === 'Enter' && lastKey.current === 'Enter') {
            closeDialog()
        }
        if (e.key === 'Escape') {
            closeDialog()
        }

        lastKey.current = e.key

        if (e.key === 'Escape') {
            e.preventDefault()
        }
    }

    const updateEntryValueForIndex = (index: number) => (newValue: string) => {
        const newEntries = updateEntryValue(entries, newValue, index)

        setEntries(newEntries)
    }

    return <ParamWithDelimiterValueInput className="query-param-input-value" value={zoomInValue}
                                  onChange={updateEntryValueForIndex(itemInZoomDialog)}
                                         onTextInputKeyUp={handleRenameKey}
                                  delimiter={paramsWithDelimiter[zoomInKey].separator} sx={{width: 'auto'}}/>
}


const SearchParams = ({entries, setEntries, paramsWithDelimiter}: SearchParamsProps) => {
    const shouldFocusNewParam = useRef<boolean>(false)
    const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
    const [itemInZoomDialog, setItemInZoomDialog] = useState(-1)
    // you can access the elements with itemsRef.current[n]

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

        const isMultipleValues = !!paramsWithDelimiter[key]

        return (
            <li className="query-param-input" key={index}>
                <TextField
                    className="query-param-input-key"
                    hiddenLabel
                    placeholder="Key"
                    size="small"
                    value={key}
                    onChange={e => updateCurrentEntryKey(e.target.value)}
                    inputRef={el => itemsRef.current[index] = el}
                />
                {isMultipleValues ? <TextField
                        className="query-param-input-value"
                        hiddenLabel
                        placeholder="Value"
                        size="small"
                        value={value}
                        onChange={e => updateCurrentEntryValue(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => {
                                            setItemInZoomDialog(index)
                                        }}
                                        edge="end"
                                    >
                                        <ZoomIn/>
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    /> :
                    <TextField
                        className="query-param-input-value"
                        hiddenLabel
                        placeholder="Value"
                        size="small"
                        value={value}
                        onChange={e => updateCurrentEntryValue(e.target.value)}
                    />}
                <IconButton aria-label="delete" color="primary" size="small"
                            sx={{padding: '0', marginLeft: '10px'}} onClick={removeSearchParam}>
                    <Clear fontSize="inherit"/>
                </IconButton>
            </li>
        )
    })

    const addNewEntry = () => {
        shouldFocusNewParam.current = true
        setEntries([...entries, ['', '']])
    }

    const closeDialog = () => {
        setItemInZoomDialog(-1)
    }

    const [zoomInKey, zoomInValue] = entries[itemInZoomDialog] || []
    const isZoomOpen = itemInZoomDialog !== -1

    return (
        <div>
            <ul>
                {items}
            </ul>
            <Dialog
                open={isZoomOpen}
                onClose={closeDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                PaperProps={{sx: {minWidth: '80%'}}}
            >
                <DialogTitle id="alert-dialog-title">
                    {`Edit ${zoomInKey}`}
                </DialogTitle>
                <DialogContent>
                    {isZoomOpen && <ZoomInDialog closeDialog={closeDialog} itemInZoomDialog={itemInZoomDialog} paramsWithDelimiter={paramsWithDelimiter} setEntries={setEntries} entries={entries}/>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Close</Button>
                </DialogActions>
            </Dialog>
            <Button color="secondary" sx={{marginTop: '10px'}} onClick={addNewEntry} variant="text">Add param</Button>
        </div>
    )
}

export default SearchParams
