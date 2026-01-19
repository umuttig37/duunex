// This file is kept for backward compatibility
// The counter offer system has been simplified and no longer uses templates

export interface CounterOfferTemplate {
  id: string
  reason: string
  category: 'price' | 'time' | 'scope' | 'other'
  messageTemplate: string
  priceAdjustment?: 'decrease' | 'increase' | 'negotiate'
  icon: React.ReactNode
  color: string
}

// Legacy template array kept for any existing imports
export const COUNTER_OFFER_TEMPLATES: CounterOfferTemplate[] = []

interface CounterOfferTemplatesSelectorProps {
  onSelectTemplate: (template: CounterOfferTemplate) => void
  originalPrice: number
  className?: string
}

// This component is deprecated - the counter offer form is now simplified
export default function CounterOfferTemplatesSelector({
  onSelectTemplate,
  originalPrice,
  className = ''
}: CounterOfferTemplatesSelectorProps) {
  return (
    <div className={`space-y-4 text-center ${className}`}>
      <p className="text-gray-600">
        This template selector has been simplified. 
        The counter offer form now uses a direct price and message input.
      </p>
    </div>
  )
}

// Utility function kept for backward compatibility
export function formatCounterOfferMessage(
  template: string,
  suggestedPrice: number,
  additionalContext?: string
): string {
  // Return the simple default message format
  return `Hei! Kiitos tarjouksesta, tässä vastatarjoukseni: ${suggestedPrice}€`
} 