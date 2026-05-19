import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SyncIcon from '@mui/icons-material/Sync';
import { EditorStoreContext } from './UseEditorStoreContext';
import PackagePanel from './PackagePanel';
import CheckForUpdatesDialog from './CheckForUpdatesDialog';

const PackagesPage = () => {
    const editorStore = useContext(EditorStoreContext)
    const {
        state: appState,
        addNewPackage,
        addPackages,
    } = editorStore
    const [updatesOpen, setUpdatesOpen] = useState(false);
    const hasConnectedPackages = Object.values(appState.packages).some(p => !!p.sourceUrl);

    const packagesList = Object.values(appState.packages).map((packageData) => {
        return (
            <PackagePanel key={packageData.key} packageData={packageData} packageKey={packageData.key}
                editorStore={editorStore} />
        )
    })
    return (
        <div>
            {hasConnectedPackages && (
                <Box sx={{ mb: 1 }}>
                    <Tooltip title="Check for updates">
                        <IconButton
                            aria-label="check for updates"
                            color="primary"
                            onClick={() => setUpdatesOpen(true)}
                        >
                            <SyncIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            {packagesList}
            <Button sx={{ marginTop: '10px' }} onClick={() => addNewPackage()}
                variant="text">Add Package</Button>
            <CheckForUpdatesDialog
                isOpen={updatesOpen}
                onClose={() => setUpdatesOpen(false)}
                packages={appState.packages}
                addPackages={addPackages}
            />
        </div>
    )
}

export default PackagesPage;
