import React, {useContext, useEffect, useState} from 'react';
import './popup.scss'
import UrlEditor from "./UrlEditor";
import {ViewerStoreContext} from "./UseViewerStoreContext";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import {AppBar, Typography} from "@mui/material";

// import Settings from "./Settings";

function Popup({currentTabUrl, tabId}: { currentTabUrl: string; tabId: string }) {
    const {state} = useContext(ViewerStoreContext)

    const updateCurrentTabUrl = (newUrl: string) => {
        // @ts-ignores
        chrome.tabs.update(tabId, {url: newUrl}, () => window.close());
    }

    const openNewTab = (newUrl: string) => {
        // @ts-ignores
        chrome.tabs.create({url: newUrl});
    }

    return (
        <div className="popup">
            {/*<AddressBar currentUrl={currentUrl} setCurrentUrl={setCurrentUrl}/>*/}
            <AppBar className="app-bar" position="relative" component="nav" sx={{position: 'fixed', zIndex: '2'}}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                mr: 2,
                                fontWeight: 700,
                                letterSpacing: '2px',
                                color: 'inherit',
                                textDecoration: 'none',
                                flexGrow: 1
                            }}
                        >
                            ReParams
                        </Typography>
                    </Toolbar>
                </Container>
            </AppBar>
            <UrlEditor
                currentTabUrl={currentTabUrl}
                updateCurrentTabUrl={updateCurrentTabUrl}
                openNewTab={openNewTab}
                presets={state.presets}
                paramsWithDelimiter={state.paramsWithDelimiter}
                quickActions={state.quickActions}/>
            {/*<Settings/>*/}
        </div>
    );
}

export default Popup;
