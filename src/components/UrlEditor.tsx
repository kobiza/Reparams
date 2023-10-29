import React, {useState} from 'react';
import './App.scss';
import SearchParams from "./SearchParams";
import PresetsPicker from "./PresetsPicker";
import classnames from "classnames";
import {
    ParamsWithMultipleValuesViewModel,
    PresetsEntriesMapViewModel,
    QuickActionData
} from "../types/types";
import {Paper} from "@mui/material";
import {divide} from "lodash";

type UrlEditorProps = {
    url: string,
    updateUrl: (newUrl: string) => void,
    presets: PresetsEntriesMapViewModel
    paramsWithMultipleValues: ParamsWithMultipleValuesViewModel,
    quickActions: QuickActionData
    className?: string,
}

const addEntries = (url: string, newEntries: Array<[string, string]>) => {
    const newSearch = new URLSearchParams(newEntries).toString()
    const newUrlData = new URL(url)

    newUrlData.search = newSearch

    return newUrlData.toString()
}

function UrlEditor({url, updateUrl, className, presets, paramsWithMultipleValues, quickActions}: UrlEditorProps) {
    // const urlData = new URL(url)
    const [newUrl, setNewUrl] = useState(url)
    const newUrlData = new URL(newUrl)
    const searchParamsEntries = [...newUrlData.searchParams.entries()]
    const setSearchParamsEntries = (newSearchParamsEntries: Array<[string, string]>) => {
        setNewUrl((prevUrl) => {
            return addEntries(prevUrl, newSearchParamsEntries)
        })
    }

    const addEntriesAndNavigate = (newSearchParamsEntries: Array<[string, string]>) => {
        setNewUrl((prevUrl) => {
            const nextUrl = addEntries(newUrl, newSearchParamsEntries)

            updateUrl(nextUrl)

            return nextUrl
        })
    }


    const updateUrlHandler = () => {
        updateUrl(newUrl)
    }

    return (
        <div>
            <h1 className="app-title">Reparams</h1>
            <SearchParams entries={searchParamsEntries} setEntries={setSearchParamsEntries}/>
            <PresetsPicker entries={searchParamsEntries} setEntries={setSearchParamsEntries} presets={presets}
                           paramsWithMultipleValues={paramsWithMultipleValues} quickActions={quickActions}
                           addEntriesAndNavigate={addEntriesAndNavigate}/>
            <button className="app-button apply-button" onClick={updateUrlHandler}>Apply</button>
        </div>
    );
}

export default UrlEditor;
