import React, { useState, ReactNode } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { SmartFormMode, SmartFormConfig } from '../../types';

interface ProgressiveFormProps {
  children: ReactNode;
  mode: SmartFormMode;
  onModeChange: (mode: SmartFormMode) => void;
  currentStep?: number;
  totalSteps?: number;
  title?: string;
  description?: string;
}

const ProgressiveForm: React.FC<ProgressiveFormProps> = ({
  children,
  mode,
  onModeChange,
  currentStep = 0,
  totalSteps = 1,
  title,
  description
}) => {
  const renderModeSelector = () => (
    <div className="flex justify-center mb-6">
      <div className="inline-flex rounded-lg shadow-sm" role="group">
        <Button
          variant={mode === 'simple' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('simple')}
          className="rounded-l-lg rounded-r-none"
        >
          Simple
        </Button>
        <Button
          variant={mode === 'advanced' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('advanced')}
          className="rounded-none"
        >
          Advanced
        </Button>
        <Button
          variant={mode === 'wizard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('wizard')}
          className="rounded-r-lg rounded-l-none"
        >
          Wizard
        </Button>
        <Button
          variant={mode === 'bulk' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('bulk')}
          className="rounded-l-lg rounded-r-none"
        >
          Bulk
        </Button>
      </div>
    </div>
  );

  const renderWizardProgress = () => {
    if (mode !== 'wizard' || !totalSteps) {
      return null;
    }

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Step {currentStep + 1} of {totalSteps}
          </h3>
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        {title && (
          <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
        )}
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
    );
  };

  const renderWizardNavigation = () => {
    if (mode !== 'wizard' || !totalSteps) {
      return null;
    }

    return (
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => onModeChange && onModeChange(mode)}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          onClick={() => onModeChange && onModeChange(mode)}
          disabled={currentStep >= totalSteps - 1}
        >
          {currentStep < totalSteps - 1 ? 'Next' : 'Finish'}
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Form Configuration
          </h2>
          {renderModeSelector()}
        </div>

        {mode === 'wizard' && renderWizardProgress()}

        <div className="mt-6">
          {children}
        </div>

        {mode === 'wizard' && renderWizardNavigation()}
      </div>
    </Card>
  );
};

export default ProgressiveForm;