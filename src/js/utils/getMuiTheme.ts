import { createTheme } from "@mui/material";
// const { palette } = createTheme();
// const { augmentColor } = palette;
// const createColor = (mainColor: string) => augmentColor({ color: { main: mainColor } });

// Bluloco Dark inspired colors
const blulocoDark = {
    background: {
        default: '#232841', // main background
        paper: '#2c3152',   // card/surface
    },
    primary: {
        main: '#6db3f2', // blue accent
    },
    secondary: {
        main: '#f28779', // orange accent
    },
    warning: {
        main: '#ffd580', // soft yellow
    },
    text: {
        primary: '#eaf2fb', // almost white
        secondary: '#a6accd', // soft blue-gray
    },
};

const getMuiTheme = (mode: 'light' | 'dark' = 'light') => createTheme({
    palette: {
        mode,
        ...(mode === 'dark'
            ? {
                background: blulocoDark.background,
                primary: blulocoDark.primary,
                secondary: blulocoDark.secondary,
                warning: blulocoDark.warning,
                text: blulocoDark.text,
            }
            : {
                background: {
                    default: '#fff',
                    paper: '#f5f6fa',
                },
                primary: {
                    main: '#1976d2',
                },
                secondary: {
                    main: '#f50057',
                },
                warning: {
                    main: '#ffaf40',
                },
                text: {
                    primary: '#232841',
                    secondary: '#2c3152',
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
