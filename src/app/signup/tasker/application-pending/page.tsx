import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function TaskerApplicationPendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kiitos hakemuksestasi!
          </h1>
          <p className="text-lg text-gray-600">
            Tekijähakemuksesi on lähetetty onnistuneesti
          </p>
        </div>

        {/* Status Card */}
        <Card className="border-primary/20 bg-primary/5/50">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-3">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <CardTitle className="text-primary">Hakemus käsiteltävänä</CardTitle>
            <CardDescription className="text-primary">
              Tarkistamme hakemuksesi huolellisesti varmistaaksemme, että tarjoamme asiakkaillemme parasta mahdollista palvelua.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Seuraavat vaiheet:</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Käsittely:</span> Tarkistamme hakemuksesi 1-2 arkipäivässä
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Hyväksyntä:</span> Saat sähköpostiviestin, kun hakemus on hyväksytty
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Aloitus:</span> Voit alkaa vastaanottaa tehtäviä heti hyväksynnän jälkeen
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Sähköposti vahvistus</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Lähetimme vahvistussähköpostin osoitteeseesi. Tarkista myös roskapostikansio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Kysymyksiä?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Jos sinulla on kysymyksiä hakemuksestasi, ota meihin yhteyttä tukikanavan kautta.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button asChild className="flex-1">
            <Link href="/">
              Takaisin etusivulle
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/signup">
              Kirjaudu sisään
            </Link>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Käsittelyajan päätyttyä saat sähköpostiviestin tuloksesta.{" "}
            <br className="hidden sm:inline" />
            Kiitos kärsivällisyydestäsi!
          </p>
        </div>
      </div>
    </div>
  );
}