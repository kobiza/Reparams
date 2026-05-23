/// <reference types="chrome"/>
import React, { createContext, PropsWithChildren, useEffect, useMemo, useLayoutEffect, useRef, useState } from "react";
import { EditorModel, ViewerStore } from "../../types/types";
import { getRelevantPackages, toViewerModel } from "../../utils/utils";
import type { DomSelectorResultMessage, DomSelectorRequestMessage } from "../../types/types";
import { CURRENT_MODEL_VERSION, loadAndMigrateAppData } from "../../utils/dataFixer";
import { perfMark, perfMeasure } from "../../utils/perf";


export const ViewerStoreContext = createContext<ViewerStore>({
    state: {
        presets: {},
        paramsWithDelimiter: {},
        quickActions: [],
        suggestions: { keys: [], valuesByKey: {} }
    },
});

const getSettings = (): EditorModel => {
    const result = loadAndMigrateAppData()
    return result.ok ? result.model : { modelVersion: CURRENT_MODEL_VERSION, packages: {} }
}


const UseViewerStoreContext = (props: PropsWithChildren<{ currentTabUrl: string }>) => {
    const { currentTabUrl } = props
    const [filterCriteriaResult, setFilterCriteriaResult] = useState<Record<string, boolean>>({})

    perfMark('rp:viewerStoreRender');

    const settings = useMemo(() => {
        perfMark('rp:loadSettingsStart');
        const s = getSettings();
        perfMark('rp:loadSettingsEnd');
        perfMeasure('rp:loadSettings', 'rp:loadSettingsStart', 'rp:loadSettingsEnd');
        return s;
    }, []);

    const domSelectors = useMemo(() => (
        Object.keys(
            Object.values(settings.packages)
                .flatMap(pkg => pkg.conditions.domSelectors)
                .reduce<Record<string, true>>((acc, curr) => { acc[curr.value] = true; return acc; }, {})
        )
    ), [settings]);

    const viewerState = useMemo(() => {
        perfMark('rp:toViewerModelStart');
        const state = toViewerModel(getRelevantPackages(settings, currentTabUrl, filterCriteriaResult), currentTabUrl);
        perfMark('rp:toViewerModelEnd');
        perfMeasure('rp:toViewerModel', 'rp:toViewerModelStart', 'rp:toViewerModelEnd');
        return state;
    }, [settings, currentTabUrl, filterCriteriaResult]);

    const contextValue = useMemo(() => ({ state: viewerState }), [viewerState]);

    const providerMountedRef = useRef(false);
    useLayoutEffect(() => {
        if (!providerMountedRef.current) {
            providerMountedRef.current = true;
            perfMark('rp:viewerStoreReady');
            perfMeasure('rp:viewerStoreInit', 'rp:scriptStart', 'rp:viewerStoreReady');
        }
    });

    useEffect(() => {
        const isRunInChromeExtension = chrome.tabs
        const messageListener = (message: DomSelectorResultMessage) => {
            if (message.type === 'DOM_SELECTOR_RESULT') {
                perfMark('rp:domSelectorReply');
                perfMeasure('rp:domSelectorRoundTrip', 'rp:domSelectorSent', 'rp:domSelectorReply');
                setFilterCriteriaResult(message.domSelectorResult);
            }
        };

        if (isRunInChromeExtension) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
                if (tabs[0]?.id) {
                    const message: DomSelectorRequestMessage = { type: 'DOM_SELECTOR_REQUEST', domSelectors };
                    perfMark('rp:domSelectorSent');
                    chrome.tabs.sendMessage(tabs[0].id, message).catch(() => { });
                }
            });

            chrome.runtime.onMessage.addListener(messageListener);
        }

        return () => {
            if (isRunInChromeExtension) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }
        };
    }, []);

    return (
        <ViewerStoreContext.Provider value={contextValue}>
            {props.children}
        </ViewerStoreContext.Provider>
    )
}

export default UseViewerStoreContext
