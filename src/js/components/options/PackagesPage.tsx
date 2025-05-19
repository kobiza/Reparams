import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { EditorStoreContext } from './UseEditorStoreContext';
import PackagePanel from './PackagePanel';

const PackagesPage = () => {
    const editorStore = useContext(EditorStoreContext)
    const {
        state: appState,
        addNewPackage,
        addPackages,
    } = editorStore
    const packagesList = Object.values(appState.packages).map((packageData) => {
        return (
            <PackagePanel key={packageData.key} packageData={packageData} packageKey={packageData.key}
                editorStore={editorStore} />
        )
    })
    return (
        <div>
            {packagesList}
            <Button sx={{ marginTop: '10px' }} onClick={() => addNewPackage()}
                variant="text">Add Package</Button>
        </div>
    )
}

export default PackagesPage;
