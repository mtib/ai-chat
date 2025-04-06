import React, { useState, useEffect } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, useMediaQuery, Theme } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from '../sidebar/Sidebar';
import ApiKeyModal from '../ApiKeyModal';

const drawerWidth = 240;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    // Add resize listener to handle mobile keyboard and orientation changes
    useEffect(() => {
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleDrawerClose = () => {
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            height: `${windowHeight}px`,
            overflow: 'hidden',
            flexDirection: 'column'
        }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <ChatIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" noWrap component="div">
                        chat.mtib.dev
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? mobileOpen : true}
                onClose={handleDrawerToggle}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        height: `${windowHeight}px`,
                        overflow: 'hidden',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: `calc(${windowHeight}px - 64px)`, // height minus toolbar
                    overflow: 'hidden'
                }}>
                    <Sidebar onItemClick={handleDrawerClose} />
                </Box>
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                height: `${windowHeight}px`,
                overflow: 'hidden',
                position: 'relative',
                marginTop: '64px', // Space for AppBar
                width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
                ml: isMobile ? 0 : `${drawerWidth}px`,
            }}>
                <Box sx={{
                    p: { xs: 1, sm: 2, md: 3 }, // Responsive padding
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;
