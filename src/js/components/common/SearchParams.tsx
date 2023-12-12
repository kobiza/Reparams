import React, {useEffect, useRef} from "react";
import {SearchParamsEntries, SetEntries} from "../../types/types";
import {updateEntryKey, updateEntryValue} from "../../utils/searchParamsUtils";
import './SearchParams.scss'
import {Button, IconButton, TextField} from "@mui/material";
import {Add, Clear} from "@mui/icons-material";
import {removeItem} from "../../utils/arrayUtils";
import usePrevious from "./usePrevious";

type SearchParamsProps = {
    entries: SearchParamsEntries
    setEntries: SetEntries
}



const SearchParams = ({entries, setEntries}: SearchParamsProps) => {
    const shouldFocusNewParam = useRef<boolean>(false)
    const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
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
                <TextField
                    className="query-param-input-value"
                    hiddenLabel
                    placeholder="Value"
                    size="small"
                    value={value}
                    onChange={e => updateCurrentEntryValue(e.target.value)}
                />
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

    return (
        <div>
            <ul>
                {items}
            </ul>
            <Button color="secondary" sx={{marginTop: '10px'}} onClick={addNewEntry} variant="text">Add param</Button>
        </div>
    )
}

export default SearchParams
