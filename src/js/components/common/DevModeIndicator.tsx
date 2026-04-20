import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';

function DevModeIndicator() {
    const [isUnpacked, setIsUnpacked] = useState(false);

    useEffect(() => {
        try {
            chrome?.management?.getSelf((info) => {
                if (info?.installType === 'development') {
                    setIsUnpacked(true);
                }
            });
        } catch {
            // chrome.management unavailable (e.g., standalone dev server) — leave hidden
        }
    }, []);

    if (!isUnpacked) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 4,
                left: 4,
                px: 0.75,
                py: '1px',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'warning.contrastText',
                bgcolor: 'warning.main',
                borderRadius: '4px',
                opacity: 0.65,
                pointerEvents: 'none',
                zIndex: 2000,
                userSelect: 'none',
            }}
        >
            DEV
        </Box>
    );
}

export default DevModeIndicator;
