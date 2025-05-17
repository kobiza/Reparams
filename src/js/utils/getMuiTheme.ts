import { createTheme } from "@mui/material";
// const { palette } = createTheme();
// const { augmentColor } = palette;
// const createColor = (mainColor: string) => augmentColor({ color: { main: mainColor } });

const getMuiTheme = (mode: 'light' | 'dark' = 'light') => createTheme({
    palette: {
        mode,
        primary: {
            main: '#8c7ae6',
        },
        secondary: {
            main: '#18dcff',
        },
        warning: {
            main: '#ffaf40',
        },
    },
    typography: {
        fontFamily: ['monospace'].join(','),
        button: {
            textTransform: 'none'
        }
    }
});

export default getMuiTheme
