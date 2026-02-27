'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface FloatingFeedbackButtonProps {
  onOpenDialog: () => void;
}

export default function FloatingFeedbackButton({ onOpenDialog }: FloatingFeedbackButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  // Pages where the feedback button should NOT appear
  const excludedPages = [
    '/admin',
    '/login',
    '/signup',
    '/luo-tehtava',
    '/dashboard/messages',
    '/api',
  ];

  // Check if we're on a dashboard page for special styling
  const isDashboardPage = pathname.startsWith('/dashboard');

  // Check if current page should show feedback button
  const shouldShowButton = !excludedPages.some(excluded =>
    pathname.startsWith(excluded)
  );

  useEffect(() => {
    // Show button after a delay to avoid being intrusive
    const timer = setTimeout(() => {
      if (shouldShowButton) {
        setIsVisible(true);
      }
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, [shouldShowButton, pathname]);

  // Don't render if not visible or on excluded pages
  if (!isVisible || !shouldShowButton) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 right-6 ${isDashboardPage ? 'z-[9999]' : 'z-50'}`}>
      <button
        onClick={onOpenDialog}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative flex items-center justify-center
          ${isDashboardPage ? 'px-4 py-3 rounded-lg' : 'px-3 py-2 rounded-lg'}
          bg-primary hover:bg-primary/90 
          text-white shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          ${isHovered ? 'scale-105' : 'scale-100'}
          focus:outline-none focus:ring-4 focus:ring-primary/20
          animate-bounce-gentle
          font-medium text-sm
        `}
        aria-label="Anna palautetta TaskMVP:stä"
      >
        {isDashboardPage ? (
          <span className="whitespace-nowrap">Anna palautetta</span>
        ) : (
          <span className="whitespace-nowrap text-xs font-semibold">Anna palautetta</span>
        )}

        {/* Pulse animation for attention */}
        <div className={`absolute inset-0 ${isDashboardPage ? 'rounded-lg' : 'rounded-lg'} bg-primary animate-ping opacity-20`}></div>
      </button>
    </div>
  );
}

// Add custom styles for gentle bounce animation
export const feedbackButtonStyles = `
  @keyframes bounce-gentle {
    0%, 20%, 53%, 80%, 100% {
      animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
      transform: translate3d(0, -8px, 0);
    }
    70% {
      animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
      transform: translate3d(0, -4px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }

  .animate-bounce-gentle {
    animation: bounce-gentle 3s ease-in-out infinite;
  }
`;