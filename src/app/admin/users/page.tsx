'use client';

import UserEditModal from '@/components/features/admin/user-edit-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Search, UserCog, Copy } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'tasker':
      return 'default';
    case 'user':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getVerificationBadgeVariant = (isVerified: boolean) => {
  return isVerified ? 'default' : 'secondary';
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const supabase = createClient();

      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        setError('Virhe käyttäjien haussa');
        return;
      }

      setUsers(users || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Odottamaton virhe');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;

    const query = searchTerm.toLowerCase();
    return users.filter((user) =>
      user.id.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.city?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  }, [users, searchTerm]);

  // Copy ID to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Ladataan käyttäjiä...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  const userStats = {
    total: filteredUsers?.length || 0,
    admins: filteredUsers?.filter((u) => u.role === 'admin').length || 0,
    taskers: filteredUsers?.filter((u) => u.role === 'tasker').length || 0,
    regularUsers: filteredUsers?.filter((u) => u.role === 'user').length || 0,
    verified: filteredUsers?.filter((u) => u.is_verified).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Käyttäjät Yhteensä
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ylläpitäjät</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {userStats.admins}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taskerit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userStats.taskers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tavalliset Käyttäjät
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userStats.regularUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vahvistetut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {userStats.verified}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Käyttäjähallinta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hae käyttäjä ID:llä, nimellä, sähköpostilla tai roolilla..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600">
                Näytetään {filteredUsers.length} tulosta haulle "{searchTerm}"
              </p>
            )}
          </div>

          {filteredUsers && filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchTerm
                ? 'Ei käyttäjiä löytynyt hakuehdoilla.'
                : 'Ei käyttäjiä löytynyt.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nimi</TableHead>
                  <TableHead>Sähköposti</TableHead>
                  <TableHead>Rooli</TableHead>
                  <TableHead>Vahvistettu</TableHead>
                  <TableHead>Kaupunki</TableHead>
                  <TableHead>Rekisteröitynyt</TableHead>
                  <TableHead className="text-right">Toiminnot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {user.id.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(user.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="capitalize"
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getVerificationBadgeVariant(user.is_verified)}
                      >
                        {user.is_verified ? 'Vahvistettu' : 'Ei vahvistettu'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.city || '-'}</TableCell>
                    <TableCell>
                      {user.created_at
                        ? format(new Date(user.created_at), 'dd.MM.yyyy', {
                            locale: fi,
                          })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        Muokkaa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Edit Modal */}
      {selectedUser && (
        <UserEditModal
          isOpen={!!selectedUser}
          onClose={() => {
            setSelectedUser(null);
            fetchUsers(); // Refresh the list after editing
          }}
          user={selectedUser}
        />
      )}
    </div>
  );
}
