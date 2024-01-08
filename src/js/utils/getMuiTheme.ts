import {createTheme} from "@mui/material";
import {deepOrange, grey} from "@mui/material/colors";
// const { palette } = createTheme();
// const { augmentColor } = palette;
// const createColor = (mainColor: string) => augmentColor({ color: { main: mainColor } });

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: '#9aff96',
        },
        secondary: {
            main: '#CDFAD5',
        },
        error: {
            main: '#ff8080',
        },
        text: {
            primary: 'rgba(255,255,255,0.87)',
            secondary: '#000000'
        },
        background: {
            default: '#000000',
            paper: '#877f7f',
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