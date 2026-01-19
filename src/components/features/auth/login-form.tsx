'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Virheellinen sähköpostiosoite.' }),
  password: z.string().min(1, { message: 'Salasana vaaditaan.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setIsLoading(false);
      toast({
        title: 'Kirjautuminen epäonnistui',
        description: error.message || 'Tarkista sähköpostiosoite ja salasana.',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is a tasker and if their application is pending
    const user = data.user;
    if (user) {
      // Fetch profile to get role and suspension status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, suspended')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Handle error fetching profile if necessary, though current logic proceeds
        console.error("Error fetching profile for role check:", profileError);
        setIsLoading(false);
        toast({
          title: 'Kirjautuminen epäonnistui',
          description: 'Käyttäjäprofiilia ei löydy. Ota yhteyttä tukeen.',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
        return;
      }

      // Check if user is suspended
      if (profile?.suspended) {
        setIsLoading(false);
        toast({
          title: 'Tili on keskeytetty',
          description: 'Tilisi on väliaikaisesti keskeytetty. Ota yhteyttä tukeen.',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
        return;
      }

      if (profile?.role === 'admin') {
        setIsLoading(false);
        toast({
          title: 'Kirjautuminen onnistui (Admin)',
          description: 'Sinut ohjataan pian hallintapaneeliin.',
        });
        router.push('/admin');
        return; // Important to return after admin redirect
      }

      if (profile?.role === 'tasker') {
        // Check tasker application status
        const { data: application, error: appError } = await supabase
          .from('tasker_applications')
          .select('status')
          .eq('profile_id', user.id)
          .single();
        if (!appError && application?.status === 'pending') {
          setIsLoading(false);
          toast({
            title: 'Hakemuksesi on käsittelyssä',
            description: 'Et voi kirjautua sisään ennen kuin hakemuksesi on hyväksytty.',
            variant: 'destructive',
          });
          // Optionally sign out the session
          await supabase.auth.signOut();
          return;
        }
      }
    }
    setIsLoading(false);
    toast({
      title: 'Kirjautuminen onnistui',
      description: 'Sinut ohjataan pian eteenpäin.',
    });

    // Handle redirection
    let intendedRedirectUrl = null;
    try {
      intendedRedirectUrl = localStorage.getItem('postLoginRedirect');
      if (intendedRedirectUrl) {
        console.log('LoginForm: Found postLoginRedirect in localStorage:', intendedRedirectUrl);
        localStorage.removeItem('postLoginRedirect'); // Clear it after use
      }
    } catch (error) {
      console.error("LoginForm: Error accessing localStorage", error);
    }

    if (intendedRedirectUrl) {
      router.push(intendedRedirectUrl);
    } else {
      // Default redirect for non-admin users if no other redirect is specified
      // This part is reached if user is not admin and no other redirect rule matched
      router.push('/dashboard');
    }
  }

  // TODO: Implement Social Login Handlers
  // async function handleSocialLogin(provider: 'google' | 'facebook' /* add more */) {
  //   setIsLoading(true);
  //   const { error } = await supabase.auth.signInWithOAuth({
  //     provider,
  //     options: {
  //       redirectTo: `${window.location.origin}/auth/callback`, // Your Supabase callback URL
  //     },
  //   });
  //   setIsLoading(false);
  //   if (error) {
  //      toast({
  //         title: 'Sosiaalinen kirjautuminen epäonnistui',
  //         description: error.message,
  //         variant: 'destructive',
  //      });
  //   }
  // }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sähköposti</FormLabel>
                <FormControl>
                  <Input placeholder="matti.meikalainen@esimerkki.fi" {...field} type="email" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salasana</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirjaudu Sisään
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Tai jatka käyttäen
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* TODO: Add onClick handlers for social login */}
        <Button variant="outline" className="w-full" disabled={isLoading} >
          {/* Placeholder icon */}
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1h-9.8v3.2h5.7q-.2 1.2-.9 2t-1.9 1.3v2.7h3.5q1.9-1.6 3-4.2t1.1-5.9Z" /><path fill="#34A853" d="M11.55 21.9q-2.8 0-5.1-1.7t-3.1-4.5H6v2.7q1.2 2.1 3.4 3.4t4.8 1.3q2.2 0 4.2-.9Z" /><path fill="#FBBC05" d="M6 15.7h0q-.2-.7-.2-1.4t.2-1.4V10H3q-.4 1.2-.4 2.5t.4 2.5l3-1.8Z" /><path fill="#EA4335" d="M11.55 6.2q2.1 0 3.8 1l2.8-2.7q-1.8-1.6-4.3-2.5T11.6 2.1q-3.8 0-6.8 2.2T1.2 9.3h4.9q.5-1.8 1.9-2.9t3.5-1.2Z" /></svg>
          Google
        </Button>
        {/* Add buttons for other providers like Facebook, Apple, etc. if needed */}
        {/* <Button variant="outline" className="w-full" disabled={isLoading} onClick={() => handleSocialLogin('facebook')}>Facebook</Button> */}
      </div>
    </>
  );
}
