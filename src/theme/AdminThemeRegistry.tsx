'use client';

import { useState } from 'react';
import { createTheme, ThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Roboto } from 'next/font/google';
import { PaletteMode } from '@mui/material';
import Box from '@mui/material/Box';

// Define the Roboto font with specific subsets
const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Create a theme instance
const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#2e7d32', // Green color for golf theme
      },
      secondary: {
        main: '#f9a825', // Amber color as accent
      },
      background: {
        default: mode === 'light' ? '#e6f0e6' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: roboto.style.fontFamily,
      h1: {
        fontWeight: 500,
      },
      h2: {
        fontWeight: 500,
      },
      h3: {
        fontWeight: 500,
      },
      // Add responsive font sizes for mobile
      body1: {
        fontSize: '1rem',
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        '@media (max-width:600px)': {
          fontSize: '0.75rem',
        },
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            padding: '6px 16px',
            '@media (max-width:600px)': {
              padding: '4px 10px',
              fontSize: '0.8125rem',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0px 2px 4px rgba(0, 0, 0, 0.1)' 
              : '0px 2px 4px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              padding: '0 8px',
            },
          },
        },
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
  });
  
  // Apply responsive font sizes
  theme = responsiveFontSizes(theme);
  
  return theme;
};

export default function AdminThemeRegistry({ children }: { children: React.ReactNode }) {
  // Default to light mode - using only the initial state for now
  const [mode] = useState<PaletteMode>('light');
  const theme = createAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* No Navbar or Footer for admin pages */}
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
