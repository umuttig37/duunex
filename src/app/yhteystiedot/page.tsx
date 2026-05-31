'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { ClipboardList, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const supportTopics = [
  'Tilin käyttö ja kirjautuminen',
  'Tehtävän julkaiseminen ja muokkaus',
  'Tekijäksi hakeminen',
  'Maksuihin tai viestintään liittyvät kysymykset',
];

export default function YhteystiedotPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Viestin lähettäminen epäonnistui');
      }

      toast({
        title: 'Kiitos yhteydenotosta',
        description: 'Viesti vastaanotettiin. Voit jatkaa palvelun käyttöä normaalisti.',
      });
      event.currentTarget.reset();
    } catch {
      toast({
        title: 'Viestiä ei voitu lähettää',
        description: 'Yritä hetken kuluttua uudelleen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50/40">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <div className="mb-3 inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-sm font-medium text-sky-800">
              Yhteystiedot ja tuki
            </div>
            <h1 className="mb-4 text-4xl font-semibold tracking-tight text-gray-900">Ota yhteyttä Duunexiin</h1>
            <p className="text-lg leading-relaxed text-gray-600">
              Käytä lomaketta, kun tarvitset apua palvelun käyttöön, tehtävän julkaisuun
              tai tekijäksi hakemiseen. Yhteydenotto kulkee tällä sivulla suoraan lomakkeen
              kautta, jotta tukipyynnöt päätyvät samaan käsittelyvirtaan.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-sky-700" />
                    Missä asioissa autamme?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  {supportTopics.map((topic) => (
                    <div key={topic} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-orange-400" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-sky-700" />
                    Mitä nopeammin saat vastauksen?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <p>Kerro tehtävän tai tilanteen tausta mahdollisimman tarkasti.</p>
                  <p>Lisää mahdollinen tehtävä-ID, jos asiasi liittyy olemassa olevaan toimeksiantoon.</p>
                  <p>Mainitse myös, koskeeko kysymys käyttäjätiliä vai tekijäprofiilia.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-sky-700" />
                    Mitä tietoja kannattaa välttää?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <p>Älä lähetä lomakkeella maksukortin tietoja, henkilötunnusta tai muuta arkaluonteista aineistoa.</p>
                  <p>Kuvaa ongelma sanallisesti ja lähetä tarvittaessa vain olennaiset tiedot.</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lähetä viesti</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Nimi *</Label>
                      <Input id="name" name="name" type="text" required placeholder="Etunimi Sukunimi" />
                    </div>
                    <div>
                      <Label htmlFor="email">Sähköposti *</Label>
                      <Input id="email" name="email" type="email" required placeholder="nimi@esimerkki.fi" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="company">Yritys (valinnainen)</Label>
                      <Input id="company" name="company" type="text" placeholder="Yrityksen nimi" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Puhelin (valinnainen)</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="+358 40 123 4567" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Aihe *</Label>
                    <Input id="subject" name="subject" type="text" required placeholder="Mitä asia koskee?" />
                  </div>

                  <div>
                    <Label htmlFor="message">Viesti *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={7}
                      placeholder="Kuvaa tilanteesi mahdollisimman selkeästi."
                      className="resize-none"
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90">
                    {isSubmitting ? 'Lähetetään...' : 'Lähetä viesti'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
