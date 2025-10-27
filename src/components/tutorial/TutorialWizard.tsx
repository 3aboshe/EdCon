import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTutorial, TutorialStep } from '../../contexts/TutorialContext';

interface TutorialWizardProps {
  className?: string;
}

const TutorialWizard: React.FC<TutorialWizardProps> = ({ className = '' }) => {
  const { 
    isActive, 
    currentStep, 
    nextStep, 
    previousStep, 
    skipTutorial, 
    completeTutorial,
    progress,
    totalSteps 
  } = useTutorial();
  
  const { t, i18n } = useTranslation();
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, width: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isRtl = ['ar', 'ku-sorani', 'ku-badini', 'syr'].includes(i18n.language);

  // Highlight target element
  useEffect(() => {
    if (!isActive || !currentStep?.target) {
      if (highlightedElement) {
        highlightedElement.style.removeProperty('z-index');
        highlightedElement.style.removeProperty('position');
        highlightedElement.style.removeProperty('box-shadow');
        highlightedElement.style.removeProperty('border');
        setHighlightedElement(null);
      }
      return;
    }

    const targetElement = document.querySelector(currentStep.target) as HTMLElement;
    if (targetElement) {
      // Store original styles
      const originalZIndex = targetElement.style.zIndex;
      const originalPosition = targetElement.style.position;
      
      // Apply highlight styles
      targetElement.style.zIndex = '9999';
      targetElement.style.position = 'relative';
      targetElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.3)';
      targetElement.style.border = '2px solid rgb(59, 130, 246)';
      targetElement.style.borderRadius = '8px';
      
      setHighlightedElement(targetElement);

      // Calculate tooltip position
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.pageYOffset;
      const scrollX = window.pageXOffset;
      
      let top = rect.top + scrollY;
      let left = rect.left + scrollX;
      let width = rect.width;

      // Adjust position based on step position preference
      switch (currentStep.position) {
        case 'top':
          top = rect.top + scrollY - 120;
          left = rect.left + scrollX + (rect.width / 2) - 200;
          width = 400;
          break;
        case 'bottom':
          top = rect.bottom + scrollY + 20;
          left = rect.left + scrollX + (rect.width / 2) - 200;
          width = 400;
          break;
        case 'left':
          top = rect.top + scrollY + (rect.height / 2) - 100;
          left = rect.left + scrollX - 420;
          width = 400;
          break;
        case 'right':
          top = rect.top + scrollY + (rect.height / 2) - 100;
          left = rect.right + scrollX + 20;
          width = 400;
          break;
        case 'center':
          top = window.innerHeight / 2 - 150;
          left = window.innerWidth / 2 - 200;
          width = 400;
          break;
      }

      // Ensure tooltip stays within viewport
      if (left < 20) left = 20;
      if (left + width > window.innerWidth - 20) left = window.innerWidth - width - 20;
      if (top < 20) top = 20;
      if (top + 300 > window.innerHeight - 20) top = window.innerHeight - 320;

      setTooltipPosition({ top, left, width });

      // Execute action if provided
      if (currentStep.action) {
        setTimeout(() => {
          currentStep.action?.();
        }, 500);
      }

      return () => {
        // Restore original styles
        targetElement.style.zIndex = originalZIndex;
        targetElement.style.position = originalPosition;
        targetElement.style.removeProperty('box-shadow');
        targetElement.style.removeProperty('border');
        targetElement.style.removeProperty('border-radius');
      };
    }
  }, [isActive, currentStep]);

  // Scroll to highlighted element
  useEffect(() => {
    if (highlightedElement && currentStep?.position !== 'center') {
      highlightedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [highlightedElement, currentStep]);

  if (!isActive || !currentStep) return null;

  const handleNext = () => {
    if (currentStep.requireInteraction) {
      // For steps requiring interaction, just move to next step
      nextStep();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSkip = () => {
    skipTutorial();
  };

  const handleComplete = () => {
    completeTutorial();
  };

  const isLastStep = progress === totalSteps;
  const isFirstStep = progress === 1;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={currentStep.requireInteraction ? undefined : handleSkip}
      />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed z-[9999] bg-white rounded-lg shadow-2xl p-6 max-w-md ${isRtl ? 'rtl' : 'ltr'}`}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          width: `${tooltipPosition.width}px`
        }}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t('step')} {progress} {t('of')} {totalSteps}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t('skip_tutorial')}
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            {currentStep.title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isFirstStep
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('previous')}
          </button>
          
          <div className="flex space-x-2">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                {t('skip')}
              </button>
            )}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              {isLastStep ? t('finish') : t('next')}
            </button>
          </div>
        </div>

        {/* Arrow pointer */}
        {currentStep.position !== 'center' && currentStep.target && (
          <div 
            className={`absolute w-4 h-4 bg-white transform rotate-45 ${
              currentStep.position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2' :
              currentStep.position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2' :
              currentStep.position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2' :
              currentStep.position === 'right' ? 'left-[-8px] top-1/2 -translate-y-1/2' :
              ''
            }`}
          />
        )}
      </div>
    </>
  );
};

export default TutorialWizard;