'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/shared/use-toast'
import { ArrowLeftRight, Euro, Send } from 'lucide-react'
import { useState, useTransition, useEffect } from 'react'

interface CounterOfferFormProps {
  offerId: string
  originalPrice: number
  taskBudget?: number | null
  taskerName: string
  taskTitle: string
  onCounterOfferSent?: () => void
  className?: string
}

export default function CounterOfferForm({
  offerId,
  originalPrice,
  taskBudget,
  taskerName,
  taskTitle,
  onCounterOfferSent,
  className = ''
}: CounterOfferFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [counterPrice, setCounterPrice] = useState<string>('')
  const [counterMessage, setCounterMessage] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  // Auto-populate message when price changes
  useEffect(() => {
    if (counterPrice && !isNaN(parseFloat(counterPrice))) {
      const price = parseFloat(counterPrice)
      setCounterMessage(`Hei! Kiitos tarjouksesta, tässä vastatarjoukseni: ${price}€`)
    }
  }, [counterPrice])

  const resetForm = () => {
    setCounterPrice('')
    setCounterMessage('')
  }

  const handleSubmitCounterOffer = async () => {
    if (!counterPrice || !counterMessage.trim()) {
      toast({
        title: 'Puuttuvat tiedot',
        description: 'Täytä kaikki kentät.',
        variant: 'destructive'
      })
      return
    }

    const price = parseFloat(counterPrice)
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Virheellinen hinta',
        description: 'Anna kelvollinen hinta.',
        variant: 'destructive'
      })
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/counter-offers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            offerId,
            counterPrice: price,
            counterReason: 'Hintaneuvottelu',
            counterMessage: counterMessage.trim()
          }),
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: 'Vastaehdotus lähetetty!',
            description: 'Tekijä saa ilmoituksen vastaehdotuksestasi.',
          })
          setIsOpen(false)
          resetForm()
          onCounterOfferSent?.()
        } else {
          console.error('Counter offer error:', result)
          toast({
            title: 'Virhe',
            description: result.message || 'Vastaehdotuksen lähettäminen epäonnistui.',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Counter offer error:', error)
        toast({
          title: 'Virhe',
          description: 'Vastaehdotuksen lähettäminen epäonnistui.',
          variant: 'destructive'
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 ${className}`}
          onClick={() => {
            setIsOpen(true)
            resetForm()
          }}
        >
          <ArrowLeftRight className="h-4 w-4 mr-1" />
          Tee vastaehdotus
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-amber-600" />
            Vastaehdotus
          </DialogTitle>
          <DialogDescription>
            Ehdota uutta hintaa tekijälle <strong>{taskerName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price comparison */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-600">Tekijän tarjous</p>
                  <p className="text-lg font-semibold">{originalPrice}€</p>
                </div>
                {counterPrice && !isNaN(parseFloat(counterPrice)) && (
                  <>
                    <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                    <div className="text-right">
                      <p className="text-gray-600">Sinun ehdotuksesi</p>
                      <p className="text-lg font-semibold text-amber-600">{counterPrice}€</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Simple form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="counterPrice" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Vastaehdotus hinta (€)
              </Label>
              <Input
                id="counterPrice"
                type="number"
                step="0.01"
                min="0"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder="Esim. 45"
                className="mt-1 text-lg"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="counterMessage">Viesti tekijälle</Label>
              <Textarea
                id="counterMessage"
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Hei! Kiitos tarjouksesta, tässä vastatarjoukseni:"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmitCounterOffer}
            disabled={isPending || !counterPrice || !counterMessage.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700"
            size="lg"
          >
            {isPending ? (
              'Lähetetään...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Lähetä vastaehdotus
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 