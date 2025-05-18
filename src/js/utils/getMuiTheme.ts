import { createTheme } from "@mui/material";
// const { palette } = createTheme();
// const { augmentColor } = palette;
// const createColor = (mainColor: string) => augmentColor({ color: { main: mainColor } });

// DeviasKit-inspired dark theme
const deviasDark = {
    background: {
        default: '#18192a', // very dark blue background
        paper: '#23243a',   // card/surface
    },
    primary: {
        main: '#6366f1', // blue-violet accent
    },
    secondary: {
        main: '#a78bfa', // lighter blue-violet accent
    },
    warning: {
        main: '#ffd580', // soft yellow
    },
    text: {
        primary: '#fff', // white text
        secondary: '#aeb2cf', // soft blue-gray
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
                background: deviasDark.background,
                primary: deviasDark.primary,
                secondary: deviasDark.secondary,
                warning: deviasDark.warning,
                text: deviasDark.text,
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
