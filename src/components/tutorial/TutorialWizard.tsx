import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
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

    let targetElement: HTMLElement | null = null;
    
    // Try multiple selectors if needed
    if (currentStep.target.includes(',')) {
      // Multiple selectors provided
      const selectors = currentStep.target.split(',').map(s => s.trim());
      for (const selector of selectors) {
        targetElement = document.querySelector(selector) as HTMLElement;
        if (targetElement) break;
      }
    } else {
      // Single selector
      targetElement = document.querySelector(currentStep.target) as HTMLElement;
    }
    
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
          left = rect.left + scrollX + (rect.width / 2) - 250;
          width = 500;
          break;
        case 'bottom':
          top = rect.bottom + scrollY + 20;
          left = rect.left + scrollX + (rect.width / 2) - 250;
          width = 500;
          break;
        case 'left':
          top = rect.top + scrollY + (rect.height / 2) - 100;
          left = rect.left + scrollX - 520;
          width = 500;
          break;
        case 'right':
          top = rect.top + scrollY + (rect.height / 2) - 100;
          left = rect.right + scrollX + 20;
          width = 500;
          break;
        case 'center':
          // Calculate perfect centering considering tooltip dimensions
          const tooltipHeight = 300; // Approximate height of the tooltip
          const tooltipWidth = 500; // Width of the tooltip
          top = (window.innerHeight - tooltipHeight) / 2;
          left = (window.innerWidth - tooltipWidth) / 2;
          width = tooltipWidth;
          break;
      }

      // Responsive adjustments for mobile devices
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Adjust width for mobile screens
        width = Math.min(width, window.innerWidth - 40);
        
        // Recalculate left position for centered tooltips on mobile
        if (currentStep.position === 'center') {
          left = (window.innerWidth - width) / 2;
        }
        
        // Adjust position for side tooltips on mobile
        if (currentStep.position === 'left' || currentStep.position === 'right') {
          // Position below the element on mobile
          top = rect.bottom + scrollY + 10;
          left = rect.left + scrollX;
        }
      }

      // Ensure tooltip stays within viewport
      const padding = isMobile ? 10 : 20;
      if (left < padding) left = padding;
      if (left + width > window.innerWidth - padding) left = window.innerWidth - width - padding;
      if (top < padding) top = padding;
      const tooltipHeight = isMobile ? 250 : 300;
      if (top + tooltipHeight > window.innerHeight - padding) top = window.innerHeight - tooltipHeight - padding;

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
    } else {
      // Element not found, log error and continue with centered tooltip
      console.warn(`Tutorial element not found: ${currentStep.target}`);
      
      // Show centered tooltip with warning
      setTooltipPosition({
        top: (window.innerHeight - 300) / 2,
        left: (window.innerWidth - 500) / 2,
        width: 500
      });
      
      // Execute action if provided
      if (currentStep.action) {
        setTimeout(() => {
          currentStep.action?.();
        }, 500);
      }
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

  const isLastStep = progress === totalSteps;
  const isFirstStep = progress === 1;

  if (!isActive || !currentStep) return null;

  // Handle step transitions with animation
  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setIsVisible(false);
    
    setTimeout(() => {
      if (currentStep.requireInteraction) {
        // For steps requiring interaction, just move to next step
        nextStep();
      } else {
        nextStep();
      }
      setIsTransitioning(false);
      setIsVisible(true);
    }, 300);
  }, [currentStep.requireInteraction, nextStep]);

  const handlePrevious = useCallback(() => {
    setIsTransitioning(true);
    setIsVisible(false);
    
    setTimeout(() => {
      previousStep();
      setIsTransitioning(false);
      setIsVisible(true);
    }, 300);
  }, [previousStep]);

  const handleSkip = useCallback(() => {
    setIsTransitioning(true);
    setIsVisible(false);
    
    setTimeout(() => {
      skipTutorial();
    }, 300);
  }, [skipTutorial]);

  const handleComplete = useCallback(() => {
    setIsTransitioning(true);
    setIsVisible(false);
    
    setTimeout(() => {
      completeTutorial();
    }, 300);
  }, [completeTutorial]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || isTransitioning) return;
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (!isLastStep) handleNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (!isFirstStep) handlePrevious();
          break;
        case 'Escape':
          e.preventDefault();
          handleSkip();
          break;
        case 'Enter':
          e.preventDefault();
          if (isLastStep) handleComplete();
          else handleNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isTransitioning, isLastStep, isFirstStep, handleNext, handlePrevious, handleSkip, handleComplete]);

  // Trigger visibility animation when component mounts or step changes
  useEffect(() => {
    if (isActive && currentStep) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep]);

  return (
    <>
      {/* Only render if tutorial is active and we have a current step */}
      {isActive && currentStep && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity duration-300 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={currentStep.requireInteraction ? undefined : handleSkip}
            aria-label={t('tutorial_overlay')}
            role="presentation"
          />
          
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className={`fixed z-[9999] bg-white rounded-lg shadow-2xl p-6 transition-all duration-300 transform ${
              isRtl ? 'rtl' : 'ltr'
            } ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              width: `${tooltipPosition.width}px`,
              minWidth: '450px',
              maxWidth: '600px'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            aria-describedby="tutorial-content"
          >
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600" id="tutorial-progress">
              {t('step')} {progress} {t('of')} {totalSteps}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label={t('skip_tutorial')}
            >
              {t('skip_tutorial')}
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={progress} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={t('tutorial_progress')}>
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 id="tutorial-title" className="text-lg font-bold text-gray-800 mb-3">
            {t(currentStep.title)}
          </h3>
          <p id="tutorial-content" className="text-gray-600 leading-relaxed">
            {t(currentStep.content)}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep || isTransitioning}
            className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isFirstStep || isTransitioning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label={t('previous')}
          >
            {t('previous')}
          </button>
          
          <div className="flex space-x-2">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                disabled={isTransitioning}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('skip')}
              >
                {t('skip')}
              </button>
            )}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              disabled={isTransitioning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isLastStep ? t('finish') : t('next')}
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
    )}
  </>
);
};

export default TutorialWizard;