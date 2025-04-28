
import React, { useMemo } from 'react';
import { useTimer, TimerMode } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

export const TimerDisplay: React.FC = () => {
  const { 
    mode, 
    timeLeft, 
    isActive, 
    isPaused, 
    startTimer, 
    pauseTimer, 
    resetTimer,
    skipTimer,
    focusTime,
    shortBreakTime,
    longBreakTime,
    setMode
  } = useTimer();

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const totalTime = useMemo(() => {
    switch (mode) {
      case 'focus': return focusTime;
      case 'shortBreak': return shortBreakTime;
      case 'longBreak': return longBreakTime;
    }
  }, [mode, focusTime, shortBreakTime, longBreakTime]);

  const progress = useMemo(() => {
    return (1 - timeLeft / totalTime) * 100;
  }, [timeLeft, totalTime]);

  const getButtonClass = (currentMode: string) => {
    return cn(
      'rounded-full px-4 py-1 font-medium transition-all',
      mode === currentMode ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'
    );
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
  };

  return (
    <div className={cn(
      'w-full max-w-xl mx-auto transition-all-smooth rounded-2xl overflow-hidden px-6 py-8',
      `timer-${mode}`
    )}>
      {/* Progress Bar */}
      <div className="relative h-1 w-full bg-white/10 mb-6 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all-smooth progress-${mode}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center mb-8 space-x-4 text-white">
        <button 
          onClick={() => handleModeChange('focus')} 
          className={getButtonClass('focus')}
        >
          Focus
        </button>
        <button 
          onClick={() => handleModeChange('shortBreak')} 
          className={getButtonClass('shortBreak')}
        >
          Short Break
        </button>
        <button 
          onClick={() => handleModeChange('longBreak')} 
          className={getButtonClass('longBreak')}
        >
          Long Break
        </button>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-white text-8xl font-extrabold tracking-wider mb-6 animate-pulse-subtle">
          {formattedTime}
        </h1>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-4">
        {!isActive || isPaused ? (
          <Button 
            onClick={startTimer} 
            className={cn(
              'px-14 py-6 text-lg font-semibold transition-all-smooth hover:scale-105',
              `timer-button-${mode} text-white border-none shadow-lg hover:bg-white/20`
            )}
          >
            <Play className="mr-2" size={20} />
            {isPaused ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <Button 
            onClick={pauseTimer} 
            className={cn(
              'px-14 py-6 text-lg font-semibold transition-all-smooth hover:scale-105',
              `timer-button-${mode} text-white border-none shadow-lg hover:bg-white/20`
            )}
          >
            <Pause className="mr-2" size={20} />
            Pause
          </Button>
        )}
      </div>

      {/* Extra Buttons */}
      <div className="flex justify-center space-x-4 mt-4">
        <Button
          onClick={resetTimer}
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <RotateCcw size={18} className="mr-1" />
          Reset
        </Button>
        
        <Button
          onClick={skipTimer}
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <SkipForward size={18} className="mr-1" />
          Skip
        </Button>
      </div>
    </div>
  );
};
