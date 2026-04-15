'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/shared/use-toast";
import type { Database } from '@/lib/supabase/database.types';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { AlertCircle, ArrowLeft, Briefcase, CheckCircle, Info, MailIcon, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateTaskerApplicationAction } from './actions'; // We will create this action next

type UserProfile = Database['public']['Tables']['profiles']['Row'];
type TaskerApplication = Database['public']['Tables']['tasker_applications']['Row'];
type TaskerDetails = Database['public']['Tables']['tasker_details']['Row'];

interface TaskerApplicationDetailClientProps {
    application: TaskerApplication;
    applicantProfile: UserProfile | null;
    taskerSpecificDetails: TaskerDetails | null;
    adminUserId: string;
}

function ProfileDetailItem({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ElementType }) {
    if (!value) return null;
    return (
        <div>
            <Label className="text-xs text-gray-500 flex items-center">
                {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
                {label}
            </Label>
            <p className="text-sm">{value}</p>
        </div>
    );
}

export default function TaskerApplicationDetailClient({
    application,
    applicantProfile,
    taskerSpecificDetails,
    adminUserId,
}: TaskerApplicationDetailClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [currentStatus, setCurrentStatus] = useState(application.status || 'pending');
    const [reviewNotes, setReviewNotes] = useState(application.review_notes || '');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        startTransition(async () => {
            const formData = new FormData();
            formData.append('applicationId', application.id);
            formData.append('profileId', application.profile_id);
            formData.append('newStatus', currentStatus);
            formData.append('reviewNotes', reviewNotes);
            formData.append('adminUserId', adminUserId);

            const result = await updateTaskerApplicationAction(formData);

            if (result.success) {
                toast({
                    title: "Päivitys Onnistui",
                    description: result.message || "Hakemuksen tila ja muistiinpanot päivitetty.",
                    variant: "default",
                });
                // Optionally, refresh data or redirect. For now, local state is updated.
                // router.refresh(); // Could cause full page reload, consider more targeted updates
            } else {
                toast({
                    title: "Virhe Päivityksessä",
                    description: result.message || "Hakemuksen päivitys epäonnistui.",
                    variant: "destructive",
                });
            }
        });
    };

    if (!applicantProfile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Virhe</CardTitle>
                    <CardDescription>Hakijan profiilitietoja ei löytynyt.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" asChild>
                        <Link href="/admin/tasker-applications"><ArrowLeft className="mr-2 h-4 w-4" />Palaa listaukseen</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="outline" size="sm" asChild className="mb-4">
                <Link href="/admin/tasker-applications"><ArrowLeft className="mr-2 h-4 w-4" />Takaisin hakemuksiin</Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Applicant Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={applicantProfile.avatar_url || undefined} alt={`${applicantProfile.first_name} ${applicantProfile.last_name}`} />
                                    <AvatarFallback className="text-2xl">{applicantProfile.first_name?.charAt(0) || 'H'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-2xl">{applicantProfile.first_name} {applicantProfile.last_name}</CardTitle>
                                    <CardDescription>Hakemuksen ID: {application.id}</CardDescription>
                                    <CardDescription>
                                        Lähetetty: {application.submitted_at ? format(new Date(application.submitted_at), 'dd.MM.yyyy HH:mm', { locale: fi }) : 'Ei tietoa'}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Separator />
                            <h3 className="text-lg font-semibold mt-2">Yhteystiedot</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ProfileDetailItem label="Sähköposti" value={applicantProfile.email} icon={MailIcon} />
                                <ProfileDetailItem label="Puhelinnumero" value={applicantProfile.phone_number} icon={Phone} />
                            </div>
                            <Separator />
                            <h3 className="text-lg font-semibold mt-2">Profiilin Tiedot</h3>
                            <ProfileDetailItem label="Bio/Kuvaus" value={applicantProfile.bio} icon={Info} />

                            {/* Tasker Specific Details - if they exist */}
                            {taskerSpecificDetails && (
                                <>
                                    <Separator />
                                    <h3 className="text-lg font-semibold mt-2">Tekijän Tiedot</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ProfileDetailItem label="Palvelualueen Säte (metriä)" value={taskerSpecificDetails.service_radius_meters?.toString()} icon={MapPin} />
                                        {/* Display other tasker_details fields as needed, e.g., location (might need formatting) */}
                                        {/* <ProfileDetailItem label="Location (Coords)" value={taskerSpecificDetails.location ? 'Coordinates available' : 'Not set'} /> */}
                                    </div>
                                    {taskerSpecificDetails.availability_schedule && (
                                        <ProfileDetailItem
                                            label="Saatavuuskalenteri (JSON)"
                                            value={typeof taskerSpecificDetails.availability_schedule === 'string' ? taskerSpecificDetails.availability_schedule : JSON.stringify(taskerSpecificDetails.availability_schedule)}
                                            icon={Briefcase}
                                        />
                                    )}
                                </>
                            )}

                            {/* Display other profile fields as necessary. E.g. address, city, zipcode etc. */}
                            <Separator />
                            <h3 className="text-lg font-semibold mt-2">Osoitetiedot</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ProfileDetailItem label="Osoite" value={applicantProfile.address} icon={MapPin} />
                                <ProfileDetailItem label="Kaupunki" value={applicantProfile.city} icon={MapPin} />
                                <ProfileDetailItem label="Postinumero" value={applicantProfile.zipcode} icon={MapPin} />
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Admin Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Käsittele Hakemus</CardTitle>
                            <CardDescription>Päivitä hakemuksen tila ja lisää muistiinpanot.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="status">Hakemuksen Tila</Label>
                                    <Select value={currentStatus} onValueChange={setCurrentStatus} name="status">
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Valitse tila" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Odottaa käsittelyä</SelectItem>
                                            <SelectItem value="approved">Hyväksytty</SelectItem>
                                            <SelectItem value="not_approved">Hylätty</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="review_notes">Muistiinpanot (näkyy vain adminille)</Label>
                                    <Textarea
                                        id="review_notes"
                                        name="reviewNotes"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Lisää tarvittaessa muistiinpanoja hakemuksen käsittelystä..."
                                        rows={5}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isPending} className="w-full">
                                    {isPending ? 'Päivitetään...' : 'Tallenna Muutokset'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Nykyinen Vahvistustila</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {applicantProfile.is_verified ? (
                                <div className="flex items-center text-sky-600">
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    <span>Käyttäjä ON vahvistettu tekijä.</span>
                                </div>
                            ) : (
                                <div className="flex items-center text-orange-600">
                                    <AlertCircle className="mr-2 h-5 w-5" />
                                    <span>Käyttäjä EI OLE vahvistettu tekijä.</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 