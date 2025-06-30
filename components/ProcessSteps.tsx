import React from 'react';
import { ProcessStage } from '../types';

interface ProcessStepsProps {
  currentStage: ProcessStage;
  isLoading: boolean;
}

const steps = [
  { stage: ProcessStage.INPUT, label: 'Text Input', icon: '📝' },
  { stage: ProcessStage.FACT_EXTRACTION, label: 'Fact Extraction', icon: '🔍' },
  { stage: ProcessStage.FACT_VERIFICATION, label: 'Fact Verification', icon: '✅' },
  { stage: ProcessStage.COMPLETED, label: 'Completed', icon: '🏯' },
];

const ProcessSteps: React.FC<ProcessStepsProps> = ({ currentStage, isLoading: _isLoading }) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.stage === currentStage);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="mb-8">
      <div className="w-full flex flex-row items-start justify-between max-w-3xl mx-auto px-4">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
        

          return (
            <div key={step.stage} className="flex flex-col items-center flex-none w-36">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all duration-300
                    ${isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500'}
                  `}
                >
                  {step.icon}
                </div>
                <span className="mt-2 text-xs font-semibold text-gray-700 text-center">
                  {step.label}
                </span>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessSteps;
