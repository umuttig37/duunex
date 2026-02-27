'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';

export default function YhteystiedotPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: 'Kiitos yhteydenotosta!',
          description: 'Otamme yhteyttä mahdollisimman pian.',
        });
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error('Virhe lähettäessä viestiä');
      }
    } catch (error) {
      toast({
        title: 'Virhe',
        description: 'Viestin lähettäminen epäonnistui. Yritä uudelleen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Yhteystiedot
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Olemme täällä auttamassa sinua. Ota yhteyttä tai jätä viesti, niin
              otamme yhteyttä mahdollisimman pian.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Ota Yhteyttä
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Sähköposti</p>
                      <p className="text-gray-600">info@tehtavamestari.fi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Puhelin</p>
                      <p className="text-gray-600">+358 40 123 4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Osoite</p>
                      <p className="text-gray-600">
                        Tehtäväkatu 1<br />
                        00100 Helsinki
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aukioloajat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Maanantai - Perjantai:</span>
                      <span>9:00 - 17:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lauantai:</span>
                      <span>10:00 - 15:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunnuntai:</span>
                      <span>Suljettu</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>TehtäväMestari</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Y-tunnus:</strong> 1234567-8
                  </p>
                  <p>
                    <strong>ALV-numero:</strong> FI12345678
                  </p>
                  <p>
                    TehtäväMestari on Suomessa toimiva palvelu, joka yhdistää
                    tehtävien tilaajat luotettaviin paikallisiin tekijöihin.
                    Tarjoamme turvallisen ja helppokäyttöisen alustan
                    monenlaisten tehtävien hoitamiseen.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Lähetä Viesti</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nimi *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Etunimi Sukunimi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Sähköposti *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="nimi@esimerkki.fi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Yritys (vapaaehtoinen)</Label>
                      <Input
                        id="company"
                        name="company"
                        type="text"
                        placeholder="Yrityksen nimi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Puhelin (vapaaehtoinen)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+358 40 123 4567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Aihe *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      placeholder="Miten voimme auttaa?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Viesti *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Kerro tarkemmin..."
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? 'Lähetetään...' : 'Lähetä Viesti'}
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