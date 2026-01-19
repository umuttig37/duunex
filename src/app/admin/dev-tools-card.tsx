'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { resetDatabaseAction } from '../actions';

export const DevToolsCard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetDatabase = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setConfirmReset(false);
    
    try {
      const result = await resetDatabaseAction();
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Odottamaton virhe tapahtui'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kehitystyökalut</CardTitle>
        <p className="text-sm text-gray-600">Vain kehitysympäristössä käytettävät työkalut</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p><strong>Varoitus:</strong> Tämä toiminto poistaa KAIKKI tiedot ja käyttäjät paitsi admin-käyttäjän.</p>
            <p>Poistetaan: tehtävät, tarjoukset, viestit, arvostelut, käyttäjät, profiilit, nostopyynnöt, pankkitiedot, jne.</p>
            <p className="font-medium text-red-600 mt-2">⚠️ AINOASTAAN ADMIN-KÄYTTÄJÄ SÄILYY!</p>
          </div>
          
          {confirmReset && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">
                Oletko varma? Tämä toiminto ei ole palautettavissa!
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleResetDatabase}
              variant={confirmReset ? "destructive" : "outline"}
              disabled={isLoading}
              className={confirmReset ? "" : "border-red-300 text-red-700 hover:bg-red-50"}
            >
              {isLoading ? 'Nollataan...' : confirmReset ? 'Kyllä, nollaa tietokanta' : 'Nollaa Tietokanta'}
            </Button>
            
            {confirmReset && (
              <Button 
                onClick={() => setConfirmReset(false)}
                variant="outline"
                disabled={isLoading}
              >
                Peruuta
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 