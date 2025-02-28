'use client';

import { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';

// Define the form validation schema with Zod
const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' })
});

// TypeScript type for our form data
type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: ''
    }
  });

  // Handle form submission
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // In a real application, you would send this data to your backend
      // For now, we'll simulate a successful submission after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Form submitted:', data);
      setSubmitSuccess(true);
      reset(); // Reset form after successful submission
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle closing the success/error alerts
  const handleCloseAlert = () => {
    setSubmitSuccess(false);
    setSubmitError(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Contact Us
      </Typography>
      
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
          Have questions about GolfCompete? We'd love to hear from you!
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Your Name"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    InputProps={{
                      startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    fullWidth
                    required
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Your Message"
                    fullWidth
                    required
                    multiline
                    rows={6}
                    error={!!errors.message}
                    helperText={errors.message?.message}
                    InputProps={{
                      startAdornment: <MessageIcon color="action" sx={{ mr: 1, alignSelf: 'flex-start', mt: 2 }} />
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{ 
                  py: 1.5,
                  mt: 2,
                  fontWeight: 'bold'
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Send Message'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Other Ways to Reach Us
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Email Us Directly
              </Typography>
              <Typography variant="body1">
                For support inquiries: <strong>support@golfcompete.com</strong>
              </Typography>
              <Typography variant="body1">
                For partnership opportunities: <strong>partners@golfcompete.com</strong>
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Follow Us
              </Typography>
              <Typography variant="body1">
                Stay updated with our latest news and features by following us on social media.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="outlined" size="small">Twitter</Button>
                <Button variant="outlined" size="small">Facebook</Button>
                <Button variant="outlined" size="small">Instagram</Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Success message */}
      <Snackbar open={submitSuccess} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          Thank you for your message! We'll get back to you soon.
        </Alert>
      </Snackbar>
      
      {/* Error message */}
      <Snackbar open={submitError} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          There was an error sending your message. Please try again.
        </Alert>
      </Snackbar>
    </Container>
  );
} 