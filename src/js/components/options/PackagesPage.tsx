import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { EditorStoreContext } from './UseEditorStoreContext';
import PackagePanel from './PackagePanel';
import BulkSyncDialog from './BulkSyncDialog';

const PackagesPage = () => {
    const editorStore = useContext(EditorStoreContext)
    const {
        state: appState,
        addNewPackage,
        addPackages,
    } = editorStore
    const [bulkOpen, setBulkOpen] = useState(false);
    const hasLinkedPackages = Object.values(appState.packages).some(p => !!p.gistId);

    const packagesList = Object.values(appState.packages).map((packageData) => {
        return (
            <PackagePanel key={packageData.key} packageData={packageData} packageKey={packageData.key}
                editorStore={editorStore} />
        )
    })
    return (
        <div>
            {hasLinkedPackages && (
                <Box sx={{ mb: 1 }}>
                    <Button variant="text" onClick={() => setBulkOpen(true)}>
                        Check Gist updates
                    </Button>
                </Box>
            )}
            {packagesList}
            <Button sx={{ marginTop: '10px' }} onClick={() => addNewPackage()}
                variant="text">Add Package</Button>
            <BulkSyncDialog
                isOpen={bulkOpen}
                onClose={() => setBulkOpen(false)}
                packages={appState.packages}
                addPackages={addPackages}
            />
        </div>
    )
}

export default PackagesPage;
