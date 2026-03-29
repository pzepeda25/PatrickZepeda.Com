import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, FileSpreadsheet, FileText, ChevronDown, ChevronUp, ShieldAlert, Lock, Search, RefreshCw, LogOut } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define types for jsPDF autotable to avoid TS errors
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Lead {
  key: string;
  name: string;
  email: string;
  company?: string;
  budget?: string | number;
  message: string;
  category: string;
  strength: number;
  receivedAt: string;
}

export default function InternalLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' }>({ key: 'strength', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Check for secret in sessionStorage on mount
  useEffect(() => {
    const storedSecret = sessionStorage.getItem('vibe_secret');

    if (storedSecret) {
      setSecret(storedSecret);
      fetchLeads(storedSecret);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchLeads = async (currentSecret: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/list-leads', {
        headers: {
          'x-vibe-secret': currentSecret
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Access Key');
        }
        throw new Error('Failed to fetch leads.');
      }

      const data = await response.json();
      setLeads(data.leads || []);
      setIsAuthenticated(true);
      // Save to session storage ONLY on successful fetch
      sessionStorage.setItem('vibe_secret', currentSecret);
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
      sessionStorage.removeItem('vibe_secret');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(secret);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('vibe_secret');
    setSecret('');
    setIsAuthenticated(false);
    setLeads([]);
  };

  const handleSort = (key: keyof Lead) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLeads = React.useMemo(() => {
    let sortableLeads = [...leads];
    
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      sortableLeads = sortableLeads.filter(lead => {
        return Object.keys(lead).some(key => {
          const val = lead[key as keyof Lead];
          return val ? val.toString().toLowerCase().includes(lowercasedFilter) : false;
        });
      });
    }

    if (sortConfig !== null) {
      sortableLeads.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableLeads;
  }, [leads, sortConfig, searchTerm]);

  // --- Export Functions ---

  const exportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedLeads);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedLeads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Branding Header
    doc.setFillColor(20, 20, 20); // Dark background
    doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
    doc.setTextColor(0, 255, 255); // Cyan text
    doc.setFontSize(22);
    doc.text("P_ZEPEDA_ // LEAD INTELLIGENCE", 14, 20);
    
    doc.setTextColor(255, 0, 255); // Magenta text
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });

    const tableColumn = ["Strength", "Date", "Name", "Email", "Company", "Budget", "Category"];
    const tableRows = sortedLeads.map(lead => [
      lead.strength.toString(),
      new Date(lead.receivedAt).toLocaleDateString(),
      lead.name,
      lead.email,
      lead.company || 'N/A',
      lead.budget?.toString() || 'N/A',
      lead.category
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { font: 'courier', fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [255, 0, 255], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold' }, // Strength
      }
    });

    doc.save(`leads_export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Render Helpers ---

  const renderStrengthMeters = (strength: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div 
            key={level} 
            className={`w-2 h-4 rounded-sm ${level <= strength ? (strength >= 4 ? 'bg-synth-magenta box-glow-magenta' : 'bg-synth-cyan box-glow-cyan') : 'bg-gray-700'}`}
          />
        ))}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-synth-bg flex items-center justify-center p-6 crt">
        <div className="scanline-sweep"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-synth-dark border border-synth-cyan/30 p-8 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.1)] relative z-10"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-synth-cyan/10 rounded-full border border-synth-cyan/30">
              <Lock className="w-8 h-8 text-synth-cyan" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2 font-mono uppercase tracking-wider">Access Required</h1>
          <p className="text-gray-400 text-center mb-8 font-mono text-sm">Enter authorization key to unlock the vault.</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter Vault Password"
                className="w-full bg-black/50 border border-synth-cyan/30 rounded px-4 py-3 text-white font-mono focus:outline-none focus:border-synth-cyan focus:ring-1 focus:ring-synth-cyan transition-all"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm font-mono bg-red-400/10 p-3 rounded border border-red-400/30">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-synth-cyan text-synth-bg font-bold py-3 px-4 rounded hover:bg-white transition-colors font-mono uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Decrypt Vault'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-synth-bg text-white p-6 md:p-12 crt selection:bg-synth-magenta selection:text-white">
      <div className="scanline-sweep"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wider text-glow-cyan font-mono mb-2">
              Lead Intelligence
            </h1>
            <p className="text-synth-magenta font-mono text-sm">
              &gt; SYSTEM.STATUS: {leads.length} RECORDS FOUND
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={() => fetchLeads(secret)} className="px-4 py-2 border border-synth-cyan/30 text-synth-cyan hover:bg-synth-cyan/10 transition-colors font-mono text-sm flex items-center gap-2 rounded">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={exportCSV} className="px-4 py-2 bg-synth-dark border border-gray-600 hover:border-white transition-colors font-mono text-sm flex items-center gap-2 rounded">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={exportExcel} className="px-4 py-2 bg-green-900/30 border border-green-500/50 text-green-400 hover:bg-green-900/50 transition-colors font-mono text-sm flex items-center gap-2 rounded">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={exportPDF} className="px-4 py-2 bg-synth-magenta/20 border border-synth-magenta/50 text-synth-magenta hover:bg-synth-magenta/40 transition-colors font-mono text-sm flex items-center gap-2 rounded">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={handleLogout} className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors font-mono text-sm flex items-center gap-2 rounded md:ml-4">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center bg-synth-dark border border-synth-cyan/20 p-2 rounded">
          <Search className="w-5 h-5 text-gray-500 ml-2" />
          <input 
            type="text" 
            placeholder="Search leads by name, email, company..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-white font-mono w-full px-4 py-2 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Data Table */}
        <div className="bg-synth-dark border border-synth-cyan/30 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/50 border-b border-synth-cyan/30 font-mono text-sm text-gray-400">
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('strength')}>
                    <div className="flex items-center gap-1">
                      Strength {sortConfig.key === 'strength' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('receivedAt')}>
                    <div className="flex items-center gap-1">
                      Date {sortConfig.key === 'receivedAt' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Contact {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">
                      Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="p-4">Message Preview</th>
                </tr>
              </thead>
              <tbody className="font-sans text-sm">
                {loading && leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 font-mono">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      FETCHING DATA...
                    </td>
                  </tr>
                ) : sortedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 font-mono">NO RECORDS FOUND.</td>
                  </tr>
                ) : (
                  sortedLeads.map((lead) => (
                    <tr key={lead.key} className="border-b border-synth-cyan/10 hover:bg-synth-cyan/5 transition-colors group">
                      <td className="p-4 align-top">
                        {renderStrengthMeters(lead.strength)}
                      </td>
                      <td className="p-4 align-top text-gray-400 font-mono text-xs whitespace-nowrap">
                        {new Date(lead.receivedAt).toLocaleDateString()}<br/>
                        <span className="opacity-50">{new Date(lead.receivedAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4 align-top">
                        <div className="font-bold text-white">{lead.name}</div>
                        <div className="text-synth-cyan text-xs font-mono mt-1">{lead.email}</div>
                        {lead.company && <div className="text-gray-400 text-xs mt-1">{lead.company}</div>}
                      </td>
                      <td className="p-4 align-top">
                        <span className="px-2 py-1 bg-synth-magenta/10 border border-synth-magenta/30 text-synth-magenta text-xs font-mono rounded uppercase">
                          {lead.category}
                        </span>
                        {lead.budget && (
                          <div className="mt-2 text-green-400 font-mono text-xs">
                            Budget: {lead.budget}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <p className="text-gray-300 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                          {lead.message}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
