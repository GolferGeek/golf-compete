"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthService from '@/services/internal/AuthService';
import { supabaseClient } from '@/lib/auth';

// Create an instance of AuthService
const authService = new AuthService(supabaseClient);

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/admin';

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const response = await authService.getSession();
        if (response?.data?.session) {
          router.push(redirectTo);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        // Continue showing login page if there's an error
      }
    };
    
    checkSession();
  }, [router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await authService.signInWithEmail({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.session) {
        router.push(redirectTo);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box 
          component="form" 
          onSubmit={handleLogin} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3 
          }}
        >
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Golf Compete Admin Login
          </Typography>
          
          {error && (
            <Alert severity="error">{error}</Alert>
          )}
          
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large" 
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Log In'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    }>
      <LoginContent />
    </Suspense>
  );
}
