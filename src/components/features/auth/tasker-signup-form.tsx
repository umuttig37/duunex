"use client"


import { categoryIconMap } from "@/constants/categories-with-icons"
import { createClient } from '@/lib/supabase/client'
import PlacesInput from "@/components/ui/places-input"
import { Briefcase, Check, ChevronLeft, ChevronRight, Clock, Euro, FileText, MapPin, Upload, User } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState, type ChangeEvent } from "react"

// Import the new reusable component and its type
import { AvailabilityPicker, type AvailabilitySlot } from "@/components/ui/availability-picker"
import { Button } from '@/components/ui/button'

// Dynamic categories from database
interface Category { id: string; name_fi: string; icon_url: string | null }

// Allow next/image only for absolute URLs (http/https) or "/"-alkuiset polut
const isValidNextImageSrc = (src: string | null | undefined): src is string => {
  if (!src) return false
  return src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://')
}

const supabase = createClient()

// Address autocomplete now uses Nominatim (OpenStreetMap) via PlacesInput component

// Form steps
const STEPS = [
  { id: 1, title: "Yhteystiedot", icon: <User className="h-5 w-5" /> },
  { id: 2, title: "Sijainti", icon: <MapPin className="h-5 w-5" /> },
  { id: 3, title: "Hinnoittelu", icon: <Euro className="h-5 w-5" /> },
  { id: 4, title: "Kategoriat", icon: <Briefcase className="h-5 w-5" /> },
  { id: 5, title: "Profiilikuva", icon: <User className="h-5 w-5" /> },
  { id: 6, title: "Portfolio", icon: <Upload className="h-5 w-5" /> },
  { id: 7, title: "Bio", icon: <FileText className="h-5 w-5" /> },
  { id: 8, title: "Saatavuus", icon: <Clock className="h-5 w-5" /> },
  { id: 9, title: "Yhteenveto", icon: <Check className="h-5 w-5" /> },
]

interface TaskerSignupFormProps {
  initialCategoryId?: string
  initialRegionId?: string
}

export default function TaskerOnboardingForm({ initialCategoryId, initialRegionId }: TaskerSignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const LOCAL_STORAGE_KEY = 'tasker-onboarding-form'

  useEffect(() => {
    async function init() {
      // Load autosaved form
      try {
        const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (savedRaw) {
          const saved = JSON.parse(savedRaw)
          if (saved && typeof saved === 'object') {
            setFormData((prev) => ({ ...prev, ...saved.formData }))
            if (typeof saved.currentStep === 'number') {
              setCurrentStep(saved.currentStep)
            }
          }
        }
      } catch (e) {
        console.warn('Autosave load failed', e)
      }

      // Detect existing user
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        setCurrentUserId(userData.user.id)
        const meta = userData.user.user_metadata as Record<string, unknown> | undefined
        setFormData((prev) => ({
          ...prev,
          email: (userData.user.email as string) || prev.email,
          firstName: (meta?.first_name as string) || prev.firstName,
          lastName: (meta?.last_name as string) || prev.lastName,
          phone: (meta?.phone_number as string) || prev.phone,
        }))
      }

      // Load categories
      const { data } = await supabase.from('categories').select('id, name_fi, icon_url')
      if (data) setCategoriesList(data)

      setHasInitialized(true)
    }
    init()
  }, [])

  interface FormDataShape {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    city: string;
    zipcode: string;
    latitude: number | null;
    longitude: number | null;
    serviceRadius: number; // km
    hourlyRate: number; // €
    categories: string[];
    bio: string;
    profilePicture: File | null;
    profilePicturePreview: string | null;
    portfolioFiles: File[];
    portfolioPreviews: string[];
    availability: AvailabilitySlot[];
  }

  const [formData, setFormData] = useState<FormDataShape>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    zipcode: '',
    latitude: null,
    longitude: null,
    serviceRadius: 25,
    hourlyRate: 0,
    categories: initialCategoryId ? [initialCategoryId] : [],
    bio: '',
    profilePicture: null,
    profilePicturePreview: null,
    portfolioFiles: [],
    portfolioPreviews: [],
    availability: [],
  })

  // Cleanup object URLs when component unmounts or data changes
  useEffect(() => {
    return () => {
      // Clean up profile picture preview
      if (formData.profilePicturePreview) {
        URL.revokeObjectURL(formData.profilePicturePreview);
      }
      // Clean up portfolio previews
      formData.portfolioPreviews.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [formData.profilePicturePreview, formData.portfolioPreviews]);

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvailabilityChange = (newAvailability: AvailabilitySlot[]) => {
    setFormData(prev => ({ ...prev, availability: newAvailability }))
  }

  // Autosave
  useEffect(() => {
    if (!hasInitialized) return
    try {
      const payload = { formData, currentStep }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
    } catch (e) {
      console.warn('Autosave failed', e)
    }
  }, [formData, currentStep, hasInitialized])

  // Apply initial category once categories are loaded
  useEffect(() => {
    if (!hasInitialized) return
    if (!initialCategoryId) return
    if (!categoriesList.length) return
    setFormData((prev) => {
      const cats = prev.categories || []
      if (cats.includes(initialCategoryId)) return prev
      return { ...prev, categories: [...cats, initialCategoryId] }
    })
  }, [initialCategoryId, categoriesList, hasInitialized])

  // Legacy migration for previously saved autosave shapes
  useEffect(() => {
    if (!hasInitialized) return
    setFormData(prev => {
      const next: FormDataShape = { ...prev }
      const legacySelected = (prev as any).selectedCategories
      if (!next.categories?.length && Array.isArray(legacySelected)) {
        next.categories = legacySelected
      }
      const legacyLoc = (prev as any).location
      if (legacyLoc && typeof legacyLoc === 'object') {
        if (!next.address && legacyLoc.address) next.address = legacyLoc.address
        if (next.latitude == null && legacyLoc.lat != null) next.latitude = legacyLoc.lat
        if (next.longitude == null && legacyLoc.lng != null) next.longitude = legacyLoc.lng
        if (!next.city && legacyLoc.city) next.city = legacyLoc.city
        if (!next.zipcode && legacyLoc.zipcode) next.zipcode = legacyLoc.zipcode
      }
      if (typeof (prev as any).availability === 'string') {
        try {
          const parsed = JSON.parse((prev as any).availability)
          if (Array.isArray(parsed)) next.availability = parsed
        } catch { }
      }
      return next
    })
  }, [hasInitialized])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'hourlyRate' || name === 'serviceRadius') {
      setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleNumberInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }))
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => {
      const categories = [...prev.categories]
      const idx = categories.indexOf(categoryId)
      if (idx > -1) categories.splice(idx, 1)
      else categories.push(categoryId)
      return { ...prev, categories }
    })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
        profilePicturePreview: URL.createObjectURL(file),
      }))
    }
  }

  const handlePortfolioFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return
    const previews = files.map((f) => URL.createObjectURL(f))
    setFormData((prev) => ({
      ...prev,
      portfolioFiles: [...prev.portfolioFiles, ...files],
      portfolioPreviews: [...prev.portfolioPreviews, ...previews],
    }))
  }

  const handleAddressSelected = (details: {
    address: string;
    lat: number | null;
    lng: number | null;
    city?: string;
    zipcode?: string;
  }) => {
    console.log("Selected address details:", details);
    setFormData(prev => ({
      ...prev,
      address: details.address,
      latitude: details.lat,
      longitude: details.lng,
      city: details.city || '',
      zipcode: details.zipcode || '',
    }));
  };

  // Handle address selection from PlacesInput (Nominatim)
  const handlePlacesInputChange = (value: string, coordinates?: { lat: number; lng: number }) => {
    if (coordinates) {
      // Address selected with coordinates
      handleAddressSelected({
        address: value,
        lat: coordinates.lat,
        lng: coordinates.lng,
        city: "Ei määritetty", // Nominatim doesn't parse these separately
        zipcode: "Ei määritetty",
      });
    } else {
      // Just text input, no coordinates yet
      setFormData(prev => ({ ...prev, address: value }));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleStepClick = (targetStep: number) => {
    // Only allow navigation to previous steps or current step
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep);
      window.scrollTo(0, 0);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    if (currentStep !== STEPS.length) {
      alert("Viimeistele kaikki vaiheet ennen lähettämistä.");
      return;
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      city,
      zipcode,
      profilePicture,
      bio,
      latitude,
      longitude,
    } = formData;

    if (!currentUserId && !password) {
      alert("Salasana vaaditaan.");
      return;
    }
    let userId = currentUserId
    if (!userId) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
            role: "tasker",
          },
        },
      });

      if (signUpError || !signUpData.user) {
        alert("Rekisteröinti epäonnistui: " + (signUpError?.message || "Tuntematon virhe"));
        return;
      }
      userId = signUpData.user.id;
    }

    let avatarUrl = null;
    if (profilePicture) {
      const fileExt = profilePicture.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profilePicture);

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        alert("Profiilikuvan lataus epäonnistui: " + uploadError.message + "\nYritä päivittää se profiilistasi myöhemmin.");
      } else {
        const { data: publicURLData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = publicURLData?.publicUrl || null;
      }
    }

    // Upload portfolio images (optional)
    let portfolioPublicUrls: string[] = []
    if (formData.portfolioFiles && formData.portfolioFiles.length > 0) {
      const uploadedUrls: string[] = []
      for (const file of formData.portfolioFiles) {
        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
          const filePath = `${userId}/${fileName}`
          const { error: uploadErr } = await supabase.storage
            .from('tasker-portfolio')
            .upload(filePath, file)
          if (uploadErr) {
            console.error('Portfolio upload error:', uploadErr)
            continue
          }
          const { data: pub } = supabase.storage.from('tasker-portfolio').getPublicUrl(filePath)
          if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl)
        } catch (err) {
          console.error('Portfolio upload exception:', err)
        }
      }
      portfolioPublicUrls = uploadedUrls
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email,
      role: "tasker",
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      address,
      city,
      zipcode,
      bio: bio,
      avatar_url: avatarUrl,
      is_verified: false,
    }, { onConflict: 'id' });

    if (profileError) {
      alert("Profiilin luominen epäonnistui: " + profileError.message);
      return;
    }

    if (latitude && longitude) {
      console.log(`Calling RPC add_tasker_details for user ${userId}`);
      const { error: rpcError } = await supabase.rpc('add_tasker_details', {
        p_profile_id: userId,
        p_longitude: longitude,
        p_latitude: latitude,
        p_hourly_rate: formData.hourlyRate,
        p_service_radius_meters: formData.serviceRadius * 1000,
        p_availability_schedule: JSON.stringify(formData.availability)
      });

      if (rpcError) {
        console.error("RPC add_tasker_details error:", rpcError);
        alert("Tekijän lisätietojen tallennus epäonnistui (RPC): " + rpcError.message);
      }
    } else {
      console.warn("Latitude/Longitude missing, skipping tasker_details location insert via RPC.");
    }

    const { error: appError } = await supabase.from("tasker_applications").insert({
      profile_id: userId,
      status: "pending",
    });

    if (appError) {
      alert("Tekijähakemuksen luominen epäonnistui: " + appError.message + "\nOta yhteyttä tukeen. Tarkista RLS-käytännöt tasker_applications-taulussa.");
      return;
    }

    // Save selected categories - this is critical for tasker visibility
    if (formData.categories.length > 0) {
      console.log('Saving selected categories:', formData.categories);
      const categoryRows = formData.categories.map((categoryId) => ({
        profile_id: userId,
        category_id: categoryId,
      }));

      const { error: catError } = await supabase.from('tasker_categories').insert(categoryRows);
      if (catError) {
        console.error('Category insertion failed:', catError);
        alert('Valittujen kategorioiden tallennus epäonnistui: ' + catError.message + '\n\nTämä on kriittinen virhe - kategoriat vaaditaan taskerin näkyvyyteen. Yritä uudelleen tai ota yhteyttä tukeen.');
        return; // Don't proceed if categories fail to save
      } else {
        console.log('Categories saved successfully');
      }
    } else {
      alert('Valitse vähintään yksi kategoria ennen jatkamista.');
      return;
    }

    // Clear autosave on success and redirect
    try { localStorage.removeItem(LOCAL_STORAGE_KEY) } catch { }
    window.location.href = '/signup/tasker/application-pending';
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Etunimi *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Sukunimi *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Sähköpostiosoite *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Puhelinnumero *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Salasana *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
                required
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="addressInput" className="block text-sm font-medium text-gray-700 mb-1">
                Syötä osoitteesi *
              </label>
              <PlacesInput
                value={formData.address}
                onChange={handlePlacesInputChange}
                placeholder="Esim. Mannerheimintie 1, Helsinki"
              />
            </div>

            {formData.address && (
              <div className="mt-2 p-3 text-sm bg-gray-100 rounded-md border border-gray-200">
                <p className="font-medium">Valittu osoite:</p>
                <p>{formData.address || "(Osoitetta ei valittu)"}</p>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-gray-600">
                    (Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)})
                  </p>
                )}
              </div>
            )}
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Osoitettasi ei jaeta julkisesti. Käytämme näitä tietoja yhdistääksemme sinut alueesi tehtäviin.
              </p>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Tuntihintasi (€) *
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input
                    type="number"
                    id="hourlyRate"
                    name="hourlyRate"
                    min={10}
                    max={150}
                    value={formData.hourlyRate}
                    onChange={handleNumberInputChange}
                    className="block w-full rounded-md border-gray-300 pl-9 pr-12 focus:border-sky-500 focus:ring-sky-500 border py-2 px-3 focus:outline-none focus:ring-2"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="serviceRadius" className="block text-sm font-medium text-gray-700 mb-1">
                  Palvelusäde (km) *
                </label>
                <div className="flex items-center gap-3 py-3">
                  <input
                    type="range"
                    id="serviceRadius"
                    name="serviceRadius"
                    min={1}
                    max={200}
                    value={formData.serviceRadius}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serviceRadius: Number(e.target.value) }))}
                    className="flex-1 h-2 rounded-lg appearance-none bg-gray-200 accent-sky-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 tabular-nums min-w-[3rem]">
                    {formData.serviceRadius} km
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                    <Euro className="h-6 w-6 text-sky-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Kilpailukykyiset hinnat</h3>
                    <p className="text-sm text-gray-500">Aseta omat hintasi ja ansaitse mitä ansaitset</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Alueesi tekijöiden keskimääräinen tuntihinta on 30-45 €. Kilpailukykyisen hinnan asettaminen auttaa sinua
                saamaan enemmän tehtäviä.
              </p>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                💡 Valitse kategoriat joissa työskentelet
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                <strong>Voit valita useita kategorioita!</strong> Mitä enemmän kategorioita valitset, sitä enemmän tehtäviä saat.
              </p>
              <p className="text-xs text-blue-600 mb-2">
                Klikkaa kategorioita valitaksesi/poistaaksesi niitä. Valitut kategoriat näkyvät sinisellä.
              </p>
            </div>

            {/* Enhanced verification guidance */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                ⚠️ Tärkeä: Kategoriavarmistus
              </h4>
              <div className="space-y-2 text-sm text-amber-700">
                <p><strong>Valitse vain kategoriat, joissa sinulla on todellista kokemusta ja osaamista.</strong></p>
                <p>Hakemuksen käsittelyn yhteydessä tarkistamme:</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>Portfoliokuvat ja aikaisempi kokemus valituista kategorioista</li>
                  <li>Biossasi mainittu asiantuntemus suhteessa valittuihin kategorioihin</li>
                  <li>Mahdolliset sertifikaatit tai ammattitaidot (mainitse biossa)</li>
                </ul>
                <p className="text-xs font-medium mt-2">
                  <span className="text-amber-800">💼 Vihje:</span> Aloita 1-3 kategorialla, joissa olet vahvimmillaan.
                  Voit lisätä kategorioita myöhemmin, kun olet rakentanut mainettasi.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoriesList.map((category: Category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`
                    flex items-center p-3 border rounded-md cursor-pointer transition-colors
                    ${formData.categories.includes(category.id)
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex-shrink-0 mr-3">
                    {(() => {
                      const slug = category.name_fi.toLowerCase().replace(/\s+/g, '');
                      const IconComp = (categoryIconMap as Record<string, any>)[slug];
                      if (IconComp) {
                        return <IconComp className="h-6 w-6 text-gray-600" />
                      }
                      if (isValidNextImageSrc(category.icon_url)) {
                        return (
                          <Image src={category.icon_url} alt={category.name_fi} width={24} height={24} />
                        )
                      }
                      return <Briefcase className="h-6 w-6 text-gray-500" />
                    })()}
                  </div>
                  <span className="flex-grow">{category.name_fi}</span>
                  {formData.categories.includes(category.id) && <Check className="h-5 w-5 text-sky-600" />}
                </div>
              ))}
            </div>
            {formData.categories.length === 0 && (
              <p className="text-sm text-red-500 mt-2">Valitse vähintään yksi kategoria</p>
            )}
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Lataa ammattimainen profiilikuva. Tämä näkyy asiakkaille, kun haet tehtäviä.
            </p>
            <div className="flex flex-col items-center justify-center">
              {formData.profilePicturePreview ? (
                <div className="relative">
                  <Image
                    src={formData.profilePicturePreview || "/placeholder.svg"}
                    alt="Profile preview"
                    width={200}
                    height={200}
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 bg-sky-600 text-white p-2 rounded-full shadow-md hover:bg-sky-700 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={triggerFileInput}
                  className="w-40 h-40 rounded-full bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">Lataa kuva</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Suositus: Selkeä kuva kasvoistasi neutraalia taustaa vasten
            </p>
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Lisää esimerkkejä työstäsi (kuvat). Voit lisätä useampia.</p>
            <input type="file" accept="image/*" multiple onChange={handlePortfolioFiles} />
            {formData.portfolioPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.portfolioPreviews.map((src, idx) => (
                  <Image key={idx} src={src || "/placeholder.svg"} alt={`Portfolio ${idx + 1}`} width={160} height={160} className="w-full h-24 object-cover rounded-md border" />
                ))}
              </div>
            )}
          </div>
        )
      case 7:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Tietoja sinusta *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Kerro asiakkaille kokemuksestasi, taidoistasi ja miksi olisit erinomainen tehtäviin.
              </p>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
                placeholder="Olen luotettava ammattilainen, jolla on 5 vuoden kokemus kodin korjauksista..."
                required
              />
            </div>
            <div className="flex items-center mt-2">
              <div className="text-xs text-gray-500">{formData.bio.length}/500 merkkiä</div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-700 mb-2">Vinkkejä hyvään bioon:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Korosta asiaankuuluvaa kokemusta ja taitoja</li>
                <li>Mainitse mahdolliset sertifikaatit tai pätevyydet</li>
                <li>Selitä, miksi olet luotettava ja ammattitaitoinen</li>
                <li>Pidä se tiiviinä ja ystävällisenä</li>
              </ul>
            </div>
          </div>
        )
      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Lisää saatavuusajat</h3>
              <p className="text-sm text-gray-500 mb-4">
                Valitse päivät, milloin olet saatavilla. Voit lisätä useita aikoja ja määrittää, kuinka usein ne toistuvat.
              </p>
              <AvailabilityPicker
                value={formData.availability}
                onChange={handleAvailabilityChange}
              />
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="font-medium text-blue-700 mb-2">Kohta valmis!</h4>
              <p className="text-sm text-blue-600">
                Kun lähetät hakemuksen, tarkistamme sen 1-2 arkipäivässä. Hyväksynnän jälkeen voit alkaa vastaanottaa tehtäviä ja ansaita!
              </p>
            </div>
          </div>
        )
      case 9:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Yhteenveto</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Nimi:</strong> {formData.firstName} {formData.lastName}</li>
              <li><strong>Sähköposti:</strong> {formData.email}</li>
              <li><strong>Puhelin:</strong> {formData.phone}</li>
              <li><strong>Osoite:</strong> {formData.address}</li>
              <li><strong>Hinta:</strong> {formData.hourlyRate} €/h</li>
              <li><strong>Palvelusäde:</strong> {formData.serviceRadius} km</li>
              <li><strong>Kategoriat:</strong> {categoriesList.filter(c => formData.categories.includes(c.id)).map(c => c.name_fi).join(', ') || '—'}</li>
            </ul>
            <p className="text-xs text-gray-500">Tarkista tietosi ennen lähettämistä.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      // Handle Enter key press as Next button click
      if (currentStep < STEPS.length) {
        nextStep();
      } else {
        handleSubmit();
      }
    }}>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-medium text-gray-900">
            Vaihe {currentStep} / {STEPS.length}: {STEPS[currentStep - 1].title}
          </h2>
          <span className="text-xs text-gray-500">{Math.round((currentStep / STEPS.length) * 100)}% Valmis</span>
        </div>
        <div className="w-full bg-gray-200/70 rounded-full h-2">
          <div
            className="bg-sky-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="hidden md:flex justify-between mt-3">
          {STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isClickable = stepNumber <= currentStep;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center transition-all duration-200 ${isCompleted ? "text-sky-600" : isActive ? "text-sky-600" : "text-gray-400"
                  }`}
                title={isClickable ? `Klikkaa palataksesi vaiheeseen: ${step.title}` : undefined}
              >
                <Button
                  type="button"
                  variant={isActive ? 'default' : isCompleted ? 'secondary' : 'ghost'}
                  className={`w-8 h-8 p-0 rounded-full mb-1 ${isClickable ? "hover:scale-110" : "cursor-default"}`}
                  disabled={!isClickable}
                  aria-label={isClickable ? `Siirry vaiheeseen ${step.title}` : step.title}
                  onClick={() => isClickable && handleStepClick(stepNumber)}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.icon}
                </Button>
                <span className="text-xs whitespace-nowrap">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-6 space-y-4">{renderStepContent()}</div>

      {/* Sticky Navigation */}
      <div className="sticky bottom-0 z-10 mt-6 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep} className="gap-1">
              <ChevronLeft className="h-5 w-5" />
              Takaisin
            </Button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={nextStep}
              className="gap-1"
              disabled={
                (currentStep === 1 && (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || (!currentUserId && !formData.password))) ||
                (currentStep === 2 && (!formData.address || !formData.latitude || !formData.longitude)) ||
                (currentStep === 3 && (formData.hourlyRate === undefined || formData.serviceRadius === undefined)) ||
                (currentStep === 4 && formData.categories.length === 0) ||
                (currentStep === 7 && !formData.bio)
              }
            >
              Seuraava
              <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} className="gap-1">
              Lähetä hakemus
              <Check className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
