import { createTheme } from "@mui/material";
// const { palette } = createTheme();
// const { augmentColor } = palette;
// const createColor = (mainColor: string) => augmentColor({ color: { main: mainColor } });

const getMuiTheme = (mode: 'light' | 'dark' = 'light') => createTheme({
    palette: {
        mode,
        ...(mode === 'dark'
            ? {
                background: {
                    default: '#181943', // deep blue
                    paper: '#23235b',   // slightly lighter for surfaces
                },
                primary: {
                    main: '#8c7ae6', // vibrant purple
                },
                secondary: {
                    main: '#18dcff', // cyan accent
                },
                warning: {
                    main: '#ffaf40',
                },
                text: {
                    primary: '#fff',
                    secondary: '#b2b6d2',
                },
            }
            : {
                background: {
                    default: '#fff',
                    paper: '#f5f6fa',
                },
                primary: {
                    main: '#8c7ae6',
                },
                secondary: {
                    main: '#18dcff',
                },
                warning: {
                    main: '#ffaf40',
                },
                text: {
                    primary: '#181943',
                    secondary: '#23235b',
                },
            }),
    },
    typography: {
        fontFamily: ['monospace'].join(','),
        button: {
            textTransform: 'none'
        }
    }
});

export default getMuiTheme
