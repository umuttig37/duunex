'use client';

import { useState } from 'react';
import FloatingFeedbackButton from './floating-feedback-button';
import FeedbackDialog from './feedback-dialog';

export default function FeedbackProvider() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <FloatingFeedbackButton onOpenDialog={() => setIsDialogOpen(true)} />
      <FeedbackDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </>
  );
}