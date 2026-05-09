import React from 'react'
import Box from '@mui/material/Box'

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <Box
        component="kbd"
        sx={{
            display: 'inline-block',
            verticalAlign: 'middle',
            padding: '2px 7px',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.45)',
            borderRadius: '4px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '0.95em',
            fontWeight: 600,
            lineHeight: 1.2,
            background: 'rgba(255, 255, 255, 0.12)',
            color: 'inherit',
        }}
    >
        {children}
    </Box>
)

export default Kbd
