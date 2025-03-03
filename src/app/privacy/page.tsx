import { Container, Typography, Box, Paper, Divider } from '@mui/material';

export const metadata = {
  title: 'Privacy Policy | GolfCompete',
  description: 'Privacy Policy for GolfCompete - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Typography>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" paragraph>
            At GolfCompete, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </Typography>
          <Typography variant="body1" paragraph>
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Personal Information:</strong> We may collect personal information that you voluntarily provide to us when you register on the website, express interest in obtaining information about us or our products and services, or otherwise contact us. This information may include:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                Name, email address, and contact details
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Golf-related information such as handicap, club preferences, and playing history
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Profile pictures and other content you choose to upload
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Information about your participation in events and competitions
              </Typography>
            </li>
          </ul>
          
          <Typography variant="body1" paragraph>
            <strong>Automatically Collected Information:</strong> When you access our website, we may automatically collect certain information about your device and usage patterns, including:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                Device information (browser type, operating system, IP address)
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Usage data (pages visited, time spent on site, referring URLs)
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Cookies and similar tracking technologies
              </Typography>
            </li>
          </ul>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We may use the information we collect for various purposes, including:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                Providing, maintaining, and improving our services
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Processing and managing your participation in golf events and competitions
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Communicating with you about updates, features, and promotional offers
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Analyzing usage patterns to enhance user experience
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Protecting our services and addressing fraud or security issues
              </Typography>
            </li>
          </ul>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Sharing Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We may share your information in the following situations:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                <strong>With Your Consent:</strong> We may disclose your information when you have given us permission to do so.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>With Other Users:</strong> Information such as your name, profile picture, and golf statistics may be visible to other users participating in the same events or series.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>With Service Providers:</strong> We may share your information with third-party vendors who provide services on our behalf.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>For Legal Purposes:</strong> We may disclose information to comply with legal obligations or protect our rights.
              </Typography>
            </li>
          </ul>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Your Privacy Rights
          </Typography>
          <Typography variant="body1" paragraph>
            Depending on your location, you may have certain rights regarding your personal information, including:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                The right to access and receive a copy of your personal information
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                The right to correct or update your personal information
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                The right to request deletion of your personal information
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                The right to restrict or object to processing of your personal information
              </Typography>
            </li>
          </ul>
          <Typography variant="body1" paragraph>
            To exercise these rights, please contact us using the information provided below.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Children's Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we learn we have collected or received personal information from a child under 13, we will delete that information.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Changes to This Privacy Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have questions or concerns about this Privacy Policy, please contact us at:
          </Typography>
          <Typography variant="body1" paragraph>
            Email: privacy@golfcompete.com
          </Typography>
          <Typography variant="body1" paragraph>
            Or visit our Contact page for more information.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 