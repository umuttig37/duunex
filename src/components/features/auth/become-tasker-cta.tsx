"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Mock data for Finnish regions
const FINNISH_REGIONS = [
    { id: 'uusimaa', name: 'Uusimaa' },
    { id: 'varsinais-suomi', name: 'Varsinais-Suomi' },
    { id: 'satakunta', name: 'Satakunta' },
    { id: 'kanta-hame', name: 'Kanta-Häme' },
    { id: 'pirkanmaa', name: 'Pirkanmaa' },
    { id: 'paijat-hame', name: 'Päijät-Häme' },
    { id: 'kymenlaakso', name: 'Kymenlaakso' },
    { id: 'etelä-karjala', name: 'Etelä-Karjala' },
    { id: 'etelä-savo', name: 'Etelä-Savo' },
    { id: 'pohjois-savo', name: 'Pohjois-Savo' },
    { id: 'pohjois-karjala', name: 'Pohjois-Karjala' },
    { id: 'keski-suomi', name: 'Keski-Suomi' },
    { id: 'etelä-pohjanmaa', name: 'Etelä-Pohjanmaa' },
    { id: 'pohjanmaa', name: 'Pohjanmaa' },
    { id: 'keski-pohjanmaa', name: 'Keski-Pohjanmaa' },
    { id: 'pohjois-pohjanmaa', name: 'Pohjois-Pohjanmaa' },
    { id: 'kainuu', name: 'Kainuu' },
    { id: 'lappi', name: 'Lappi' },
    { id: 'ahvenanmaa', name: 'Ahvenanmaa' },
]

interface Category {
    id: string;
    name_fi: string;
    icon_url?: string | null;
}

export default function BecomeTaskerCTA() {
    const router = useRouter()
    const [selectedRegion, setSelectedRegion] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('id, name_fi, icon_url')
                    .order('name_fi')

                if (error) {
                    console.error('Error loading categories:', error)
                } else {
                    setCategories(data || [])
                }
            } catch (error) {
                console.error('Exception loading categories:', error)
            } finally {
                setLoading(false)
            }
        }

        loadCategories()
    }, [supabase])

    const handleStart = () => {
        if (selectedRegion && selectedCategory) {
            router.push(`/signup/tasker?region=${selectedRegion}&category=${selectedCategory}`)
        } else {
            // Basic validation feedback, consider using a toast notification
            alert('Valitse alue ja kategoria ensin.')
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-8 w-full max-w-5xl bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Left column: illustration */}
                <div className="hidden md:block relative h-80 md:h-auto">
                    <Image
                        src="/images/handyman.png"
                        alt="Klusserin kuvitus"
                        fill
                        className="object-cover"
                    />
                </div>
                {/* Right column: CTA form card */}
                <Card className="w-full p-6 md:p-8">
                    <CardHeader className="space-y-4">
                        <CardTitle className="text-3xl font-bold text-center">Ryhdy Tekijäksi</CardTitle>
                        <CardDescription className="text-center text-gray-600 text-lg">
                            Aloita matkasi Duunex-tekijänä valitsemalla toiminta-alueesi ja ensimmäinen palvelukategoriasi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div>
                            <Label htmlFor="region" className="text-base font-semibold text-gray-800 mb-2 block">Toiminta-alue</Label>
                            <Select onValueChange={setSelectedRegion} value={selectedRegion}>
                                <SelectTrigger id="region" className="w-full py-3">
                                    <SelectValue placeholder="Valitse alue" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FINNISH_REGIONS.map((region) => (
                                        <SelectItem key={region.id} value={region.id}>
                                            {region.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="category" className="text-base font-semibold text-gray-800 mb-2 block">Palvelukategoria</Label>
                            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                                <SelectTrigger id="category" className="w-full py-3">
                                    <SelectValue placeholder={loading ? "Ladataan kategorioita..." : "Valitse kategoria"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {loading ? (
                                        <SelectItem value="loading" disabled>
                                            Ladataan...
                                        </SelectItem>
                                    ) : (
                                        categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name_fi}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button onClick={handleStart} className="w-full bg-sky-600 hover:bg-sky-700 text-white py-4 text-lg">
                            Aloita
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
