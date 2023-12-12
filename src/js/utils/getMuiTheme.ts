import {createTheme} from "@mui/material";
// const { palette } = createTheme();
// const { augmentColor } = palette;
// const createColor = (mainColor: string) => augmentColor({ color: { main: mainColor } });

const theme = createTheme({
    // palette: {
    //     primary: {
    //         main: '#673ab7',
    //     },
    //     secondary: {
    //         main: '#f50057',
    //     },
    // },
    typography: {
        button: {
            textTransform: 'none'
        }
    }
});

const getMuiTheme = () => theme

export default getMuiTheme