import React, { useState } from 'react';
import DataEntryTab from './components/DataEntryTab';
import StatisticsTab from './components/StatisticsTab';
import ConstantsTab from './components/ConstantsTab';

type Tab = 'entry' | 'statistics' | 'constants';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('entry');

  return (
    <div className="min-h-screen bg-bg pt-10">
      {/* Draggable title bar - fixed so it's always accessible */}
      <div className="fixed top-0 left-0 right-0 h-10 z-50 bg-[#FAFAF7]"
           style={{ WebkitAppRegion: 'drag' } as any} />

      {/* Tab Navigation */}
      <nav className="border-b border-border bg-[#FAFAF7]/80 backdrop-blur-sm sticky top-10 z-40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-8" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <TabButton
              label="Внести данные"
              active={activeTab === 'entry'}
              onClick={() => setActiveTab('entry')}
            />
            <TabButton
              label="Статистика"
              active={activeTab === 'statistics'}
              onClick={() => setActiveTab('statistics')}
            />
            <TabButton
              label="Константы"
              active={activeTab === 'constants'}
              onClick={() => setActiveTab('constants')}
            />
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'entry' && <DataEntryTab />}
        {activeTab === 'statistics' && <StatisticsTab />}
        {activeTab === 'constants' && <ConstantsTab />}
      </main>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        py-4 text-sm font-medium border-b-2 transition-colors
        ${active
          ? 'border-text-primary text-text-primary'
          : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
        }
      `}
    >
      {label}
    </button>
  );
}
