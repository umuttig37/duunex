"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed Input as it's not currently used for time, can be added back if needed

// Availability Slot Structure
export interface AvailabilitySlot {
  id: string;
  startDate: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD", optional for single-day availability
  recurring: 'none' | 'weekly' | 'bi-weekly' | 'monthly';
}

// Helper function to format recurring in Finnish
const formatRecurring = (recurring: string) => {
  const recurringMap: { [key: string]: string } = {
    'none': 'Ei toistoa',
    'weekly': 'Toistuu viikoittain',
    'bi-weekly': 'Toistuu joka toinen viikko',
    'monthly': 'Toistuu kuukausittain'
  };
  return recurringMap[recurring] || recurring;
};

interface AvailabilityPickerProps {
  value: AvailabilitySlot[];
  onChange: (newAvailability: AvailabilitySlot[]) => void;
  // Optional: Add label props if needed for more flexibility
  // dateRangeLabel?: string;
  // recurrenceLabel?: string;
  // addButtonLabel?: string;
  // listTitleLabel?: string;
}

export function AvailabilityPicker({
  value,
  onChange,
  // dateRangeLabel = "Select Date Range",
  // recurrenceLabel = "Recurrence",
  // addButtonLabel = "Add Availability Period",
  // listTitleLabel = "Your Current Availability"
}: AvailabilityPickerProps) {
  const [currentDateRange, setCurrentDateRange] = useState<DateRange | undefined>(undefined);
  const [currentRecurrenceType, setCurrentRecurrenceType] = useState<'none' | 'weekly' | 'bi-weekly' | 'monthly'>('none');

  const handleAddAvailabilitySlot = () => {
    if (!currentDateRange?.from) {
      alert("Valitse aloituspäivämäärä."); // Consider using a toast notification system
      return;
    }

    const newSlot: AvailabilitySlot = {
      id: Date.now().toString(), // Simple unique ID
      startDate: format(currentDateRange.from, "yyyy-MM-dd"),
      endDate: currentDateRange.to ? format(currentDateRange.to, "yyyy-MM-dd") : undefined,
      recurring: currentRecurrenceType,
    };
    
    onChange([...value, newSlot]);

    // Reset inputs
    setCurrentDateRange(undefined);
    setCurrentRecurrenceType('none');
  };

  const handleDeleteAvailabilitySlot = (slotId: string) => {
    onChange(value.filter(slot => slot.id !== slotId));
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Removed the introductory <p> tag to make it more generic */}
        {/* Consumers can add their own descriptive text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
          {/* Date Range Picker */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="date-range-picker" className="block text-sm font-medium text-gray-700">
              Valitse päivämääräalue
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range-picker" // Ensure ID is unique if multiple pickers on one page
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !currentDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {currentDateRange?.from ? (
                    currentDateRange.to ? (
                      <>
                        {format(currentDateRange.from, "d.M.yyyy", { locale: fi })} - {format(currentDateRange.to, "d.M.yyyy", { locale: fi })}
                      </>
                    ) : (
                      format(currentDateRange.from, "d.M.yyyy", { locale: fi })
                    )
                  ) : (
                    <span>Valitse päivä tai aikaväli</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={currentDateRange?.from}
                  selected={currentDateRange}
                  onSelect={setCurrentDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Recurrence Select */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="recurrence-type-select" className="block text-sm font-medium text-gray-700">
              Toistuvuus
            </label>
            <Select value={currentRecurrenceType} onValueChange={(val: 'none' | 'weekly' | 'bi-weekly' | 'monthly') => setCurrentRecurrenceType(val)}>
              <SelectTrigger id="recurrence-type-select"> {/* Ensure ID is unique */}
                <SelectValue placeholder="Valitse toistuvuus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ei toistu (kertaluonteinen)</SelectItem>
                <SelectItem value="weekly">Viikoittain (joka viikko samana päivänä)</SelectItem>
                <SelectItem value="bi-weekly">Joka toinen viikko</SelectItem>
                <SelectItem value="monthly">Kuukausittain (sama päivämäärä kuukaudessa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={handleAddAvailabilitySlot} disabled={!currentDateRange?.from} className="w-full md:w-auto">
          Lisää saatavuusjakso
        </Button>

        {/* Helpful explanation for weekly recurring */}
        {currentRecurrenceType === 'weekly' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>💡 Vihje:</strong> Viikoittainen toistuvuus luo saman saatavuuden joka viikko. 
              Esimerkiksi jos valitset maanantain 9-17, olet saatavilla joka maanantai klo 9-17.
            </p>
          </div>
        )}
      </div>

      {/* Display Added Availability Slots */}
      {value.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
           <h3 className="text-md font-medium text-gray-800">
            Nykyinen saatavuutesi
            </h3>
          {value.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
              <div>
                <p className="font-medium">
                  {format(new Date(slot.startDate + 'T00:00:00'), "d.M.yyyy", { locale: fi })}
                  {slot.endDate && ` - ${format(new Date(slot.endDate + 'T00:00:00'), "d.M.yyyy", { locale: fi })}`}
                </p>
                <p className="text-sm text-gray-600">
                  {formatRecurring(slot.recurring)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteAvailabilitySlot(slot.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 