import { useEffect, useState } from 'react';
import { Progress } from './ui/progress';
import { Music, Sparkles, MapPin, Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  type: 'music' | 'concerts';
  duration?: number; // Total duration in milliseconds (default: smart timing)
  actualProgress?: number; // Actual progress from 0-100
  currentStepIndex?: number; // Current step being executed
}

export function LoadingProgress({ type, duration, actualProgress, currentStepIndex }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'actual' | 'simulated'>('simulated');

  const musicSteps = [
    { icon: Music, label: 'Connecting to Spotify...', progress: 20 },
    { icon: Sparkles, label: 'Analyzing your top artists...', progress: 50 },
    { icon: Music, label: 'Loading your saved tracks...', progress: 80 },
    { icon: Sparkles, label: 'Building your music profile...', progress: 100 },
  ];

  const concertSteps = [
    { icon: MapPin, label: 'Locating concerts in your area...', progress: 25 },
    { icon: Music, label: 'Extracting artist information...', progress: 50 },
    { icon: Sparkles, label: 'Matching concerts to your taste...', progress: 80 },
    { icon: Sparkles, label: 'Calculating vibe scores...', progress: 100 },
  ];

  const steps = type === 'music' ? musicSteps : concertSteps;
  
  // Calculate timing based on total duration
  // If no duration specified, use smart defaults (shorter for demo/fast loads)
  const totalDuration = duration || (type === 'music' ? 5000 : 4000);
  const stepDuration = totalDuration / steps.length;

  // Determine if we're using actual progress tracking
  useEffect(() => {
    if (actualProgress !== undefined && currentStepIndex !== undefined) {
      setMode('actual');
      setProgress(actualProgress);
      setCurrentStep(currentStepIndex);
    } else {
      setMode('simulated');
    }
  }, [actualProgress, currentStepIndex]);

  // Auto-progress for simulated mode only
  useEffect(() => {
    if (mode === 'simulated') {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [mode, stepDuration, steps.length]);

  // Smooth progress animation for simulated mode only
  useEffect(() => {
    if (mode === 'simulated') {
      const targetProgress = steps[currentStep].progress;
      const startProgress = progress;
      const progressDiff = targetProgress - startProgress;
      const frames = 50; // Number of animation frames
      const frameDuration = stepDuration / frames;
      const increment = progressDiff / frames;
      
      let frameCount = 0;
      
      const progressInterval = setInterval(() => {
        frameCount++;
        setProgress((prev) => {
          const next = startProgress + (increment * frameCount);
          
          // Stop at target
          if ((increment > 0 && next >= targetProgress) || 
              (increment < 0 && next <= targetProgress) ||
              frameCount >= frames) {
            clearInterval(progressInterval);
            return targetProgress;
          }
          
          return next;
        });
      }, frameDuration);

      return () => clearInterval(progressInterval);
    }
  }, [mode, currentStep, stepDuration]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-8">
      {/* Icon and Label */}
      <div className="text-center space-y-4">
        <div className="relative inline-flex items-center justify-center">
          {/* Spinning background ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 animate-spin" 
               style={{ animationDuration: '3s' }}>
            <div className="absolute inset-[3px] rounded-full bg-white"></div>
          </div>
          
          {/* Icon */}
          <div className="relative z-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-6 shadow-lg shadow-orange-300">
            <CurrentIcon className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-800">
            {steps[currentStep].label}
          </h3>
          <p className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progress} 
          className="h-3 bg-orange-100"
        />
        <p className="text-xs text-center text-gray-500">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center px-2">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isComplete = idx < currentStep;
          const isCurrent = idx === currentStep;
          
          return (
            <div 
              key={idx}
              className={`flex flex-col items-center gap-1 transition-all ${
                isCurrent ? 'scale-110' : ''
              }`}
            >
              <div 
                className={`rounded-full p-2 transition-all ${
                  isComplete 
                    ? 'bg-orange-600 text-white' 
                    : isCurrent 
                    ? 'bg-orange-500 text-white animate-pulse' 
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <StepIcon className="w-4 h-4" />
              </div>
              {isComplete && (
                <div className="w-1 h-1 rounded-full bg-orange-600"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}