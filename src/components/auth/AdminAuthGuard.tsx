import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box, Typography } from '@mui/material';
import { supabaseClient } from '@/lib/auth';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/auth/login?returnUrl=/admin');
          return;
        }

        // Check if user is an admin
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile || !profile.is_admin) {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [router]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h5">Access Denied</Typography>
      </Box>
    );
  }

  return <>{children}</>;
} 