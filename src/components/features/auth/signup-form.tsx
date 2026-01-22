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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const signUpSchema = z.object({
  firstName: z.string().min(2, { message: 'Etunimi vaaditaan (vähintään 2 merkkiä).' }),
  lastName: z.string().min(2, { message: 'Sukunimi vaaditaan (vähintään 2 merkkiä).' }),
  phoneNumber: z.string().min(6, { message: 'Puhelinnumero vaaditaan.' }),
  email: z.string().email({ message: 'Virheellinen sähköpostiosoite.' }),
  password: z.string().min(8, { message: 'Salasanan tulee olla vähintään 8 merkkiä pitkä.' }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      password: '',
    },
  });

  async function handleGoogleSignup() {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      setIsLoading(false);
      toast({
        title: 'Google-rekisteröinti epäonnistui',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);

    try {
      // Register user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            phone_number: values.phoneNumber,
            role: 'user',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: 'Rekisteröinti epäonnistui',
          description: error.message || 'Tapahtui odottamaton virhe.',
          variant: 'destructive',
        });
        return;
      }

      if (data.user && data.user.identities?.length === 0) {
        toast({
          title: 'Sähköpostin vahvistus vaaditaan',
          description: 'Tarkista sähköpostisi vahvistaaksesi tilisi. Sähköposti saattaa olla jo käytössä.',
          variant: 'default',
        });
        return;
      }

      if (!data.user) {
        toast({
          title: 'Rekisteröinti epäonnistui',
          description: 'Tapahtui odottamaton virhe.',
          variant: 'destructive',
        });
        return;
      }

      // Create profile with consistent data and get it back
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          email: values.email,
          role: 'user',
          first_name: values.firstName,
          last_name: values.lastName,
          phone_number: values.phoneNumber,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        toast({
          title: 'Profiili ei luotu',
          description: 'Tili luotu, mutta profiilin luonti epäonnistui.',
          variant: 'destructive',
        });
      } else {
        console.log("Profile created successfully:", profileData);
      }

      if (data.user.email_confirmed_at) {
        toast({
          title: 'Rekisteröinti onnistui!',
          description: 'Sinut on kirjattu sisään automaattisesti.',
        });
        // User is already logged in, redirect to intended page or dashboard
        let intendedRedirectUrl = null;
        try {
          intendedRedirectUrl = localStorage.getItem('postLoginRedirect');
          if (intendedRedirectUrl) {
            console.log('SignUpForm: Found postLoginRedirect in localStorage:', intendedRedirectUrl);
            localStorage.removeItem('postLoginRedirect');
          }
        } catch (error) {
          console.error("SignUpForm: Error accessing localStorage", error);
        }

        // Use Next.js router to redirect
        setTimeout(() => {
          if (intendedRedirectUrl) {
            router.push(intendedRedirectUrl);
          } else {
            router.push('/dashboard');
          }
        }, 1000);
      } else {
        toast({
          title: 'Melkein valmista!',
          description: 'Vahvista sähköpostiosoitteesi klikkaamalla lähettämäämme linkkiä. Sen jälkeen voit kirjautua sisään.',
        });
        // Optionally redirect to login page with message
        // setTimeout(() => {
        //   window.location.href = '/login?message=Vahvista ensin sähköpostisi rekisteröinnistä';
        // }, 2000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast({
        title: 'Rekisteröinti epäonnistui',
        description: 'Tapahtui odottamaton virhe. Yritä uudelleen.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etunimi</FormLabel>
                <FormControl>
                  <Input placeholder="Matti" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sukunimi</FormLabel>
                <FormControl>
                  <Input placeholder="Meikäläinen" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Puhelinnumero</FormLabel>
                <FormControl>
                  <Input placeholder="0401234567" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <Input type="password" placeholder="Vähintään 8 merkkiä" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rekisteröidy
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Tai rekisteröidy käyttäen
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button 
          variant="outline" 
          className="w-full" 
          disabled={isLoading}
          onClick={handleGoogleSignup}
          type="button"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>
      </div>
    </>
  );
}
