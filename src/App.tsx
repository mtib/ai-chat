import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';
import MainLayout from './components/layouts/MainLayout';
import ChatContent from './components/chat/ChatContent';
import { ConversationProvider } from './contexts/ConversationContext';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ConversationProvider>
                <MainLayout>
                    <ChatContent />
                </MainLayout>
            </ConversationProvider>
        </ThemeProvider>
    );
}

export default App;
