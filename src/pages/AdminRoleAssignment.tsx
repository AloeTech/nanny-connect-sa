import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserCheck, Shield, Search, Mail, Calendar, Filter, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  user_roles?: Array<{ role: string }>;
}

export default function AdminRoleAssignment() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles with their associated roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          created_at,
          first_name,
          last_name,
          user_roles (
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (profiles) {
        setUsers(profiles);
        setFilteredUsers(profiles);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userRole = user.user_roles?.[0]?.role;
        return roleFilter === 'no-role' ? !userRole : userRole === roleFilter;
      });
    }

    setFilteredUsers(filtered);
  };

  const assignRole = async (userId: string, role: 'nanny' | 'client' | 'admin') => {
    setAssigningRole(userId);
    
    try {
      // First, remove any existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Remove existing profile data
      await supabase.from('nannies').delete().eq('user_id', userId);
      await supabase.from('clients').delete().eq('user_id', userId);

      // Call the database function to assign new role
      const { error } = await supabase.rpc('assign_user_role', {
        _user_id: userId,
        _role: role
      });

      if (error) throw error;

      // Create the role-specific profile
      if (role === 'nanny') {
        await supabase
          .from('nannies')
          .insert([{
            user_id: userId,
            experience_type: 'nanny'
          }]);
      } else if (role === 'client') {
        await supabase
          .from('clients')
          .insert([{
            user_id: userId
          }]);
      }
      // Admin role doesn't need additional profile creation

      toast({
        title: "Success",
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} role assigned successfully`,
      });

      // Refresh the users list
      await fetchUsers();
      
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive"
      });
    } finally {
      setAssigningRole(null);
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'nanny': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'client': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    if (!role) return 'No Role';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (userRole !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          User Role Management
        </h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Total Users</h3>
              <p className="text-3xl font-bold">{users.length}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Filtered Users</h3>
              <p className="text-3xl font-bold">{filteredUsers.length}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Admins</h3>
              <p className="text-3xl font-bold">
                {users.filter(u => u.user_roles?.[0]?.role === 'admin').length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="nanny">Nannies</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                  <SelectItem value="no-role">No Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Click on role buttons to assign or change user roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'No users are registered yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Information</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Assign Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const currentRole = user.user_roles?.[0]?.role || null;
                    const fullName = user.first_name || user.last_name 
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : 'No name provided';

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-muted-foreground">{fullName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(user.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getRoleColor(currentRole)} font-medium`}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {getRoleDisplayName(currentRole)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => assignRole(user.id, 'nanny')}
                              disabled={assigningRole === user.id}
                              variant={currentRole === 'nanny' ? 'default' : 'outline'}
                              className={currentRole === 'nanny' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            >
                              {assigningRole === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Nanny'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => assignRole(user.id, 'client')}
                              disabled={assigningRole === user.id}
                              variant={currentRole === 'client' ? 'default' : 'outline'}
                              className={currentRole === 'client' ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                              {assigningRole === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Client'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => assignRole(user.id, 'admin')}
                              disabled={assigningRole === user.id}
                              variant={currentRole === 'admin' ? 'default' : 'outline'}
                              className={currentRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-600 border-purple-200 hover:bg-purple-50'}
                            >
                              {assigningRole === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Admin'
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const subject = `Regarding your account on Nanny Placements SA`;
                              window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}`;
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span>Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Nanny</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>Client</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <span>No Role</span>
          </div>
        </div>
        <p className="italic">Note: Assigning a new role will remove any existing role and associated profile data.</p>
      </div>
    </div>
  );
}