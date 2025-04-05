import React from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import Sidebar from '../sidebar/Sidebar';
import ApiKeyModal from '../ApiKeyModal';

const drawerWidth = 240;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <ChatIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" noWrap component="div">
                        chat.mtib.dev
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        height: '100%',
                        overflow: 'hidden',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100% - 64px)', // height minus toolbar
                    overflow: 'hidden'
                }}>
                    <Sidebar />
                </Box>
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden'
            }}>
                <Toolbar /> {/* This creates space for the AppBar */}
                <Box sx={{
                    p: 3,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;
