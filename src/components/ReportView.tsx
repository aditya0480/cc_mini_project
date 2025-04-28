
import React, { useState, useMemo } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, BarChart2 } from 'lucide-react';

export const ReportView: React.FC = () => {
  const { totalFocusTime, sessionsCompleted, dailyReport } = useTimer();
  const [timeFrame, setTimeFrame] = useState<'week' | 'month'>('week');

  // Format total focus time
  const formattedTotalFocusTime = useMemo(() => {
    const hours = Math.floor(totalFocusTime / 3600);
    const minutes = Math.floor((totalFocusTime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, [totalFocusTime]);

  // Prepare chart data for the last week or month
  const chartData = useMemo(() => {
    const today = new Date();
    const numberOfDays = timeFrame === 'week' ? 7 : 30;
    
    const result = [];
    
    for (let i = numberOfDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const reportForDate = dailyReport.find(report => report.date === dateString);
      
      result.push({
        date: dateString,
        minutes: reportForDate ? Math.round(reportForDate.focusTime / 60) : 0,
        sessions: reportForDate ? reportForDate.sessions : 0,
        label: timeFrame === 'week' 
          ? new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' })
          : new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return result;
  }, [dailyReport, timeFrame]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-md">
          <p className="text-sm font-medium mb-1">{payload[0].payload.date}</p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{payload[0].value}</span> minutes
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{payload[1].value}</span> sessions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-gray-700">
              <Clock className="mr-2 h-5 w-5 text-gray-500" />
              Total Focus Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{formattedTotalFocusTime}</div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-gray-700">
              <BarChart2 className="mr-2 h-5 w-5 text-gray-500" />
              Sessions Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{sessionsCompleted}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-gray-800">Activity Overview</CardTitle>
          <div className="flex space-x-2">
            <button 
              onClick={() => setTimeFrame('week')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                timeFrame === 'week' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button 
              onClick={() => setTimeFrame('month')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                timeFrame === 'month' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 12 }}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="minutes" 
                  fill="#db4747" 
                  name="Minutes" 
                  radius={[4, 4, 0, 0]}
                  barSize={timeFrame === 'week' ? 30 : 12}
                />
                <Bar 
                  dataKey="sessions" 
                  fill="#38858a" 
                  name="Sessions" 
                  radius={[4, 4, 0, 0]}
                  barSize={timeFrame === 'week' ? 30 : 12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
