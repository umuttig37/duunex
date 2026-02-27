"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Database } from "@/lib/supabase/database.types"
import { format, parseISO } from "date-fns"
import { Calendar, Edit, Edit2, Image, Info, MapPin, Star } from "lucide-react"

// Define more specific types based on Supabase schema for clarity
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// This is the structure this component expects for formData.
export interface BookingSummaryData {
  category: CategoryRow | null;
  location_text: string | null;
  description: string | null;
  task_size: "small" | "medium" | "large";
  scheduled_date: Date | string | null;
  scheduled_time_slot: "morning" | "afternoon" | "evening" | "flexible" | null;
  tasker: (ProfileRow & { hourly_rate?: number; rating?: number; reviews?: number; }) | null;
  postingType: "open" | "direct";
  budget?: number | null;
  additional_details?: {
    items?: string;
    needs_packing?: "yes" | "no";
    floors?: string;
    pet_type?: string;
    service_type?: string;
    pet_details?: string;
    cleaning_type?: string;
    home_size?: string;
    areas?: string[];
    specific_requirements?: string;
  };
  image_urls?: string[];
}

interface BookingSummaryProps {
  formData: BookingSummaryData
  onEdit: (step: number) => void
}

export default function BookingSummary({ formData, onEdit }: BookingSummaryProps) {
  const {
    category,
    location_text,
    description,
    task_size,
    scheduled_date,
    scheduled_time_slot,
    tasker,
    postingType,
    budget,
    additional_details,
    image_urls
  } = formData

  const getTaskSizeText = () => {
    switch (task_size) {
      case "small": return "Pieni - Arvio 1 tunti";
      case "medium": return "Keskikokoinen - Arvio 2-3 tuntia";
      case "large": return "Suuri - Arvio 4+ tuntia";
      default: return "Pieni - Arvio 1 tunti";
    }
  }

  const getTimeText = () => {
    switch (scheduled_time_slot) {
      case "morning": return "Aamupäivä (8-12)";
      case "afternoon": return "Iltapäivä (12-17)";
      case "evening": return "Ilta (17-21:30)";
      case "flexible": return "Joustava";
      default: return "Ei määritelty";
    }
  }

  const getCategoryNameDisplay = (): string => {
    return category?.name_fi || "Ei kategoriaa";
  }

  const renderCategorySpecificDetails = () => {
    if (!category?.slug || !additional_details) return null
    switch (category.slug) {
      case "muuttoapu":
        return (
          <div className="space-y-2">
            {additional_details.items && (<div><span className="font-medium">Siirrettävät tavarat:</span> {additional_details.items}</div>)}
            {additional_details.needs_packing && (<div><span className="font-medium">Pakkausapu:</span> {additional_details.needs_packing === "yes" ? "Kyllä" : "Ei"}</div>)}
            {additional_details.floors && (<div><span className="font-medium">Kerrokset:</span> {additional_details.floors}</div>)}
          </div>
        )
      case "lemmikin-hoito":
        return (
          <div className="space-y-2">
            {additional_details.pet_type && (<div><span className="font-medium">Lemmikin tyyppi:</span> {additional_details.pet_type}</div>)}
            {additional_details.service_type && (<div><span className="font-medium">Palvelun tyyppi:</span> {additional_details.service_type}</div>)}
            {additional_details.pet_details && (<div><span className="font-medium">Lemmikin tiedot:</span> {additional_details.pet_details}</div>)}
          </div>
        )
      case "siivous":
        return (
          <div className="space-y-2">
            {additional_details.cleaning_type && (<div><span className="font-medium">Siivouksen tyyppi:</span> {additional_details.cleaning_type}</div>)}
            {additional_details.home_size && (<div><span className="font-medium">Kodin koko:</span> {additional_details.home_size}</div>)}
            {additional_details.areas && additional_details.areas.length > 0 && (<div><span className="font-medium">Erityishuomiota vaativat alueet:</span> {additional_details.areas.join(", ")}</div>)}
          </div>
        )
      default:
        return additional_details.specific_requirements ? (<div><span className="font-medium">Erityisvaatimukset:</span> {additional_details.specific_requirements}</div>) : null
    }
  }

  const formattedDate = () => {
    if (!scheduled_date) return "Ei valittu";
    try {
      const dateObj = typeof scheduled_date === 'string' ? parseISO(scheduled_date) : scheduled_date;
      return format(dateObj, "PPPP", { useAdditionalWeekYearTokens: false, useAdditionalDayOfYearTokens: false });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Virheellinen päivämäärä";
    }
  }

  // Determine which step to go to for editing Date/Time
  const dateTimeEditStep = postingType === 'open' ? 3 : 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Tarkista ja varaa</h2>
        <p className="text-gray-600 mb-4">Tarkista varauksesi tiedot ennen lähettämistä.</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{getCategoryNameDisplay()}</h3>
                <p className="text-gray-600">{getTaskSizeText()}</p>
              </div>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-primary" onClick={() => onEdit(1)}>
                <Edit2 size={16} />Muokkaa
              </Button>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-lg">Tehtävän Tiedot</h4>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-primary -mt-1" onClick={() => onEdit(2)}>
                  <Edit size={16} /> Muokkaa kaikkia
                </Button>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Sijainti</p>
                  <p className="text-gray-600">{location_text || "Ei määritelty"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Päivämäärä & Aika</p>
                  <p className="text-gray-600">{formattedDate()} • {getTimeText()}</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto flex items-center gap-1 text-primary" onClick={() => onEdit(dateTimeEditStep)}>
                  <Edit2 size={16} />Muokkaa
                </Button>
              </div>
              <div>
                <p className="font-medium">Kuvaus</p>
                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{description || "Ei kuvausta"}</p>
              </div>
              {image_urls && image_urls.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-5 h-5 text-gray-500" />
                    <p className="font-medium">Kuvat ({image_urls.length})</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {image_urls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Tehtävän kuva ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {renderCategorySpecificDetails() && (
                <div>
                  <p className="font-medium">Lisätiedot</p>
                  <div className="text-gray-600 mt-1">{renderCategorySpecificDetails()}</div>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-lg">Julkaisutapa</h4>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-primary -mt-1" onClick={() => onEdit(3)}>
                  <Edit size={16} /> Muokkaa
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-500 shrink-0" />
                <p className="text-gray-600">
                  {postingType === 'open' ? "Avoin haku (tekijät ottavat yhteyttä)" : "Suora valinta tekijälle"}
                </p>
              </div>
            </div>
            <Separator />
            {postingType === 'direct' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-lg">Valittu Tekijä</h4>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 text-primary -mt-1" onClick={() => onEdit(4)}>
                    <Edit size={16} /> {tasker ? "Vaihda" : "Valitse"}
                  </Button>
                </div>
                {tasker ? (
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img src={tasker.avatar_url || "/placeholder.svg"} alt={tasker.first_name || "Tekijä"} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{tasker.first_name} {tasker.last_name || ""}</p>
                      {tasker.rating !== undefined && tasker.reviews !== undefined && (
                        <div className="flex items-center mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="ml-1 text-sm text-gray-600">{tasker.rating.toFixed(1)} ({tasker.reviews} arvostelua)</span>
                        </div>
                      )}
                      <p className="text-gray-600 mt-1">{tasker.hourly_rate ? `${tasker.hourly_rate.toFixed(2)} €/tunti` : "Tuntihinta ei asetettu"}</p>
                    </div>
                  </div>
                ) : (<div className="text-gray-600 py-2">Tekijää ei ole vielä valittu.</div>)}
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-lg">Hinta</h4>
              {postingType === 'open' ? (
                <>
                  <div className="flex justify-between font-bold text-xl mt-2">
                    <span>Määritetty budjetti:</span>
                    <span>{budget ? `${budget.toFixed(2)} €` : "Ei asetettu"}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Tämä on summa, jonka olet ilmoittanut olevasi valmis maksamaan tehtävästä.</p>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 text-primary -ml-2" onClick={() => onEdit(3)}>
                    <Edit2 size={16} />Muokkaa budjettia
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span>Tuntihinta</span><span>{tasker?.hourly_rate ? `${tasker.hourly_rate.toFixed(2)} €/tunti` : "--"}</span></div>
                  <div className="flex justify-between"><span>Arvioidut tunnit</span><span>{getTaskSizeText()}</span></div>
                  <div className="flex justify-between font-bold text-xl mt-2">
                    <span>Arvioitu Kokonaishinta</span>
                    <span>
                      {tasker?.hourly_rate
                        ? task_size === "small"
                          ? `${tasker.hourly_rate.toFixed(2)} €`
                          : task_size === "medium"
                            ? `${(tasker.hourly_rate * 2).toFixed(2)} - ${(tasker.hourly_rate * 3).toFixed(2)} €`
                            : `${(tasker.hourly_rate * 4).toFixed(2)}+ €`
                        : "--"}
                    </span>
                  </div>
                  {tasker && <p className="text-sm text-gray-500 mt-1">Lopullinen hinta voi vaihdella tehtävään käytetyn todellisen ajan mukaan.</p>}
                  {!tasker && <p className="text-sm text-gray-500 mt-1">Valitse tekijä nähdäksesi hinta-arvion.</p>}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
