import { createTheme } from "@mui/material";
// const { palette } = createTheme();
// const { augmentColor } = palette;
// const createColor = (mainColor: string) => augmentColor({ color: { main: mainColor } });

const theme = createTheme({
    palette: {
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

const getMuiTheme = () => theme

export default getMuiTheme
