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

// Dashboard-inspired light theme
const dashboardLight = {
    background: {
        default: '#f4f6fa', // very light gray background
        paper: '#fff',      // white card/surface
    },
    primary: {
        main: '#6c63ff', // blue-violet accent
    },
    secondary: {
        main: '#f50057', // pink accent (optional)
    },
    warning: {
        main: '#ffb300', // orange warning
    },
    text: {
        primary: '#232323', // dark gray text
        secondary: '#6b7280', // soft gray
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
                background: dashboardLight.background,
                primary: dashboardLight.primary,
                secondary: dashboardLight.secondary,
                warning: dashboardLight.warning,
                text: dashboardLight.text,
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
