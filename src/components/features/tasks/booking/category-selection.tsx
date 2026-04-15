"use client"

import { Card } from "@/components/ui/card"
import type { Database } from "@/lib/supabase/database.types"
import {
  Baby,
  BookOpen,
  Brush,
  Camera,
  Flower,
  HelpCircle,
  Palette,
  PawPrint as Paw,
  PenTool as Tool,
  Truck
} from "lucide-react"
import type React from "react"

export type CategoryRow = Database['public']['Tables']['categories']['Row'];

// Helper to map slugs to icons - this could be expanded or moved to a config file
const categoryIconMap: Record<string, React.ElementType> = {
  "muuttoapu": Truck,
  "lemmikin-hoito": Paw,
  "pienet-korjaukset": Tool,
  "lastenhoito": Baby,
  "opetus-ja-tuutorointi": BookOpen,
  "siivous": Brush,
  "valokuvaus": Camera,
  "graafinen-suunnittelu": Palette,
  "puutarhatyot": Flower,
  "muu": HelpCircle,
  // Add other slugs and their corresponding Lucide icons
};

interface CategorySelectionProps {
  selectedCategory: CategoryRow | null;
  onSelectCategory: (category: CategoryRow) => void;
  categories: CategoryRow[]; // Expects all categories to be passed in
}

export default function CategorySelection({ selectedCategory, onSelectCategory, categories }: CategorySelectionProps) {

  if (!categories || categories.length === 0) {
    return <p className="text-center text-gray-500">Ladataan kategorioita...</p>; // Or some other loading/empty state
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Valitse kategoria</h2>
      <p className="text-gray-600 mb-6">Valitse kategoria, joka parhaiten kuvaa tarvitsemaasi tehtävää.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const IconComponent = categoryIconMap[category.slug] || HelpCircle; // Fallback icon
          return (
            <Card
              key={category.id} // Use DB id as key
              className={`
                p-4 cursor-pointer transition-all hover:shadow-md 
                flex flex-col items-center justify-center text-center h-36
                ${selectedCategory?.id === category.id // Compare by id for robustness
                  ? "border-2 border-sky-600 bg-primary/5"
                  : "border border-gray-200 hover:border-gray-300"
                }
              `}
              onClick={() => onSelectCategory(category)}
            >
              <div
                className={`
                  p-3 rounded-full mb-2 
                  ${selectedCategory?.id === category.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"}
                `}
              >
                <IconComponent size={28} />
              </div>
              <span className="font-medium text-sm">{category.name_fi}</span>
            </Card>
          );
        })}
      </div>
    </div>
  )
}
