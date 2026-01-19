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

      // Create profile with consistent data
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email: values.email,
        role: 'user',
        first_name: values.firstName,
        last_name: values.lastName,
        phone_number: values.phoneNumber,
      }, { onConflict: 'id' });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        toast({
          title: 'Profiilin luonti epäonnistui',
          description: 'Rekisteröinti onnistui, mutta profiilin luonnissa tapahtui virhe.',
          variant: 'destructive',
        });
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
        setTimeout(() => {
          window.location.href = '/login?message=Vahvista ensin sähköpostisi rekisteröinnistä';
        }, 2000);
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
        {/* TODO: Add onClick handlers for social signup */}
        <Button variant="outline" className="w-full" disabled={isLoading} >
          {/* Placeholder icon */}
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1h-9.8v3.2h5.7q-.2 1.2-.9 2t-1.9 1.3v2.7h3.5q1.9-1.6 3-4.2t1.1-5.9Z" /><path fill="#34A853" d="M11.55 21.9q-2.8 0-5.1-1.7t-3.1-4.5H6v2.7q1.2 2.1 3.4 3.4t4.8 1.3q2.2 0 4.2-.9Z" /><path fill="#FBBC05" d="M6 15.7h0q-.2-.7-.2-1.4t.2-1.4V10H3q-.4 1.2-.4 2.5t.4 2.5l3-1.8Z" /><path fill="#EA4335" d="M11.55 6.2q2.1 0 3.8 1l2.8-2.7q-1.8-1.6-4.3-2.5T11.6 2.1q-3.8 0-6.8 2.2T1.2 9.3h4.9q.5-1.8 1.9-2.9t3.5-1.2Z" /></svg>
          Google
        </Button>
      </div>
    </>
  );
}
