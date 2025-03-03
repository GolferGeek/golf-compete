"use client";

import Link from "next/link";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

const FooterSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const FooterHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
}));

export default function Footer() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Set mounted flag to true when component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box component="footer" sx={{ 
      py: 6, 
      borderTop: 1, 
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FooterSection>
              <FooterHeading variant="h6">GolfCompete</FooterHeading>
              <Typography variant="body2" color="text.secondary">
                A comprehensive golf competition and improvement platform designed to transform how golfers compete, track progress, and enhance their skills.
              </Typography>
            </FooterSection>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FooterSection>
              <FooterHeading variant="subtitle1">Quick Links</FooterHeading>
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <FooterLink href={mounted && user ? "/dashboard" : "/"}>
                    {mounted && user ? "Dashboard" : "Home"}
                  </FooterLink>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <FooterLink href="/about">About</FooterLink>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <FooterLink href="/contact">Contact</FooterLink>
                </Box>
              </Box>
            </FooterSection>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FooterSection>
              <FooterHeading variant="subtitle1">Legal</FooterHeading>
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <FooterLink href="/privacy">Privacy Policy</FooterLink>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <FooterLink href="/terms">Terms of Service</FooterLink>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <FooterLink href="/contact">Contact Us</FooterLink>
                </Box>
              </Box>
            </FooterSection>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          &copy; {new Date().getFullYear()} GolfCompete. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
} 