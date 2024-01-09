import {createTheme} from "@mui/material";
import {deepOrange, grey} from "@mui/material/colors";
// const { palette } = createTheme();
// const { augmentColor } = palette;
// const createColor = (mainColor: string) => augmentColor({ color: { main: mainColor } });

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: '#207fe6',
        },
        secondary: {
            main: '#ac6fe6',
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