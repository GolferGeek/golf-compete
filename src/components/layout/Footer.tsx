"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { styled, useTheme } from '@mui/material/styles';
import { useAuth } from '@/contexts/AuthContext';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  display: 'block',
  padding: '6px 0',
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

const FooterSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const FooterHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1.5),
}));

const SocialIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(46, 125, 50, 0.1)' 
      : 'rgba(46, 125, 50, 0.08)',
  },
}));

export default function Footer() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Set mounted flag to true when component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  const footerSections = [
    {
      title: "Quick Links",
      links: [
        { label: mounted && user ? "Dashboard" : "Home", href: mounted && user ? "/dashboard" : "/" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Contact Us", href: "/contact" },
      ]
    }
  ];

  // Mobile accordion footer
  if (isMobile) {
    return (
      <Box component="footer" sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        mt: 'auto'
      }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <GolfCourseIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              GolfCompete
            </Typography>
          </Box>
          
          {footerSections.map((section, index) => (
            <Accordion 
              key={index} 
              disableGutters 
              elevation={0} 
              sx={{ 
                '&:before': { display: 'none' },
                backgroundColor: 'transparent',
                borderBottom: index < footerSections.length - 1 ? 1 : 0,
                borderColor: 'divider'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
                sx={{ px: 0, minHeight: 48 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {section.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                {section.links.map((link, linkIndex) => (
                  <FooterLink key={linkIndex} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
          
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Follow Us
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <SocialIconButton aria-label="Facebook" size="small">
                <FacebookIcon fontSize="small" />
              </SocialIconButton>
              <SocialIconButton aria-label="Twitter" size="small">
                <TwitterIcon fontSize="small" />
              </SocialIconButton>
              <SocialIconButton aria-label="Instagram" size="small">
                <InstagramIcon fontSize="small" />
              </SocialIconButton>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} GolfCompete. All rights reserved.
          </Typography>
        </Container>
      </Box>
    );
  }

  // Desktop footer
  return (
    <Box component="footer" sx={{ 
      py: 4, 
      borderTop: 1, 
      borderColor: 'divider',
      bgcolor: 'background.paper',
      mt: 'auto'
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FooterSection>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GolfCourseIcon sx={{ mr: 1, color: 'primary.main' }} />
                <FooterHeading variant="h6">GolfCompete</FooterHeading>
              </Box>
              <Typography variant="body2" color="text.secondary">
                A comprehensive golf competition and improvement platform designed to transform how golfers compete, track progress, and enhance their skills.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex' }}>
                <SocialIconButton aria-label="Facebook">
                  <FacebookIcon />
                </SocialIconButton>
                <SocialIconButton aria-label="Twitter">
                  <TwitterIcon />
                </SocialIconButton>
                <SocialIconButton aria-label="Instagram">
                  <InstagramIcon />
                </SocialIconButton>
              </Box>
            </FooterSection>
          </Grid>
          
          {footerSections.map((section, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <FooterSection>
                <FooterHeading variant="subtitle1">{section.title}</FooterHeading>
                <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                  {section.links.map((link, linkIndex) => (
                    <Box component="li" key={linkIndex}>
                      <FooterLink href={link.href}>
                        {link.label}
                      </FooterLink>
                    </Box>
                  ))}
                </Box>
              </FooterSection>
            </Grid>
          ))}
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          &copy; {new Date().getFullYear()} GolfCompete. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
} 