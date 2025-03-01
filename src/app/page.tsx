'use client';

import Link from "next/link";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 0),
  background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(14, 0),
  },
}));

const FeatureIcon = styled('div')(({ theme }) => ({
  fontSize: '2.5rem',
  marginBottom: theme.spacing(2),
}));

const StyledLink = styled(Link)({
  textDecoration: 'none',
});

export default function Home() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Elevate Your Golf Game
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 5 }}>
            GolfCompete is a comprehensive platform designed to transform how golfers compete, 
            track progress, and enhance their skills.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
            <StyledLink href="/auth/signup">
              <Button variant="contained" size="large">
                Get Started
              </Button>
            </StyledLink>
            <StyledLink href="/about">
              <Button variant="outlined" size="large">
                Learn More
              </Button>
            </StyledLink>
          </Box>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ mb: 6 }}>
            Key Features
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6} lg={4}>
              <FeatureCard 
                title="Competition Management"
                description="FedEx Cup-style season-long competitions with points tracking, standalone events, and real-time scorecards."
                icon="🏆"
                link="/competitions"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <FeatureCard 
                title="Performance Tracking"
                description="Multiple bag configurations with separate handicap tracking, course-specific analytics, and comprehensive scoring history."
                icon="🎯"
                link="/tracking"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <FeatureCard 
                title="Improvement Framework"
                description="Structured practice planning based on identified weaknesses, pre/post routines, and issue logging."
                icon="📈"
                link="/improvement"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <FeatureCard 
                title="Professional Coaching"
                description="Direct connection to golf professionals with micro-consultation system and personalized feedback."
                icon="👨‍🏫"
                link="/coaching"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <FeatureCard 
                title="Course Integration"
                description="Detailed course database with comprehensive information and course-hosted daily competitions."
                icon="🏌️"
                link="/courses"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <FeatureCard 
                title="Course-Initiated Games"
                description="Daily putting and chipping contests set up by course administrators with leaderboards for friendly competition."
                icon="🎮"
                link="/games"
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="h2" gutterBottom>
            Ready to Transform Your Golf Experience?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 5 }}>
            Join GolfCompete today and take your game to the next level with our comprehensive platform.
          </Typography>
          <StyledLink href="/auth/signup">
            <Button variant="contained" size="large">
              Sign Up Now
            </Button>
          </StyledLink>
        </Container>
      </Box>
    </Box>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
}

function FeatureCard({ title, description, icon, link }: FeatureCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <>
            <FeatureIcon>{icon}</FeatureIcon>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </>
        }
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button component={Link} href={link} size="small" color="primary">
          Learn more →
        </Button>
      </CardActions>
    </Card>
  );
}
