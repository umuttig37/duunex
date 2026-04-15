'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/shared/use-toast';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const bankAccountSchema = z.object({
  account_holder_name: z.string().min(2, 'Tilinomistajan nimi on pakollinen'),
  iban: z.string()
    .transform((val) => val.replace(/\s+/g, '').toUpperCase()) // Remove spaces first
    .refine((val) => val.length >= 15, 'IBAN-tilinumero on liian lyhyt')
    .refine((val) => val.length <= 34, 'IBAN-tilinumero on liian pitkä')
    .refine((val) => /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(val), 'IBAN virheellinen'),
  bic: z.string()
    .transform((val) => val.replace(/\s+/g, '').toUpperCase()) // Remove spaces first
    .refine((val) => val.length >= 8, 'BIC/SWIFT-koodi on liian lyhyt')
    .refine((val) => val.length <= 11, 'BIC/SWIFT-koodi on liian pitkä')
    .refine((val) => /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(val), 'BIC/SWIFT virheellinen'),
  bank_name: z.string().optional(),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface BankAccountSettingsProps {
  userId: string;
}

export default function BankAccountSettings({ userId }: BankAccountSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [existingAccount, setExistingAccount] = useState<any>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      account_holder_name: '',
      iban: '',
      bic: '',
      bank_name: '',
    },
  });

  useEffect(() => {
    fetchBankAccountInfo();
  }, [userId]);

  const fetchBankAccountInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_account_info')
        .select('*')
        .eq('tasker_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bank account info:', error);
        return;
      }

      if (data) {
        setExistingAccount(data);
        form.reset({
          account_holder_name: data.account_holder_name || '',
          iban: data.iban || '',
          bic: data.bic || '',
          bank_name: data.bank_name || '',
        });
      }
    } catch (error) {
      console.error('Error fetching bank account info:', error);
    }
  };

  const onSubmit = async (data: BankAccountFormData) => {
    setIsLoading(true);
    try {
      const bankAccountData = {
        tasker_id: userId,
        account_holder_name: data.account_holder_name,
        iban: data.iban, // Already cleaned and uppercase by Zod transform
        bic: data.bic, // Already cleaned and uppercase by Zod transform
        bank_name: data.bank_name || null,
        is_verified: true, // No admin verification needed
        updated_at: new Date().toISOString(),
      };

      if (existingAccount) {
        // Update existing record
        const { error } = await supabase
          .from('bank_account_info')
          .update(bankAccountData)
          .eq('tasker_id', userId);

        if (error) throw error;

        toast({
          title: "Pankkitiedot päivitetty",
          description: "Pankkitilitietosi on päivitetty onnistuneesti. Voit nyt tehdä nostopyyntöjä.",
        });
      } else {
        // Create new record
        const { error } = await supabase
          .from('bank_account_info')
          .insert(bankAccountData);

        if (error) throw error;

        toast({
          title: "Pankkitiedot tallennettu",
          description: "Pankkitilitietosi on tallennettu onnistuneesti. Voit nyt tehdä nostopyyntöjä.",
        });
      }

      await fetchBankAccountInfo();
    } catch (error: any) {
      console.error('Error saving bank account info:', error);
      toast({
        title: "Virhe",
        description: "Pankkitilitietojen tallentaminen epäonnistui. Yritä uudelleen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatIban = (value: string) => {
    // Remove spaces and convert to uppercase
    const cleaned = value.replace(/\s+/g, '').toUpperCase();
    // Add spaces every 4 characters for readability
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatBic = (value: string) => {
    return value.replace(/\s+/g, '').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pankkitilitiedot
        </CardTitle>
        <CardDescription>
          Lisää pankkitilitietosi nostaaksesi ansaitsemasi rahat. Voit tehdä nostopyyntöjä heti tietojen tallentamisen jälkeen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {existingAccount && (
          <div className="mb-4 p-3 rounded-lg border bg-sky-50 border-sky-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-medium text-sky-800">
                Pankkitiedot tallennettu
              </span>
            </div>
            <p className="text-xs mt-1 text-sky-700">
              Voit nyt tehdä nostopyyntöjä. Admin ottaa yhteyttä jos rahansiirto epäonnistuu.
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="account_holder_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tilinomistajan nimi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Etunimi Sukunimi"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Nimi täsmälleen kuten pankkitilillä
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN-tilinumero</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FI21 1234 5600 0007 85"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatIban(e.target.value);
                        field.onChange(formatted);
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Kansainvälinen tilinumero (IBAN)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BIC/SWIFT-koodi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="NDEAFIHH"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatBic(e.target.value);
                        field.onChange(formatted);
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Pankin tunniste (BIC tai SWIFT-koodi)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pankin nimi (valinnainen)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nordea Pankki Oyj"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Pankin virallinen nimi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Tallennetaan...' : existingAccount ? 'Päivitä tiedot' : 'Tallenna tiedot'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Tietoturvasta</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Pankkitietosi salataan ja tallennetaan turvallisesti</li>
            <li>• Voit tehdä nostopyyntöjä heti tietojen tallentamisen jälkeen</li>
            <li>• Voit muuttaa tietojasi milloin tahansa</li>
            <li>• Admin ottaa yhteyttä jos rahansiirto epäonnistuu</li>
            <li>• Tietoja käytetään vain rahansiirtoihin</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 