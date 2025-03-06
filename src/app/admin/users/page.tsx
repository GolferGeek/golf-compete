'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';
import { fetchAllUsers, User } from '@/services/admin/userService';

type UserWithProfile = User;  // Since User already includes profile

export default function UsersManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        const usersData = await fetchAllUsers();
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error: any) {
        console.error('Error loading users:', error);
        setError(error.message || 'Failed to load users. Please try again later.');
        setUsers([]);
        setFilteredUsers([]);
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
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(query) || 
        (user.profile?.first_name && user.profile.first_name.toLowerCase().includes(query)) ||
        (user.profile?.last_name && user.profile.last_name.toLowerCase().includes(query)) ||
        (user.profile?.display_name && user.profile.display_name.toLowerCase().includes(query))
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

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'primary';
      case 'moderator':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: 2
      }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            fontWeight: 'bold'
          }}
        >
          Users Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/users/new"
          fullWidth={isMobile}
          sx={{
            whiteSpace: 'nowrap',
            height: 40
          }}
        >
          Add User
        </Button>
      </Box>
      
      {/* Search and Content */}
      <Paper 
        elevation={2}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 2
        }}
      >
        {error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search users by name or email"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper
                  }
                }}
              />
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Desktop View */}
                {!isMobile && (
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
                              <Box sx={{ py: 3 }}>
                                <Typography color="text.secondary">
                                  No users found
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map(user => (
                              <TableRow 
                                key={user.id}
                                hover
                                sx={{
                                  '&:last-child td, &:last-child th': { border: 0 }
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: theme.palette.primary.light, width: 32, height: 32 }}>
                                      {getInitials(user.profile?.first_name, user.profile?.last_name)}
                                    </Avatar>
                                    <Typography>
                                      {user.profile ? 
                                        `${user.profile.first_name} ${user.profile.last_name}` : 
                                        'No profile'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={user.profile?.role || 'User'} 
                                    color={getRoleColor(user.profile?.role)} 
                                    size="small"
                                    sx={{ minWidth: 80 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {new Date(user.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton
                                    component={Link}
                                    href={`/admin/users/${user.id}/edit`}
                                    size="small"
                                    color="primary"
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
                )}

                {/* Mobile View */}
                {isMobile && (
                  <Grid container spacing={2}>
                    {filteredUsers.length === 0 ? (
                      <Grid item xs={12}>
                        <Box sx={{ 
                          py: 4, 
                          textAlign: 'center',
                          color: 'text.secondary'
                        }}>
                          <PersonIcon sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
                          <Typography>No users found</Typography>
                        </Box>
                      </Grid>
                    ) : (
                      filteredUsers
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(user => (
                          <Grid item xs={12} key={user.id}>
                            <Card>
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                  <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                                    {getInitials(user.profile?.first_name, user.profile?.last_name)}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" component="div">
                                      {user.profile ? 
                                        `${user.profile.first_name} ${user.profile.last_name}` : 
                                        'No profile'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {user.email}
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    component={Link}
                                    href={`/admin/users/${user.id}/edit`}
                                    size="small"
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                <Divider />
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Chip 
                                    label={user.profile?.role || 'User'} 
                                    color={getRoleColor(user.profile?.role)} 
                                    size="small"
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    Created: {new Date(user.created_at).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))
                    )}
                  </Grid>
                )}

                {filteredUsers.length > 0 && (
                  <TablePagination
                    component="div"
                    count={filteredUsers.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    sx={{ mt: 2 }}
                  />
                )}
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
} 