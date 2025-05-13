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
    const packagesList = appState.map((packageData, packageIndex) => {
        return (
            <PackagePanel key={packageData.key} packageData={packageData} packageIndex={packageIndex}
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
