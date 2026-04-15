'use client';

import { createPaytrailPayment } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/shared/use-toast';
import { type User } from '@supabase/supabase-js';
import { AlertTriangle, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PaymentFlowProps {
  taskId: string;
  offerId: string;
  taskTitle: string;
  taskerName: string;
  amount: number;
  user: User | null;
  onPaymentSuccess?: () => void;
  onCancel: () => void;
}

export default function PaymentFlow({
  taskId,
  offerId,
  taskTitle,
  taskerName,
  amount,
  user,
  onPaymentSuccess,
  onCancel,
}: PaymentFlowProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [showSimulationOption, setShowSimulationOption] = useState(false);

  const platformFee = Math.round(amount * 0.05);
  const totalAmount = amount + platformFee;

  const handlePaytrailPayment = async () => {
    if (!user) {
      toast({
        title: 'Kirjaudu sisään',
        description: 'Ole hyvä ja kirjaudu sisään jatkaaksesi maksuun.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await createPaytrailPayment(
        taskId,
        totalAmount,
        user.email!,
        user.id,
        taskTitle
      );

      if (result.success && result.data?.paymentUrl) {
        // Redirect the user to the Paytrail payment page
        window.location.href = result.data.paymentUrl;
      } else {
        throw new Error(
          result.error || 'Maksulinkin luonti epäonnistui. Yritä uudelleen.'
        );
      }
    } catch (error) {
      console.error('Maksuvirhe:', error);

      toast({
        title: 'Maksun luonnissa tapahtui virhe',
        description:
          (error instanceof Error && error.message) ||
          'Paytrail-palvelu ei ole tällä hetkellä käytettävissä. Voit käyttää maksusimulaatiota testaukseen.',
        variant: 'destructive',
        duration: 8000,
      });

      setShowSimulationOption(true);
      setIsProcessing(false);
    }
  };

  const handleSimulatedPayment = async () => {
    setIsProcessing(true);

    try {
      // This part of the logic needs to be updated to use the new action
      // For now, we'll keep it as is, but it will likely fail or need adjustment
      // depending on the new action's return type and error handling.
      // The original `acceptOfferAndFinalizePayment` was removed from imports.
      // Assuming a placeholder or that this function will be refactored later.
      // For now, we'll just throw an error to indicate it's not fully implemented
      // with the new action's return type.
      throw new Error(
        'Simulaation käyttöönotto on vielä kesken. Paytrail-maksu on käytettävä.'
      );

      // if (result.success) {
      //   toast({
      //     title: 'Simuloitu maksu onnistui!',
      //     description: 'Tehtävä on nyt "maksettu" ja tekijälle on ilmoitettu.',
      //     variant: 'default',
      //     duration: 5000,
      //   })

      //   if (onPaymentSuccess) {
      //     onPaymentSuccess()
      //   }
      // } else {
      //   throw new Error(result.message || 'Simuloitu maksu epäonnistui')
      // }
    } catch (error) {
      console.error('Simulaatiovirhe:', error);
      toast({
        title: 'Virhe simuloidussa maksussa',
        description:
          error instanceof Error ? error.message : 'Yritä uudelleen.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-md min-h-0 flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Vahvista maksu
          </CardTitle>
          <CardDescription className="text-sm">
            {useSimulation || showSimulationOption
              ? 'Käytä maksusimulaatiota testaukseen'
              : 'Vahvista maksusi ja siirry maksamaan Paytrailin kautta.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-4">
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
              Tilauksen yhteenveto:
            </h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-600 flex-shrink-0">Tehtävä:</span>
                <span className="font-medium text-right break-words">
                  {taskTitle}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-600 flex-shrink-0">Tekijä:</span>
                <span className="font-medium text-right break-words">
                  {taskerName}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-600">Palvelun hinta:</span>
                <span className="font-medium">{amount}€</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-600">Palvelumaksu (5%):</span>
                <span className="font-medium">{platformFee}€</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-sm sm:text-lg">
                <span>Yhteensä:</span>
                <span className="text-sky-600">{totalAmount}€</span>
              </div>
            </div>
          </div>

          {showSimulationOption && (
            <div className="bg-amber-50 p-3 sm:p-4 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-amber-900 mb-1 text-sm">
                    Paytrail ei käytettävissä
                  </h5>
                  <p className="text-xs sm:text-sm text-amber-800">
                    Voit käyttää maksusimulaatiota testataksesi sovelluksen
                    toimintaa. Tämä on vain testausominaisuus.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2 text-sm">
              Maksun jälkeen:
            </h5>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• Tehtävä merkitään maksetuksi</li>
              <li>• Viestikanava avautuu teidän välillenne</li>
              <li>• Saat vahvistuksen sähköpostiisi</li>
            </ul>
          </div>

          <div className="space-y-3 flex-shrink-0">
            {!useSimulation && !showSimulationOption ? (
              <Button
                onClick={handlePaytrailPayment}
                disabled={isProcessing}
                className="w-full bg-sky-600 hover:bg-sky-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    <span className="text-sm sm:text-base">
                      Siirrytään maksuun...
                    </span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-sm sm:text-base">
                      Maksa {totalAmount}€ Paytraililla
                    </span>
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSimulatedPayment}
                  disabled={isProcessing}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                      <span className="text-sm sm:text-base">
                        Simuloidaan maksua...
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="text-sm sm:text-base">
                        Simuloi maksu (Testaus)
                      </span>
                    </>
                  )}
                </Button>

                {showSimulationOption && (
                  <Button
                    onClick={() => {
                      setShowSimulationOption(false);
                      handlePaytrailPayment();
                    }}
                    disabled={isProcessing}
                    variant="outline"
                    className="w-full"
                  >
                    <span className="text-sm sm:text-base">
                      Yritä Paytrailia uudelleen
                    </span>
                  </Button>
                )}
              </>
            )}

            <Button
              onClick={onCancel}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              <span className="text-sm sm:text-base">Peruuta</span>
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            {useSimulation || showSimulationOption
              ? 'Tämä on testausominaisuus. Oikeaa maksua ei veloiteta.'
              : 'Sinut ohjataan suojattuun Paytrail-maksupalveluun.'}
          </p>

          {/* Debug-linkki kehittäjille */}
          {process.env.NODE_ENV === 'development' && !showSimulationOption && (
            <button
              onClick={() => setUseSimulation(true)}
              className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center mt-2 py-1"
            >
              Käytä simulaatiota (vain kehityksessä)
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
