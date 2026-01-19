'use client';

import React, { useState } from 'react';
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api';
import { cn } from '@/lib/utils';

const libraries: 'places'[] = ['places'];

interface PlacesInputProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function PlacesInput({
  value,
  onChange,
  placeholder = "Osoite tai alue",
  className,
  disabled = false,
}: PlacesInputProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      
      if (place.formatted_address && place.geometry?.location) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        onChange(place.formatted_address, coordinates);
      } else if (place.name) {
        onChange(place.name);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Fallback to regular input if no API key
  if (!googleMapsApiKey) {
    return (
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("form-input", className)}
      />
    );
  }

  return (
    <LoadScriptNext
      googleMapsApiKey={googleMapsApiKey}
      libraries={libraries}
      loadingElement={
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="Ladataan..."
          disabled={true}
          className={cn("form-input opacity-50", className)}
        />
      }
    >
      <Autocomplete
        onLoad={onAutocompleteLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: 'fi' },
          fields: [
            'formatted_address',
            'geometry',
            'name',
            'place_id',
          ],
          types: ['address'],
        }}
      >
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("form-input", className)}
        />
      </Autocomplete>
    </LoadScriptNext>
  );
}