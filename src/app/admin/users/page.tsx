'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Box, 
  Paper, 
  useMediaQuery, 
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';
import { fetchAllUsers, User, fetchUserProfile, Profile } from '@/services/admin/userService';

type UserWithProfile = {
  user: User;
  profile: Profile | null;
};

export default function UsersManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const usersData = await fetchAllUsers();
        
        // Fetch profiles for each user
        const usersWithProfiles = await Promise.all(
          usersData.map(async (user) => {
            try {
              const profile = await fetchUserProfile(user.id);
              return { user, profile };
            } catch (error) {
              console.error(`Error fetching profile for user ${user.id}:`, error);
              return { user, profile: null };
            }
          })
        );
        
        setUsers(usersWithProfiles);
        setFilteredUsers(usersWithProfiles);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUsers();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(({ user, profile }) => 
        user.email.toLowerCase().includes(query) || 
        (profile?.first_name && profile.first_name.toLowerCase().includes(query)) ||
        (profile?.last_name && profile.last_name.toLowerCase().includes(query)) ||
        (profile?.display_name && profile.display_name.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
    setPage(0);
  }, [searchQuery, users]);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: 2
      }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
          }}
        >
          Users Management
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            href="/admin/users/new"
            fullWidth={isMobile}
            sx={{
              whiteSpace: 'nowrap'
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: { xs: 1, sm: 2 }, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search users by name or email"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClearSearch}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            variant="outlined"
            size="small"
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="users table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map(({ user, profile }) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {profile ? 
                              `${profile.first_name} ${profile.last_name}` : 
                              'No profile'}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.role ? (
                              <Chip 
                                label={user.role} 
                                color={user.role === 'admin' ? 'primary' : 'default'} 
                                size="small" 
                              />
                            ) : (
                              'User'
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              component={Link}
                              href={`/admin/users/${user.id}/edit`}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
} 