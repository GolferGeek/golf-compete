'use client';

import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

export default function AboutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom sx={{ mb: 4 }}>
        About GolfCompete
      </Typography>
      
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Box component="section" sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 2 }}>
            Our Mission
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            GolfCompete aims to become the definitive digital platform for competitive golfers, 
            creating a community where competition drives improvement and improvement fuels competitive success.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            By connecting players, coaches, and courses, we&apos;re building an ecosystem that elevates 
            the entire golfing experience.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 2 }}>
            Our Story
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            GolfCompete was born from a passion for golf and a desire to help golfers of all levels 
            improve their game through structured competition and targeted practice.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Our team of golf enthusiasts and technology experts came together to create a platform 
            that addresses the unique needs of serious golfers who want to take their game to the next level.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 2 }}>
            Our Approach
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We believe that improvement in golf comes from a combination of structured practice, 
            competitive play, and professional guidance. GolfCompete brings these elements together 
            in one seamless platform.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Our FedEx Cup-style competitions, detailed performance tracking, and coaching integration 
            create a comprehensive ecosystem for golfers who are serious about improving their game.
          </Typography>
        </Box>

        <Box component="section">
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 2 }}>
            Join Us
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Whether you&apos;re a dedicated amateur looking to improve, a golf professional expanding your 
            coaching services, or a course wanting to increase engagement, GolfCompete has something 
            for you. Join us today and elevate your golf experience.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
} 