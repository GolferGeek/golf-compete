'use client';

import { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2e7d32', // Green color for golf theme
      },
      secondary: {
        main: '#f9a825', // Amber color as accent
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
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
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
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
    },
  });
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
