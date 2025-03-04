'use client';

import { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Inter } from 'next/font/google';
import { PaletteMode } from '@mui/material';
import Box from '@mui/material/Box';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// Define the Inter font with specific subsets
const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Create a theme instance
const createAppTheme = (mode: PaletteMode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1e5631', // Deeper green for a premium golf feel
        light: '#4c7a5d',
        dark: '#0d3819',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#d4af37', // Gold color for a premium accent
        light: '#e4c867',
        dark: '#aa8c2c',
        contrastText: '#000000',
      },
      info: {
        main: '#2a6f97', // Replacing the blue for "invited" status
        light: '#5c9dc9',
        dark: '#1a4c6a',
      },
      success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
      },
      error: {
        main: '#d32f2f',
        light: '#ef5350',
        dark: '#c62828',
      },
      warning: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
      },
      background: {
        default: mode === 'light' ? '#f8f9fa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#212529' : '#e0e0e0',
        secondary: mode === 'light' ? '#495057' : '#adb5bd',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    },
    typography: {
      fontFamily: inter.style.fontFamily,
      h1: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.015em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.015em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.015em',
      },
      subtitle1: {
        fontWeight: 500,
      },
      subtitle2: {
        fontWeight: 500,
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.6,
      },
      button: {
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0px 4px 20px rgba(0, 0, 0, 0.05)' 
              : '0px 4px 20px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light' 
                ? '0px 6px 25px rgba(0, 0, 0, 0.08)' 
                : '0px 6px 25px rgba(0, 0, 0, 0.4)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0px 4px 20px rgba(0, 0, 0, 0.05)' 
              : '0px 4px 20px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
          sizeSmall: {
            height: 24,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            margin: '16px 0',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
  });
};

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  // Default to light mode - using only the initial state for now
  const [mode] = useState<PaletteMode>('light');
  const theme = createAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
} 