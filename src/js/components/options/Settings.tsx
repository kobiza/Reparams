import React from 'react';
import { EditorStoreContext } from "./UseEditorStoreContext";
import SettingsHeader from "./SettingsHeader";
import PackagesPage from "./PackagesPage";
import './Settings.scss';

const Settings = () => {
    const editorStore = React.useContext(EditorStoreContext)
    const {
        state,
    } = editorStore
    return (
        <div className="settings-pages">
            <SettingsHeader packages={state.packages} addPackages={editorStore.addPackages} />
            <PackagesPage />
        </div>
    )
}

export default Settings;
