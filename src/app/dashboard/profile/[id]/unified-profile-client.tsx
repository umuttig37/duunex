'use client';

import BankAccountSettings from '@/components/features/profile/bank-account-settings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/shared/use-toast';
import type { Database } from '@/lib/supabase/database.types';
import PlacesInput from '@/components/ui/places-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Bell, CreditCard, Edit, Eye, Lock, MapPin, Settings, Shield, Upload, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Etunimi on pakollinen'),
  last_name: z.string().min(1, 'Sukunimi on pakollinen'),
  email: z.string().email('Virheellinen sähköpostiosoite').optional().or(z.literal('')),
  phone_number: z.string().optional().or(z.literal('')),
  bio: z.string().max(500, 'Kuvaus voi olla enintään 500 merkkiä pitkä').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  zipcode: z.string().optional().or(z.literal('')),
  service_radius_km: z.number().min(1).max(50).optional(),
  hourly_rate: z.number().min(10).max(200).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Address autocomplete now uses Nominatim (OpenStreetMap) via PlacesInput component

interface UnifiedProfileClientProps {
  viewedProfile: Database['public']['Tables']['profiles']['Row'];
  currentUser: any;
  isOwnProfile: boolean;
  isAdmin: boolean;
  allCategories: { id: string; name_fi: string; slug: string; }[];
  currentCategories: string[];
  taskerDetails?: {
    hourly_rate: number;
    service_radius_meters: number;
  } | null;
  updateProfileAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
  updateUserPreferencesAction: (preferences: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    marketing_messages?: boolean;
    public_profile?: boolean;
    show_location?: boolean;
    show_contact_info?: boolean;
  }) => Promise<{ success: boolean; message: string }>;
  activeTab: string;
}

export default function UnifiedProfileClient({
  viewedProfile,
  currentUser,
  isOwnProfile,
  isAdmin,
  allCategories,
  currentCategories,
  taskerDetails,
  updateProfileAction,
  updateUserPreferencesAction,
  activeTab: initialActiveTab
}: UnifiedProfileClientProps) {
  const [isSubmitting, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(viewedProfile.avatar_url);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCategories);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Settings state - initialize from viewedProfile with type safety
  const [emailNotifications, setEmailNotifications] = useState((viewedProfile as any).email_notifications ?? true);
  const [pushNotifications, setPushNotifications] = useState((viewedProfile as any).push_notifications ?? true);
  const [marketingMessages, setMarketingMessages] = useState((viewedProfile as any).marketing_messages ?? false);
  const [publicProfile, setPublicProfile] = useState((viewedProfile as any).public_profile ?? true);
  const [showLocation, setShowLocation] = useState((viewedProfile as any).show_location ?? true);
  const [showContactInfo, setShowContactInfo] = useState((viewedProfile as any).show_contact_info ?? true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: viewedProfile.first_name || '',
      last_name: viewedProfile.last_name || '',
      email: viewedProfile.email || '',
      phone_number: viewedProfile.phone_number || '',
      bio: viewedProfile.bio || '',
      address: viewedProfile.address || '',
      city: viewedProfile.city || '',
      zipcode: viewedProfile.zipcode || '',
      service_radius_km: taskerDetails ? Math.round(taskerDetails.service_radius_meters / 1000) : 5,
      hourly_rate: taskerDetails?.hourly_rate || 25,
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Virhe",
          description: "Profiilikuva on liian suuri (max 2MB).",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Virhe",
          description: "Tiedoston on oltava kuva.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle address selection from PlacesInput (Nominatim)
  const handleAddressChange = (value: string, coords?: { lat: number; lng: number }) => {
    form.setValue('address', value);
    if (coords) {
      setCoordinates(coords);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    console.log('🚀 UNIFIED PROFILE FORM SUBMISSION STARTED', {
      formData: data,
      selectedCategories: selectedCategories,
      profileRole: viewedProfile.role,
      currentCategories: currentCategories
    });
    
    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.append('id', viewedProfile.id);
        formData.append('first_name', data.first_name);
        formData.append('last_name', data.last_name);
        formData.append('email', data.email || '');
        formData.append('phone_number', data.phone_number || '');
        formData.append('bio', data.bio || '');
        formData.append('address', data.address || '');
        formData.append('city', data.city || '');
        formData.append('zipcode', data.zipcode || '');

        if (viewedProfile.role === 'tasker') {
          formData.append('service_radius_km', String(data.service_radius_km || 5));
          formData.append('hourly_rate', String(data.hourly_rate || 25));
          
          // Add categories in the format expected by server action
          console.log('Unified Profile - Adding categories:', selectedCategories);
          selectedCategories.forEach(categoryId => {
            formData.append('categories[]', categoryId);
            console.log('Added category to form:', categoryId);
          });
        }

        if (coordinates) {
          formData.append('latitude', String(coordinates.lat));
          formData.append('longitude', String(coordinates.lng));
        }

        if (fileInputRef.current?.files?.[0]) {
          formData.append('avatar', fileInputRef.current.files[0]);
        }

        const result = await updateProfileAction(formData);

        if (result.success) {
          toast({
            title: "Onnistui!",
            description: result.message,
          });
          setIsEditModalOpen(false);
          router.refresh();
        } else {
          toast({
            title: "Virhe",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Profile update error:', error);
        toast({
          title: "Virhe",
          description: "Profiilin päivittäminen epäonnistui. Yritä uudelleen.",
          variant: "destructive",
        });
      }
    });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleNotificationChange = async (type: 'email' | 'push' | 'marketing', value: boolean) => {
    const labels = {
      email: 'Sähköposti-ilmoitukset',
      push: 'Push-ilmoitukset',
      marketing: 'Marketing-viestit'
    };

    const preferenceKeys = {
      email: 'email_notifications' as const,
      push: 'push_notifications' as const,
      marketing: 'marketing_messages' as const
    };

    // Update local state immediately for responsive UI
    switch (type) {
      case 'email':
        setEmailNotifications(value);
        break;
      case 'push':
        setPushNotifications(value);
        break;
      case 'marketing':
        setMarketingMessages(value);
        break;
    }

    // Save to database
    const result = await updateUserPreferencesAction({
      [preferenceKeys[type]]: value
    });

    if (result.success) {
      toast({
        title: "Asetus päivitetty",
        description: `${labels[type]} ${value ? 'käytössä' : 'pois käytöstä'}`,
      });
    } else {
      // Revert state on error
      switch (type) {
        case 'email':
          setEmailNotifications(!value);
          break;
        case 'push':
          setPushNotifications(!value);
          break;
        case 'marketing':
          setMarketingMessages(!value);
          break;
      }
      toast({
        title: "Virhe",
        description: result.message || 'Asetuksen tallennus epäonnistui',
        variant: "destructive",
      });
    }
  };

  const handlePrivacyChange = async (type: 'profile' | 'location' | 'contact', value: boolean) => {
    const labels = {
      profile: 'Julkinen profiili',
      location: 'Sijainnin näyttäminen',
      contact: 'Kontaktitietojen näyttäminen'
    };

    const preferenceKeys = {
      profile: 'public_profile' as const,
      location: 'show_location' as const,
      contact: 'show_contact_info' as const
    };

    switch (type) {
      case 'profile':
        setPublicProfile(value);
        break;
      case 'location':
        setShowLocation(value);
        break;
      case 'contact':
        setShowContactInfo(value);
        break;
    }

    // Save to database
    const result = await updateUserPreferencesAction({
      [preferenceKeys[type]]: value
    });

    if (result.success) {
      toast({
        title: "Yksityisyysasetus päivitetty",
        description: `${labels[type]} ${value ? 'käytössä' : 'pois käytöstä'}`,
      });
    } else {
      // Revert state on error
      switch (type) {
        case 'profile':
          setPublicProfile(!value);
          break;
        case 'location':
          setShowLocation(!value);
          break;
        case 'contact':
          setShowContactInfo(!value);
          break;
      }
      toast({
        title: "Virhe",
        description: result.message || 'Asetuksen tallennus epäonnistui',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isOwnProfile ? 'Profiilisi' : `${viewedProfile.first_name || 'Käyttäjä'} ${viewedProfile.last_name || ''}`}
            </h1>
            <p className="text-gray-600 mt-2">
              {isOwnProfile
                ? 'Hallitse profiilitietojasi ja asetuksiasi'
                : 'Tarkastele ja muokkaa käyttäjän tietoja'
              }
            </p>
          </div>
        </div>

        {/* Quick Edit Button */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Muokkaa profiilia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Muokkaa profiilia</DialogTitle>
              <DialogDescription>
                Päivitä profiilitietojasi ja asetuksiasi täällä.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarPreview || ''} />
                      <AvatarFallback className="text-lg">
                        {viewedProfile.first_name?.[0]}{viewedProfile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="avatar">Profiilikuva</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Vaihda kuva
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        JPG, PNG tai GIF (max 2MB)
                      </p>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Etunimi *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sukunimi *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSubmitting} />
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
                            <Input {...field} type="email" disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puhelinnumero</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kuvaus</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSubmitting} rows={3} />
                        </FormControl>
                        <FormDescription>
                          Kerro itsestäsi lyhyesti (max 500 merkkiä)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Sijainti
                    </h3>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Osoite</FormLabel>
                          <FormControl>
                            <PlacesInput
                              value={field.value || ''}
                              onChange={handleAddressChange}
                              placeholder="Aloita kirjoittamaan osoitetta"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormDescription>
                            Aloita kirjoittamaan osoitetta ja valitse ehdotuksista
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kaupunki</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zipcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postinumero</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Tasker-specific fields */}
                  {viewedProfile.role === 'tasker' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Tekijän tiedot</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hourly_rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tuntihinta (€)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={10}
                                  max={200}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="service_radius_km"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Toimintasäde (km)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={1}
                                  max={50}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Categories */}
                      <div>
                        <Label className="text-base font-medium">Palvelukategoriat</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Valitse kategoriat, joissa tarjoat palveluja
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {allCategories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={category.id}
                                checked={selectedCategories.includes(category.id)}
                                onCheckedChange={() => toggleCategory(category.id)}
                                disabled={isSubmitting}
                              />
                              <Label
                                htmlFor={category.id}
                                className="text-sm cursor-pointer"
                              >
                                {category.name_fi}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Tallennetaan...' : 'Tallenna muutokset'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Peruuta
                    </Button>
                  </div>
                </form>
              </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile Tabs */}
      <Tabs value={initialActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" asChild>
            <Link
              href={`/dashboard/profile/${viewedProfile.id}?tab=general`}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Yleiset tiedot
            </Link>
          </TabsTrigger>
          <TabsTrigger value="payment" asChild>
            <Link
              href={`/dashboard/profile/${viewedProfile.id}?tab=payment`}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Maksutiedot
            </Link>
          </TabsTrigger>
          <TabsTrigger value="settings" asChild>
            <Link
              href={`/dashboard/profile/${viewedProfile.id}?tab=settings`}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Asetukset
            </Link>
          </TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Perustiedot
                </CardTitle>
                <CardDescription>
                  Profiilitietosi ja yhteystiedot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={viewedProfile.avatar_url || ''} />
                      <AvatarFallback className="text-lg">
                        {viewedProfile.first_name?.[0]}{viewedProfile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {viewedProfile.first_name} {viewedProfile.last_name}
                      </h3>
                      <p className="text-gray-600 capitalize">{viewedProfile.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Sähköposti</label>
                      <p className="text-gray-900">{viewedProfile.email || 'Ei asetettu'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Puhelinnumero</label>
                      <p className="text-gray-900">{viewedProfile.phone_number || 'Ei asetettu'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Kaupunki</label>
                      <p className="text-gray-900">{viewedProfile.city || 'Ei asetettu'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Postinumero</label>
                      <p className="text-gray-900">{viewedProfile.zipcode || 'Ei asetettu'}</p>
                    </div>
                  </div>

                  {viewedProfile.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Osoite</label>
                      <p className="text-gray-900">{viewedProfile.address}</p>
                    </div>
                  )}

                  {viewedProfile.bio && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Kuvaus</label>
                      <p className="text-gray-900 mt-1">{viewedProfile.bio}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tasker Details Sidebar */}
            {viewedProfile.role === 'tasker' && (
              <Card>
                <CardHeader>
                  <CardTitle>Tekijän tiedot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tuntihinta</label>
                    <p className="text-lg font-semibold text-primary">
                      {taskerDetails?.hourly_rate || 25}€/h
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Toimintasäde</label>
                    <p className="text-gray-900">
                      {taskerDetails ? Math.round(taskerDetails.service_radius_meters / 1000) : 5} km
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Palvelukategoriat</label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentCategories.length > 0 ? (
                        currentCategories.map((categoryId) => {
                          const category = allCategories.find(c => c.id === categoryId);
                          return category ? (
                            <span
                              key={categoryId}
                              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {category.name_fi}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="text-gray-500 text-sm">Ei valittuja kategorioita</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Payment Information Tab */}
        <TabsContent value="payment" className="space-y-6">
          {viewedProfile.role === 'tasker' ? (
            <BankAccountSettings userId={viewedProfile.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Maksutiedot
                </CardTitle>
                <CardDescription>
                  Pankkitiedot ovat käytettävissä vain tekijöille
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Vain tekijät voivat lisätä pankkitietoja rahojen nostamista varten.
                  {viewedProfile.role === 'user' && (
                    <>
                      {' '}Halutessasi voit hakea tekijäksi{' '}
                      <Link href="/signup/tasker" className="text-blue-600 hover:underline">
                        täällä
                      </Link>.
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Enhanced Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Tilin turvallisuus
                </CardTitle>
                <CardDescription>
                  Hallitse salasanaa ja turvallisuusasetuksia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tilin tila</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${viewedProfile.is_verified
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {viewedProfile.is_verified ? 'Vahvistettu' : 'Vahvistamaton'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tilin luotu</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(viewedProfile.created_at).toLocaleDateString('fi-FI', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {isOwnProfile && (
                  <div className="pt-2">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/auth/change-password">
                        <Lock className="h-4 w-4 mr-2" />
                        Vaihda salasana
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Ilmoitusasetukset
                </CardTitle>
                <CardDescription>
                  Hallitse miten haluat vastaanottaa ilmoituksia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Sähköposti-ilmoitukset</p>
                      <p className="text-xs text-gray-600">Uudet viestit ja tehtävät</p>
                    </div>
                    <Checkbox 
                      checked={emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked as boolean)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Push-ilmoitukset</p>
                      <p className="text-xs text-gray-600">Kiireelliset päivitykset</p>
                    </div>
                    <Checkbox 
                      checked={pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked as boolean)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Marketing-viestit</p>
                      <p className="text-xs text-gray-600">Uudet ominaisuudet ja tarjoukset</p>
                    </div>
                    <Checkbox 
                      checked={marketingMessages}
                      onCheckedChange={(checked) => handleNotificationChange('marketing', checked as boolean)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Yksityisyysasetukset
                </CardTitle>
                <CardDescription>
                  Hallitse kuka voi nähdä profiilitietosi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Julkinen profiili</p>
                      <p className="text-xs text-gray-600">Näytä profiili muille käyttäjille</p>
                    </div>
                    <Checkbox 
                      checked={publicProfile}
                      onCheckedChange={(checked) => handlePrivacyChange('profile', checked as boolean)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Näytä sijainti</p>
                      <p className="text-xs text-gray-600">Salli sijainnin näyttäminen tehtävissä</p>
                    </div>
                    <Checkbox 
                      checked={showLocation}
                      onCheckedChange={(checked) => handlePrivacyChange('location', checked as boolean)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Kontaktitiedot</p>
                      <p className="text-xs text-gray-600">Näytä yhteystiedot asiakkaille</p>
                    </div>
                    <Checkbox 
                      checked={showContactInfo}
                      onCheckedChange={(checked) => handlePrivacyChange('contact', checked as boolean)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Management */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Tilin hallinta
                </CardTitle>
                <CardDescription>
                  Vaarallinen alue - toimi varovasti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Poista tili</h4>
                  <p className="text-xs text-red-700 mb-3">
                    Tämä toiminto poistaa tilisi pysyvästi. Tätä toimintoa ei voi peruuttaa.
                  </p>
                  <Button variant="destructive" size="sm" disabled>
                    Poista tili (tulossa)
                  </Button>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}