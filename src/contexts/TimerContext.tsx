
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerState {
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  isPaused: boolean;
  sessions: number;
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  totalFocusTime: number;
  sessionsCompleted: number;
  dailyReport: DailyReport[];
  lastTimeUpdated: number;
}

interface DailyReport {
  date: string;
  focusTime: number;
  sessions: number;
}

interface TimerContextType extends TimerState {
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: TimerMode) => void;
  skipTimer: () => void;
  setFocusTime: (minutes: number) => void;
  setShortBreakTime: (minutes: number) => void;
  setLongBreakTime: (minutes: number) => void;
}

const defaultDailyReport: DailyReport = {
  date: new Date().toISOString().split('T')[0],
  focusTime: 0,
  sessions: 0,
};

const defaultState: TimerState = {
  mode: 'focus',
  timeLeft: 25 * 60, // 25 minutes in seconds
  isActive: false,
  isPaused: false,
  sessions: 0,
  focusTime: 25 * 60, // 25 minutes in seconds
  shortBreakTime: 5 * 60, // 5 minutes in seconds
  longBreakTime: 15 * 60, // 15 minutes in seconds
  totalFocusTime: 0,
  sessionsCompleted: 0,
  dailyReport: [defaultDailyReport],
  lastTimeUpdated: Date.now(),
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TimerState>(() => {
    // Try to load state from localStorage
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      // Ensure the date in dailyReport is updated if it's a new day
      const today = new Date().toISOString().split('T')[0];
      if (!parsedState.dailyReport.some((report: DailyReport) => report.date === today)) {
        parsedState.dailyReport.push({
          date: today,
          focusTime: 0,
          sessions: 0,
        });
      }
      return {
        ...parsedState,
        lastTimeUpdated: Date.now(),
      };
    }
    return defaultState;
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | undefined>();
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Initialize audio with fallback beep sound
  useEffect(() => {
    // Try to load the notification sound
    audioRef.current = new Audio('/notification.mp3');
    
    // Set up error handling to use a fallback beep sound
    audioRef.current.addEventListener('error', () => {
      console.warn("Could not load notification sound, using fallback beep");
      audioRef.current = null;
    });
    
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('timerState', JSON.stringify(state));
  }, [state]);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    } else {
      // Fallback beep using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.5;
        
        oscillator.start();
        
        setTimeout(() => {
          oscillator.stop();
        }, 500);
      } catch (e) {
        console.error("Failed to play fallback sound:", e);
      }
    }
  }, []);

  const updateDailyReport = useCallback((focusTimeToAdd: number = 0, sessionsToAdd: number = 0) => {
    setState(prevState => {
      const today = new Date().toISOString().split('T')[0];
      const currentReportIndex = prevState.dailyReport.findIndex(report => report.date === today);
      
      if (currentReportIndex >= 0) {
        // Update existing report for today
        const updatedReport = [...prevState.dailyReport];
        updatedReport[currentReportIndex] = {
          ...updatedReport[currentReportIndex],
          focusTime: updatedReport[currentReportIndex].focusTime + focusTimeToAdd,
          sessions: updatedReport[currentReportIndex].sessions + sessionsToAdd
        };
        
        return {
          ...prevState,
          dailyReport: updatedReport,
          totalFocusTime: prevState.totalFocusTime + focusTimeToAdd,
          lastTimeUpdated: Date.now()
        };
      } else {
        // Create new report for today
        return {
          ...prevState,
          dailyReport: [
            ...prevState.dailyReport,
            {
              date: today,
              focusTime: focusTimeToAdd,
              sessions: sessionsToAdd
            }
          ],
          totalFocusTime: prevState.totalFocusTime + focusTimeToAdd,
          lastTimeUpdated: Date.now()
        };
      }
    });
  }, []);

  // Update focus time every minute when in focus mode and active
  useEffect(() => {
    if (state.isActive && !state.isPaused && state.mode === 'focus') {
      const minuteTracker = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
        
        if (elapsedSeconds >= 60) {
          // Add one minute of focus time
          updateDailyReport(60, 0);
          lastUpdateTimeRef.current = now;
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(minuteTracker);
    }
  }, [state.isActive, state.isPaused, state.mode, updateDailyReport]);

  const handleTimerComplete = useCallback(() => {
    clearInterval(intervalRef.current);
    playNotification();
    
    if (state.mode === 'focus') {
      // Calculate exact time spent in this focus session
      const timeSpent = state.focusTime - state.timeLeft;
      
      // Update sessions completed and report when focus session is completed
      const newSessions = state.sessions + 1;
      const shouldTakeLongBreak = newSessions % 4 === 0;
      
      updateDailyReport(timeSpent, 1);
      
      setState(prev => ({
        ...prev,
        isActive: false,
        isPaused: false,
        sessions: newSessions,
        sessionsCompleted: prev.sessionsCompleted + 1,
        mode: shouldTakeLongBreak ? 'longBreak' : 'shortBreak',
        timeLeft: shouldTakeLongBreak ? prev.longBreakTime : prev.shortBreakTime,
        lastTimeUpdated: Date.now()
      }));
      
      toast({
        title: "Focus session completed!",
        description: `Time for a ${shouldTakeLongBreak ? 'long' : 'short'} break.`
      });
    } else {
      // When break is over, switch back to focus mode
      setState(prev => ({
        ...prev,
        isActive: false,
        isPaused: false,
        mode: 'focus',
        timeLeft: prev.focusTime,
        lastTimeUpdated: Date.now()
      }));
      
      toast({
        title: `${state.mode === 'shortBreak' ? 'Short' : 'Long'} break completed!`,
        description: "Time to focus again."
      });
    }
  }, [state.mode, state.focusTime, state.sessions, state.shortBreakTime, state.longBreakTime, state.timeLeft, playNotification, updateDailyReport]);

  // Timer countdown effect
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      intervalRef.current = window.setInterval(() => {
        setState(prevState => {
          if (prevState.timeLeft <= 1) {
            clearInterval(intervalRef.current);
            // We'll handle timer completion in the next tick to avoid race conditions
            setTimeout(() => handleTimerComplete(), 0);
            return { ...prevState, timeLeft: 0 };
          }
          
          // If in focus mode, track the elapsed time for potential pause/reset
          if (prevState.mode === 'focus') {
            lastUpdateTimeRef.current = Date.now();
          }
          
          return { ...prevState, timeLeft: prevState.timeLeft - 1 };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.isPaused, handleTimerComplete]);

  const startTimer = useCallback(() => {
    const now = Date.now();
    lastUpdateTimeRef.current = now;
    
    setState(prev => ({ 
      ...prev, 
      isActive: true, 
      isPaused: false,
      lastTimeUpdated: now
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    // If we're pausing while in focus mode, update the focus time
    if (state.mode === 'focus' && state.isActive && !state.isPaused) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
      
      if (elapsedSeconds > 0) {
        // Add the elapsed time since last update
        updateDailyReport(elapsedSeconds, 0);
      }
    }
    
    setState(prev => ({ ...prev, isPaused: true }));
  }, [state.mode, state.isActive, state.isPaused, updateDailyReport]);

  const resetTimer = useCallback(() => {
    // If we're resetting while in focus mode, update the focus time
    if (state.mode === 'focus' && state.isActive && !state.isPaused) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
      
      if (elapsedSeconds > 0) {
        // Add the elapsed time since last update
        updateDailyReport(elapsedSeconds, 0);
      }
    }
    
    setState(prev => {
      const newTimeLeft = 
        prev.mode === 'focus' ? prev.focusTime : 
        prev.mode === 'shortBreak' ? prev.shortBreakTime : 
        prev.longBreakTime;
      
      return {
        ...prev,
        timeLeft: newTimeLeft,
        isActive: false,
        isPaused: false,
        lastTimeUpdated: Date.now()
      };
    });
  }, [state.mode, state.isActive, state.isPaused, updateDailyReport]);

  const setMode = useCallback((mode: TimerMode) => {
    // If we're changing from focus mode, update the focus time
    if (state.mode === 'focus' && state.isActive && !state.isPaused) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
      
      if (elapsedSeconds > 0) {
        // Add the elapsed time since last update
        updateDailyReport(elapsedSeconds, 0);
      }
    }
    
    setState(prev => {
      const newTimeLeft = 
        mode === 'focus' ? prev.focusTime : 
        mode === 'shortBreak' ? prev.shortBreakTime : 
        prev.longBreakTime;
      
      return {
        ...prev,
        mode,
        timeLeft: newTimeLeft,
        isActive: false,
        isPaused: false,
        lastTimeUpdated: Date.now()
      };
    });
  }, [state.mode, state.isActive, state.isPaused, updateDailyReport]);

  const skipTimer = useCallback(() => {
    // If we're skipping while in focus mode, update the focus time
    if (state.mode === 'focus' && state.isActive && !state.isPaused) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
      
      if (elapsedSeconds > 0) {
        // Add the elapsed time since last update
        updateDailyReport(elapsedSeconds, 0);
      }
    }
    
    // Similar to handleTimerComplete but without updating the stats
    if (state.mode === 'focus') {
      const newSessions = state.sessions;
      const shouldTakeLongBreak = newSessions % 4 === 0;
      
      setState(prev => ({
        ...prev,
        isActive: false,
        isPaused: false,
        mode: shouldTakeLongBreak ? 'longBreak' : 'shortBreak',
        timeLeft: shouldTakeLongBreak ? prev.longBreakTime : prev.shortBreakTime,
        lastTimeUpdated: Date.now()
      }));
    } else {
      setState(prev => ({
        ...prev,
        isActive: false,
        isPaused: false,
        mode: 'focus',
        timeLeft: prev.focusTime,
        lastTimeUpdated: Date.now()
      }));
    }
  }, [state.mode, state.sessions, state.isActive, state.isPaused, updateDailyReport]);

  const setFocusTime = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setState(prev => {
      const updatedState = {
        ...prev,
        focusTime: seconds,
        lastTimeUpdated: Date.now()
      };
      
      // Update current timer if we're in focus mode and not active
      if (prev.mode === 'focus' && !prev.isActive) {
        updatedState.timeLeft = seconds;
      }
      
      return updatedState;
    });
  }, []);

  const setShortBreakTime = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setState(prev => {
      const updatedState = {
        ...prev,
        shortBreakTime: seconds,
        lastTimeUpdated: Date.now()
      };
      
      // Update current timer if we're in short break mode and not active
      if (prev.mode === 'shortBreak' && !prev.isActive) {
        updatedState.timeLeft = seconds;
      }
      
      return updatedState;
    });
  }, []);

  const setLongBreakTime = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setState(prev => {
      const updatedState = {
        ...prev,
        longBreakTime: seconds,
        lastTimeUpdated: Date.now()
      };
      
      // Update current timer if we're in long break mode and not active
      if (prev.mode === 'longBreak' && !prev.isActive) {
        updatedState.timeLeft = seconds;
      }
      
      return updatedState;
    });
  }, []);

  const value = {
    ...state,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    skipTimer,
    setFocusTime,
    setShortBreakTime,
    setLongBreakTime
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
