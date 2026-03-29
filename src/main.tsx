import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// ⚡ Bolt: Lazy load InternalLeads to avoid sending heavy dependencies (xlsx, jspdf) to main bundle
const InternalLeads = lazy(() => import('./components/InternalLeads.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-synth-dark flex items-center justify-center text-synth-cyan font-mono">LOADING SYSTEM...</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/internal-leads" element={<InternalLeads />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
