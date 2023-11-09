import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import {SettingsPages} from "./Settings";


type SettingsHeaderProps = {
    currentPage: SettingsPages
    setCurrentPage: (page: SettingsPages) => void
}

function SettingsHeader({currentPage, setCurrentPage}: SettingsHeaderProps) {
    return (
        <AppBar position="relative" component="nav">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                            mr: 2,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            flexGrow: 1
                        }}
                    >
                        {`REPARAMS - Settings/${currentPage}`}
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button sx={{ color: '#fff' }} onClick={() => setCurrentPage('Packages')}>
                            Packages
                        </Button>
                        <Button sx={{ color: '#fff' }} onClick={() => setCurrentPage('Shortcuts')}>
                            Shortcuts
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
export default SettingsHeader;