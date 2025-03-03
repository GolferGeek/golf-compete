import { Container, Typography, Box, Paper, Divider } from '@mui/material';

export const metadata = {
  title: 'Terms of Service | GolfCompete',
  description: 'Terms of Service for GolfCompete - The rules and guidelines governing your use of our platform.',
};

export default function TermsOfServicePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Typography>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" paragraph>
            Welcome to GolfCompete. Please read these Terms of Service ("Terms") carefully before using our website and services. By accessing or using GolfCompete, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the service.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing or using our service, you agree to be bound by these Terms. If you are using the service on behalf of an organization, you are agreeing to these Terms for that organization and promising that you have the authority to bind that organization to these Terms.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph>
            GolfCompete is a platform that allows users to organize, participate in, and track golf competitions and events. Our services include but are not limited to:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                Creating and managing golf competitions and series
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Tracking scores and performance statistics
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Managing golf courses and tee sets
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Inviting and managing participants
              </Typography>
            </li>
          </ul>
          <Typography variant="body1" paragraph>
            We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the service.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            3. User Accounts
          </Typography>
          <Typography variant="body1" paragraph>
            To access certain features of the service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account.
          </Typography>
          <Typography variant="body1" paragraph>
            You must provide accurate, current, and complete information during the registration process and keep your account information updated. You may not use false or misleading information or impersonate another person or entity.
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to disable any user account at any time in our sole discretion for any or no reason, including if, in our opinion, you have violated any provision of these Terms.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            4. User Content
          </Typography>
          <Typography variant="body1" paragraph>
            Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the service, including its legality, reliability, and appropriateness.
          </Typography>
          <Typography variant="body1" paragraph>
            By posting Content on or through the service, you represent and warrant that:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                The Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                The posting of your Content on or through the service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.
              </Typography>
            </li>
          </ul>
          <Typography variant="body1" paragraph>
            We reserve the right to remove any Content from the service at any time without notice, for any reason, including but not limited to if we believe that such Content violates these Terms.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            5. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph>
            The service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of GolfCompete and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of GolfCompete.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            6. Prohibited Uses
          </Typography>
          <Typography variant="body1" paragraph>
            You agree not to use the service:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                In any way that violates any applicable federal, state, local, or international law or regulation.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                To impersonate or attempt to impersonate GolfCompete, a GolfCompete employee, another user, or any other person or entity.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the service, or which may harm GolfCompete or users of the service.
              </Typography>
            </li>
          </ul>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            7. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            In no event shall GolfCompete, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1" paragraph>
                Your access to or use of or inability to access or use the service;
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Any conduct or content of any third party on the service;
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Any content obtained from the service; and
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Unauthorized access, use or alteration of your transmissions or content.
              </Typography>
            </li>
          </ul>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            8. Disclaimer
          </Typography>
          <Typography variant="body1" paragraph>
            Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis. The service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
          </Typography>
          <Typography variant="body1" paragraph>
            GolfCompete does not warrant that the service will be uninterrupted, timely, secure, or error-free, or that defects will be corrected. We do not warrant that the results that may be obtained from the use of the service will be accurate or reliable.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            9. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            10. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </Typography>
          <Typography variant="body1" paragraph>
            By continuing to access or use our service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the service.
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            11. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about these Terms, please contact us at:
          </Typography>
          <Typography variant="body1" paragraph>
            Email: terms@golfcompete.com
          </Typography>
          <Typography variant="body1" paragraph>
            Or visit our Contact page for more information.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 