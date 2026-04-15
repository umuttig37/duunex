'use client'

import { createTaskOffer } from '@/app/dashboard/tasks/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/shared/use-toast'
import { CheckCircle, Send } from 'lucide-react'
import { useActionState, useState, useTransition } from 'react'

interface TaskOfferFormProps {
  taskId: string
  taskBudget?: number | null
  onSuccess?: () => void
  hasAlreadyOffered?: boolean
}

export default function TaskOfferForm({ taskId, taskBudget, onSuccess, hasAlreadyOffered }: TaskOfferFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [state, formAction] = useActionState(createTaskOffer, { success: false, message: '' })

  if (hasAlreadyOffered) {
    return (
      <Card className="w-full bg-slate-50 border-dashed">
        <CardHeader className="flex flex-row items-center gap-4">
          <CheckCircle className="h-10 w-10 text-sky-500" />
          <div>
            <CardTitle className="text-lg">Olet jo lähettänyt tarjouksen</CardTitle>
            <CardDescription className="text-sm">
              Asiakas on saanut tarjouksesi.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const handleSubmit = (formData: FormData) => {
    formData.set('taskId', taskId)

    startTransition(async () => {
      const result = await createTaskOffer(state, formData)

      if (result.success) {
        toast({ title: 'Onnistui!', description: result.message })
        setIsOpen(false)
        onSuccess?.()
      } else {
        toast({ title: 'Virhe', description: result.message, variant: 'destructive' })
      }
    })
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full"
        variant="outline"
        size="lg"
      >
        <Send className="mr-2 h-4 w-4" />
        Luo tarjous
      </Button>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tee tarjous tähän tehtävään</CardTitle>
        <CardDescription>
          {taskBudget ? `Asiakkaan budjetti: ${taskBudget}€` : 'Määritä oma hintasi tehtävälle.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="offeredPrice">Tarjoushinta (€) *</Label>
            <Input
              id="offeredPrice"
              name="offeredPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder={taskBudget ? `${taskBudget}` : "Syötä hintasi"}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Viesti asiakkaalle</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Kerro lyhyesti kokemuksestasi ja miksi olet sopiva tähän tehtävään..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'Lähetetään...' : 'Lähetä tarjous'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Peruuta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 