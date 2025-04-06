import React, { useState, useEffect, useRef } from 'react';
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
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const mainBoxRef = useRef<HTMLDivElement | null>(null);

    // Add resize listener to handle mobile keyboard and orientation changes
    useEffect(() => {
        const handleResize = () => {
            const newWindowHeight = window.innerHeight;
            setWindowHeight(newWindowHeight);

            // Detect if keyboard is likely open (if height decreased significantly on mobile)
            if (isMobile) {
                // A height reduction of more than 25% likely indicates keyboard is open
                const heightReduction = window.outerHeight - newWindowHeight;
                const isKeyboardVisible = heightReduction > window.outerHeight * 0.25;

                if (isKeyboardVisible !== isKeyboardOpen) {
                    setIsKeyboardOpen(isKeyboardVisible);

                    // If keyboard just opened, scroll to make content visible
                    if (isKeyboardVisible) {
                        setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });

                            if (contentRef.current) {
                                contentRef.current.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'end'
                                });
                            }
                        }, 100);
                    }
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, isKeyboardOpen]);

    // Handle input focus to ensure it's visible when keyboard opens
    const handleInputFocus = () => {
        if (isMobile) {
            setIsKeyboardOpen(true);

            // Small delay to allow the keyboard to start appearing
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Scroll main content area to ensure input is visible
                if (mainBoxRef.current) {
                    const scrollHeight = mainBoxRef.current.scrollHeight;
                    mainBoxRef.current.scrollTo({
                        top: scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 200);
        }
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleDrawerClose = () => {
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    // Calculate bottom padding to accommodate keyboard on mobile
    const bottomPadding = isKeyboardOpen && isMobile ? '240px' : '0';

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

            <Box
                component="main"
                ref={mainBoxRef}
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: `${windowHeight}px`,
                    overflow: 'hidden',
                    position: 'relative',
                    marginTop: '64px', // Space for AppBar
                    width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
                    ml: isMobile ? 0 : `${drawerWidth}px`,
                }}
            >
                <Box
                    ref={contentRef}
                    sx={{
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
                        paddingBottom: bottomPadding, // Add padding at the bottom when keyboard is open
                    }}
                    onFocus={handleInputFocus}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;
