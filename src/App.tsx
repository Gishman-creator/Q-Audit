import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Statistics from './components/Statistics';
import Simulation from './components/Simulation';
import EmptyState from './components/EmptyState';
import { processData, type DataPoint, type ReportMeta } from './utils/parser';

const QAudit = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [initialDeposit, setInitialDeposit] = useState(0);
  const [reportMeta, setReportMeta] = useState<ReportMeta>({ totalTrades: 0 });
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result && typeof ev.target.result === 'string') {
        const { data, initialDeposit, reportMeta } = processData(ev.target.result);
        setData(data);
        setInitialDeposit(initialDeposit);
        setReportMeta(reportMeta);
      }
    };
    reader.readAsText(file);
  };

  const avgPerWeek = useMemo(() => {
    if (data.length === 0) return 0;
    const firstDate = data[0].date;
    const lastDate = data[data.length - 1].date;
    const diffWeeks = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return (reportMeta.totalTrades / diffWeeks).toFixed(2);
  }, [data, reportMeta.totalTrades]);

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-300 p-6 font-['Inter',sans-serif]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');`}</style>

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onFileUpload={handleFileUpload}
      />

      <main className="max-w-7xl mx-auto">
        {data.length > 0 ? (
          activeTab === 'dashboard' ? (
            <Dashboard
              data={data}
              initialDeposit={initialDeposit}
              reportMeta={reportMeta}
            />
          ) : activeTab === 'simulation' ? (
            <Simulation
              data={data}
              initialDeposit={initialDeposit}
              reportMeta={reportMeta}
            />
          ) : (
            <Statistics
              reportMeta={reportMeta}
              avgPerWeek={avgPerWeek}
              initialDeposit={initialDeposit}
            />
          )
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
};

export default QAudit;