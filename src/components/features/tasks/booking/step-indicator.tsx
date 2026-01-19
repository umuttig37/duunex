interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  allowNavigateBack?: boolean;
}

export default function StepIndicator({ currentStep, totalSteps, onStepClick, allowNavigateBack = true }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "📋 Valitse kategoria", icon: "📋" },
    { number: 2, label: "✏️ Anna tehtävän tiedot", icon: "✏️" },
    { number: 3, label: "📢 Määritä julkaisutapa", icon: "📢" },
    { number: 4, label: "👨‍🔧 Valitse tekijä", icon: "👨‍🔧" },
    { number: 5, label: "✅ Yhteenveto & Vahvistus", icon: "✅" },
  ];

  const displayedSteps = steps.slice(0, totalSteps);

  const hasClickableSteps = allowNavigateBack && onStepClick && currentStep > 1;

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 mx-2 sm:mx-0">
        {/* Helper text for clickable steps */}
        {hasClickableSteps && (
          <div className="text-center mb-3">
            <p className="text-xs text-gray-500 font-medium">
              💡 Klikkaa vihreää merkkiä palataksesi aikaisempaan vaiheeseen
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between relative">
          {/* Background progress line - hidden on mobile, visible on larger screens */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded-full -z-10 hidden sm:block"></div>
          <div
            className="absolute top-6 left-6 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 -z-10 hidden sm:block"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>

          {displayedSteps.map((step) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            const isClickable = allowNavigateBack && (isCompleted || isActive) && onStepClick;
            
            return (
              <div key={step.number} className="flex flex-col items-center text-center relative flex-1">
                <button
                  type="button"
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border-2 transition-all duration-200
                    ${isActive ? "border-blue-600 bg-blue-100 text-blue-700" : isCompleted ? "border-green-400 bg-green-50 text-green-700" : "border-gray-300 bg-white text-gray-400"}
                    ${isClickable ? "hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transform hover:scale-105 active:scale-95" : "cursor-default"}
                    ${isClickable ? "focus:outline-none focus:ring-2 focus:ring-indigo-500" : ""}
                  `}
                  onClick={() => isClickable && onStepClick(step.number)}
                  aria-label={isClickable ? `Siirry vaiheeseen ${step.label}` : step.label}
                  disabled={!isClickable}
                  title={isClickable ? `Klikkaa palataksesi vaiheeseen: ${step.label}` : undefined}
                >
                  {step.icon}
                </button>
                <span className={`mt-2 text-xs font-medium ${isActive ? "text-blue-700" : isCompleted ? "text-green-700" : "text-gray-400"}`}>
                  {step.label}
                </span>
                {/* Mobile labels - shorter text */}
                <span 
                  className={`text-xs mt-2 block font-medium transition-colors duration-300 sm:hidden px-1 text-center ${
                    currentStep >= step.number ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {step.number === 1 && "Kategoria"}
                  {step.number === 2 && "Tiedot"}
                  {step.number === 3 && "Julkaisu"}
                  {step.number === 4 && "Tekijä"}
                  {step.number === 5 && "Valmis"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ...existing code...
  