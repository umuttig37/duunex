'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { AlertCircle, Loader2, Save, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export default function UserEditModal({
  isOpen,
  onClose,
  user,
}: UserEditModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    city: user.city || '',
    bio: user.bio || '',
    role: user.role || 'user',
    is_verified: user.is_verified || false,
    suspended: user.suspended || false,
  });

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Update user profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          city: formData.city,
          bio: formData.bio,
          role: formData.role,
          is_verified: formData.is_verified,
          suspended: formData.suspended,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Virhe käyttäjän päivityksessä');
        return;
      }

      toast.success('Käyttäjätiedot päivitetty onnistuneesti');
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Odottamaton virhe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendToggle = () => {
    if (!formData.suspended) {
      // Suspending user - show confirmation
      setShowSuspendConfirm(true);
    } else {
      // Unsuspending user - do it directly
      setFormData((prev) => ({ ...prev, suspended: false }));
    }
  };

  const confirmSuspend = () => {
    setFormData((prev) => ({ ...prev, suspended: true }));
    setShowSuspendConfirm(false);
  };

  if (showSuspendConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Vahvista käyttäjän keskeytys
            </DialogTitle>
            <DialogDescription>
              Oletko varma, että haluat keskeyttää käyttäjän {user.first_name}{' '}
              {user.last_name}? Keskeytetty käyttäjä ei voi kirjautua sisään tai
              käyttää palvelua.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendConfirm(false)}
            >
              Peruuta
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSuspend}
              className="flex items-center gap-2"
            >
              <UserMinus className="h-4 w-4" />
              Keskeytä käyttäjä
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Muokkaa käyttäjää</DialogTitle>
          <DialogDescription>
            Muokkaa käyttäjän {user.first_name} {user.last_name} tietoja ja
            asetuksia.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Etunimi</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                placeholder="Etunimi"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Sukunimi</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                placeholder="Sukunimi"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Sähköposti</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="sähköposti@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_number">Puhelinnumero</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone_number: e.target.value,
                  }))
                }
                placeholder="+358 40 123 4567"
              />
            </div>
            <div>
              <Label htmlFor="city">Kaupunki</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="Helsinki"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Kuvaus</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Käyttäjän kuvaus..."
              rows={3}
            />
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="role">Rooli</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Valitse rooli" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Käyttäjä</SelectItem>
                  <SelectItem value="tasker">Taskeri</SelectItem>
                  <SelectItem value="admin">Ylläpitäjä</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="verified">Vahvistettu tili</Label>
                <div className="text-sm text-muted-foreground">
                  Vahvistettu käyttäjä voi käyttää kaikkia palvelun
                  ominaisuuksia
                </div>
              </div>
              <Switch
                id="verified"
                checked={formData.is_verified}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_verified: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="suspended" className="text-red-600">
                  {formData.suspended ? 'Keskeytetty tili' : 'Keskeytä tili'}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {formData.suspended
                    ? 'Käyttäjä on keskeytetty ja ei voi kirjautua sisään'
                    : 'Keskeytä käyttäjän pääsy palveluun'}
                </div>
              </div>
              <Switch
                id="suspended"
                checked={formData.suspended}
                onCheckedChange={handleSuspendToggle}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Peruuta
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tallennetaan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Tallenna muutokset
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
