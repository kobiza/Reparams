import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';

export const autocompleteListboxSx: SxProps<Theme> = {
    maxHeight: '340px',
    backgroundColor: (theme) => theme.palette.background.paper,
    color: (theme) => theme.palette.text.primary,
    '&::-webkit-scrollbar': {
        width: 12,
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(0,0,0,0.20)',
        borderRadius: 6,
        border: '3px solid transparent',
        backgroundClip: 'padding-box',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.32)'
                : 'rgba(0,0,0,0.35)',
    },
};
