import { createTheme, ThemeOptions } from '@mui/material/styles';

/**
 * Application theme configuration with deep purple color scheme
 */
export const themeOptions: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#8f5aa5', // Deeper purple
            light: '#ae52d4',
            dark: '#4f3072',
        },
        secondary: {
            main: '#6f3de8', // Adjusted purple accent
            light: '#a271ff',
            dark: '#3d1db5',
        },
        background: {
            default: '#0a0415', // Very dark purple background
            paper: '#160826', // Darker deep purple for paper elements
        },
        text: {
            primary: '#f5f5f5',
            secondary: '#c7c7c7',
        },
    },
    typography: {
        // Use Sono with MONO explicitly set to 0 for the proportional variant
        fontFamily: '"Sono", sans-serif',
        h6: {
            fontWeight: 500,
            fontVariationSettings: "'MONO' 0", // Ensure proportional variant for headings
        },
        body1: {
            lineHeight: 1.6,
            fontVariationSettings: "'MONO' 0", // Ensure proportional variant for body text
        },
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontVariationSettings: "'MONO' 0", // Ensure proportional variant for buttons
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: `
                body {
                    font-family: 'Sono', sans-serif;
                    font-variation-settings: 'MONO' 0; /* Ensure proportional variant by default */
                }
                code, pre {
                    font-family: 'Sono', monospace;
                    font-variation-settings: 'MONO' 1; /* Use monospace variant only for code */
                }
            `,
        },
        MuiTypography: {
            defaultProps: {
                variantMapping: {
                    body1: 'p',
                    body2: 'p',
                },
            },
            styleOverrides: {
                root: {
                    fontVariationSettings: "'MONO' 0", // Ensure proportional variant for all typography
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiInputBase-input': {
                        fontVariationSettings: "'MONO' 0", // Ensure proportional variant for text inputs
                    }
                }
            }
        },
    },
};

/**
 * Create and export the theme
 */
export const theme = createTheme(themeOptions);
