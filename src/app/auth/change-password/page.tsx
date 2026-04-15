'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Virhe',
        description: 'Täytä kaikki kentät',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Virhe',
        description: 'Uuden salasanan tulee olla vähintään 8 merkkiä pitkä',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Virhe',
        description: 'Salasanat eivät täsmää',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Onnistui!',
        description: 'Salasanasi on vaihdettu onnistuneesti',
      });

      // Get current user ID and redirect to their profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTimeout(() => {
          router.push(`/dashboard/profile/${user.id}?tab=settings`);
        }, 1500);
      } else {
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: 'Virhe',
        description: error.message || 'Salasanan vaihto epäonnistui',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50/40 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Takaisin
          </Link>
        </Button>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl">Vaihda salasana</CardTitle>
            </div>
            <CardDescription>
              Anna uusi vahva salasana tilillesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Uusi salasana</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="border-slate-300"
                />
                <p className="text-xs text-slate-500">
                  Vähintään 8 merkkiä pitkä
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Vahvista uusi salasana</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="border-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white"
                >
                  {isSubmitting ? 'Vaihdetaan...' : 'Vaihda salasana'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={isSubmitting}
                >
                  <Link href="/dashboard">Peruuta</Link>
                </Button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-700">
                <strong>Vinkki:</strong> Käytä vahvaa salasanaa, joka sisältää
                isoja ja pieniä kirjaimia, numeroita ja erikoismerkkejä.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
