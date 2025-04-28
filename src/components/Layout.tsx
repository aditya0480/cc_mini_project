
import React, { useState } from 'react';
import { useTimer, TimerMode } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ReportView } from '@/components/ReportView';
import { Clock, BarChart2 } from 'lucide-react';

export const Layout: React.FC = () => {
  const { mode } = useTimer();
  const [activeTab, setActiveTab] = useState<'timer' | 'report'>('timer');

  return (
    <div 
      className={`min-h-screen flex flex-col transition-all-smooth bg-gradient-${mode}`}
    >
      <header className="container mx-auto py-4 px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">Time<span className="font-light">Master</span></h1>
          <nav className="hidden md:flex space-x-1">
            <Button 
              variant="ghost" 
              className={`text-white/80 hover:text-white hover:bg-white/10 ${activeTab === 'timer' ? 'bg-white/10' : ''}`}
              onClick={() => setActiveTab('timer')}
            >
              <Clock className="mr-2 h-4 w-4" />
              Timer
            </Button>
            <Button 
              variant="ghost" 
              className={`text-white/80 hover:text-white hover:bg-white/10 ${activeTab === 'report' ? 'bg-white/10' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Report
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'timer' | 'report')}
          className="flex-grow flex flex-col"
        >
          <TabsList className="md:hidden self-center mb-6 bg-white/10">
            <TabsTrigger 
              value="timer" 
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
            >
              <Clock className="mr-2 h-4 w-4" />
              Timer
            </TabsTrigger>
            <TabsTrigger 
              value="report" 
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Report
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="timer" className="flex-grow flex items-center justify-center mt-0">
            <TimerDisplay />
          </TabsContent>
          
          <TabsContent value="report" className="mt-0 py-6">
            <ReportView />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="container mx-auto py-3 px-4">
        <div className="flex justify-center">
          <div className="text-white/60 text-sm">
            Focus and achieve your goals.
          </div>
        </div>
      </footer>
    </div>
  );
};
