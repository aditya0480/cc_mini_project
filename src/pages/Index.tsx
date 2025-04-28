
import React from 'react';
import { Layout } from '@/components/Layout';
import { TimerProvider } from '@/contexts/TimerContext';

const Index = () => {
  return (
    <TimerProvider>
      <Layout />
    </TimerProvider>
  );
};

export default Index;
