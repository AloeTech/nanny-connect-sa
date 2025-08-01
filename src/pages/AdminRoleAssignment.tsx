import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  user_roles?: Array<{ role: string }>;
}

export default function AdminRoleAssignment() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningRole, setAssigningRole] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles with their associated roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          created_at,
          user_roles (
            role
          )
        `);

      if (profiles) {
        setUsers(profiles);
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

  const assignRole = async (userId: string, role: 'nanny' | 'client') => {
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
      const { data, error } = await supabase.rpc('assign_user_role', {
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

      toast({
        title: "Success",
        description: `${role} role assigned successfully`,
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
          User Role Assignment
        </h1>
        <p className="text-muted-foreground">Assign roles to registered users</p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const hasRole = user.user_roles && user.user_roles.length > 0;
          const currentRole = hasRole ? user.user_roles[0].role : null;

          return (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{user.email}</CardTitle>
                    <CardDescription>
                      Registered: {new Date(user.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasRole ? (
                      <Badge variant="default" className="capitalize">
                        <UserCheck className="h-3 w-3 mr-1" />
                        {currentRole}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        No Role
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    {hasRole ? 'Change role:' : 'Assign role:'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => assignRole(user.id, 'nanny')}
                      disabled={assigningRole === user.id || currentRole === 'nanny'}
                      variant={currentRole === 'nanny' ? 'default' : 'outline'}
                    >
                      {assigningRole === user.id ? 'Assigning...' : 'Nanny'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => assignRole(user.id, 'client')}
                      disabled={assigningRole === user.id || currentRole === 'client'}
                      variant={currentRole === 'client' ? 'default' : 'outline'}
                    >
                      {assigningRole === user.id ? 'Assigning...' : 'Client'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
            <p className="text-muted-foreground">No users are registered yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}