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

// Blue Light inspired colors
const blueLight = {
    background: {
        default: '#eaf6fb', // soft blue background
        paper: '#ffffff',   // card/surface
    },
    primary: {
        main: '#2979ff', // blue accent
    },
    secondary: {
        main: '#fbc02d', // yellow accent
    },
    warning: {
        main: '#ffb300', // orange warning
    },
    text: {
        primary: '#232841', // dark blue text
        secondary: '#4b5c77', // soft blue-gray
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
                background: blueLight.background,
                primary: blueLight.primary,
                secondary: blueLight.secondary,
                warning: blueLight.warning,
                text: blueLight.text,
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
