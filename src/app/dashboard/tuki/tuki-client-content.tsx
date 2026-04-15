'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { categoryDisplayNames, getFAQByCategory, searchFAQ } from '@/constants/category-faq'
import { toast } from '@/hooks/shared/use-toast'
import { AlertTriangle, CheckCircle, HelpCircle, Mail, MessageCircle, Phone, Search } from 'lucide-react'
import { useState } from 'react'
import { submitSupportRequest, type ContactFormData } from './actions'

export default function TukiClientContent() {
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'normal' as 'low' | 'normal' | 'high'
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [faqSearchQuery, setFaqSearchQuery] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await submitSupportRequest(contactForm as ContactFormData)

            if (result.success) {
                toast({
                    title: "Viesti lähetetty!",
                    description: `Tukipyyntösi on vastaanotettu (tiketti #${result.ticketId}). Vastaamme sinulle 24-48 tunnin kuluessa.`,
                })

                // Reset form
                setContactForm({
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                    priority: 'normal'
                })
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            toast({
                title: "Virhe viestin lähetyksessä",
                description: error instanceof Error ? error.message : "Yritä uudelleen tai ota yhteyttä suoraan sähköpostitse.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Get FAQs based on selection and search
    const getDisplayedFAQs = () => {
        if (faqSearchQuery.trim()) {
            return searchFAQ(faqSearchQuery);
        }
        if (selectedCategory) {
            return getFAQByCategory(selectedCategory);
        }
        // Default general FAQs
        const generalFAQ = [
            {
                question: "Miten voin muuttaa profiilitietojani?",
                answer: "Voit muokata profiilitietojasi navigoimalla Profiili-sivulle dashboard-valikosta. Klikkaa 'Muokkaa profiilia' -painiketta ja tallenna muutokset.",
                category: 'yleinen',
                priority: 8
            },
            {
                question: "Kuinka maksujärjestelmä toimii?",
                answer: "Maksut käsitellään turvallisesti Paytrail-palvelun kautta. Maksu veloitetaan kun tehtävä on merkitty valmiiksi ja hyväksytty. Tekijät voivat nostaa rahansa duunex-alustalta.",
                category: 'yleinen',
                priority: 9
            },
            {
                question: "Mitä teen jos tehtävässä on ongelma?",
                answer: "Jos tehtävässä ilmenee ongelmia, voit käyttää riita-toimintoa tehtävän sivulla. Tämä avaa kommunikaatiokanavan adminien kanssa ratkaisun löytämiseksi.",
                category: 'yleinen',
                priority: 8
            },
            {
                question: "Kuinka voin peruuttaa tehtävän?",
                answer: "Avoimia tehtäviä voi peruuttaa tehtävän sivulta. Jos tehtävä on jo hyväksytty ja maksettu, ota yhteyttä adminiin peruutuskäytännön selvittämiseksi.",
                category: 'yleinen',
                priority: 7
            },
            {
                question: "Milloin saan rahani tililleni?",
                answer: "Tekijät voivat nostaa ansaitsemansa rahat kun tehtävä on merkitty valmiiksi ja hyväksytty asiakkaan toimesta. Kotiutukset käsitellään 1-3 arkipäivän kuluessa.",
                category: 'yleinen',
                priority: 8
            },
            {
                question: "Kuinka arvostelujärjestelmä toimii?",
                answer: "Tehtävän valmistuttua asiakas voi antaa arvostelun tekijälle 1-5 tähteä asteikolla. Arvostelut auttavat muita käyttäjiä valitsemaan luotettavia tekijöitä.",
                category: 'yleinen',
                priority: 6
            },
            {
                question: "Voiko tehtävän aikataulua muuttaa?",
                answer: "Tehtävän aikataulua voi muuttaa jos molemmat osapuolet (asiakas ja tekijä) hyväksyvät muutoksen. Ota yhteyttä vastapuoleen viestien kautta.",
                category: 'yleinen',
                priority: 6
            },
            {
                question: "Mitä teen jos en saa vastauksia viesteihini?",
                answer: "Jos vastapuoli ei vastaa viesteihisi 48 tunnin kuluessa, voit ottaa yhteyttä adminiin tilanteen selvittämiseksi.",
                category: 'yleinen',
                priority: 7
            }
        ];
        return generalFAQ;
    };

    const displayedFAQs = getDisplayedFAQs();

    return (
        <div className="container max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Tuki ja apu</h1>
                <p className="text-gray-600">
                    Löydä vastauksia yleisiin kysymyksiin tai ota yhteyttä tukitiimiimme
                </p>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="text-center p-4">
                    <CardContent className="pt-4">
                        <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Sähköposti</h3>
                        <p className="text-sm text-gray-600 mb-2">tuki@duunex.fi</p>
                        <Badge variant="outline" className="text-xs">Vastaus 24h sisällä</Badge>
                    </CardContent>
                </Card>

                <Card className="text-center p-4">
                    <CardContent className="pt-4">
                        <MessageCircle className="h-8 w-8 text-sky-600 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Live-chat</h3>
                        <p className="text-sm text-gray-600 mb-2">Ma-Pe 9-17</p>
                        <Badge variant="outline" className="text-xs">Tulossa pian</Badge>
                    </CardContent>
                </Card>

                <Card className="text-center p-4">
                    <CardContent className="pt-4">
                        <Phone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Puhelin</h3>
                        <p className="text-sm text-gray-600 mb-2">+358 XX XXX XXXX</p>
                        <Badge variant="outline" className="text-xs">Tulossa pian</Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Enhanced FAQ Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        <CardTitle>Usein kysytyt kysymykset</CardTitle>
                    </div>
                    <CardDescription>
                        Löydä vastaukset kategoriakohtaisiin kysymyksiin
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* FAQ Search and Category Filter */}
                    <div className="space-y-3">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Etsi kysymyksiä..."
                                value={faqSearchQuery}
                                onChange={(e) => {
                                    setFaqSearchQuery(e.target.value)
                                    if (e.target.value) setSelectedCategory('')
                                }}
                                className="pl-10"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={!selectedCategory && !faqSearchQuery ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setSelectedCategory('')
                                    setFaqSearchQuery('')
                                }}
                            >
                                Kaikki
                            </Button>
                            {Object.entries(categoryDisplayNames).map(([slug, name]) => (
                                <Button
                                    key={slug}
                                    variant={selectedCategory === slug ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        setSelectedCategory(slug)
                                        setFaqSearchQuery('')
                                    }}
                                >
                                    {name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Results */}
                    <Accordion type="single" collapsible className="w-full">
                        {displayedFAQs.length > 0 ? (
                            displayedFAQs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span>{faq.question}</span>
                                            {faq.category !== 'yleinen' && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {categoryDisplayNames[faq.category] || faq.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-gray-600">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">Ei tuloksia</p>
                                <p className="text-sm">Kokeile eri hakutermiä tai valitse toinen kategoria</p>
                            </div>
                        )}
                    </Accordion>

                    {/* Category suggestion if searching */}
                    {faqSearchQuery && displayedFAQs.length === 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900 mb-1">Etkö löytänyt vastausta?</h4>
                                    <p className="text-sm text-blue-800 mb-2">
                                        Kokeile valita sopiva kategoria tai lähetä kysymyksesi suoraan meille.
                                    </p>
                                    <Button size="sm" variant="outline" onClick={() => setFaqSearchQuery('')}>
                                        Tyhjennä haku
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Ota yhteyttä adminiin</CardTitle>
                    <CardDescription>
                        Jos et löytänyt vastausta kysymykseesi, lähetä meille viesti
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nimi *</Label>
                                <Input
                                    id="name"
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Sähköposti *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Aihe *</Label>
                            <Input
                                id="subject"
                                value={contactForm.subject}
                                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                placeholder="Kerro lyhyesti mistä on kyse"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Kiireellisyys</Label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={contactForm.priority}
                                onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value as 'low' | 'normal' | 'high' })}
                            >
                                <option value="low">Matala - ei kiire</option>
                                <option value="normal">Normaali</option>
                                <option value="high">Korkea - kiireellinen</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Viesti *</Label>
                            <Textarea
                                id="message"
                                value={contactForm.message}
                                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                placeholder="Kerro ongelmastasi tai kysymyksestäsi mahdollisimman tarkasti..."
                                rows={5}
                                required
                            />
                        </div>

                        {contactForm.priority === 'high' && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Kiireelliset asiat käsitellään ensisijaisesti. Vastaamme sinulle 2-6 tunnin kuluessa.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full md:w-auto"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Lähetetään...' : 'Lähetä viesti'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Help Tips */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">Vinkkejä nopeampaan apuun</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Tarkista ensin FAQ-osio</li>
                                <li>• Liitä mukaan tehtävän ID jos kysymys koskee tiettyä tehtävää</li>
                                <li>• Ole mahdollisimman tarkka ongelman kuvauksessa</li>
                                <li>• Tarkista roskapostikansio jos et saa vastausta</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 