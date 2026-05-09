import React from 'react'
import Box from '@mui/material/Box'
import Kbd from './Kbd'
import { getShortcutTokens } from '../../utils/keyboardShortcutFormat'

const ShortcutHint = ({ keys }: { keys: string[] }) => {
    const tokens = getShortcutTokens(keys)
    return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}>
            {tokens.map((token, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <Box component="span" sx={{ opacity: 0.6 }}>+</Box>}
                    <Kbd>{token}</Kbd>
                </React.Fragment>
            ))}
        </Box>
    )
}

export default ShortcutHint
