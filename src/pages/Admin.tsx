import React, { useEffect, useMemo, useState } from 'react';

type Lead = {
  name: string;
  address: string;
  flags: string[];
  rating: number;
  reviews: number;
  mapUrl: string | null;
  isGold: boolean;
  website?: string | null;
  email?: string | null;
  linkedin?: string | null;
};

// Replace with your actual n8n webhook URL
const N8N_WEBHOOK_URL = 'https://n8n.patrickzepeda.com/webhook/deploy-agents';

type GetLeadsResponse = {
  totalFound: number;
  goldCount: number;
  leads: Lead[];
};

type FormSubmission = {
  receivedAt: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  services?: string[];
  urgency?: string | number;
  description?: string;
  contactMethod?: string;
  date?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
};

const FLAG_LABELS: Record<string, string> = {
  NO_WEBSITE: 'NO WEBSITE',
  LOW_REVIEWS: 'LOW REVIEWS',
  FIXABLE_RATING: 'FIXABLE RATING',
};

function FlagBadge({ flag }: { flag: string }) {
  const label = FLAG_LABELS[flag] ?? flag.replaceAll('_', ' ');

  return (
    <span
      className="inline-flex items-center rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-mono text-red-400"
      title={label}
    >
      {label}
    </span>
  );
}

function GoldOnlyToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 select-none cursor-pointer">
      <span className="text-sm text-green-400 font-mono">Gold Only</span>
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label="Gold Only"
        />
        <span
          className={[
            'h-6 w-11 rounded-full border transition-colors duration-200',
            checked ? 'bg-green-400 border-green-400' : 'bg-black/40 border-white/15',
            'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-400 peer-focus:ring-offset-2 peer-focus:ring-offset-black',
          ].join(' ')}
        />
        <span
          className={[
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white/10 border transition-transform duration-200',
            checked
              ? 'translate-x-5 bg-green-400 border-green-400 shadow-[0_0_14px_rgba(74,222,128,0.35)]'
              : 'translate-x-0 border-white/20',
          ].join(' ')}
        />
      </span>
    </label>
  );
}

// A simple "Vibe Delay" to keep the bouncer away
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function Admin() {
  const [secretKey, setSecretKey] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [goldOnly, setGoldOnly] = useState(false);

  const [activeTab, setActiveTab] = useState<'hunter' | 'inbox'>('hunter');

  const [isHunting, setIsHunting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GetLeadsResponse | null>(null);

  const [isSavingLead, setIsSavingLead] = useState(false);
  const [vaultNotice, setVaultNotice] = useState<string | null>(null);

  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [deployingLeads, setDeployingLeads] = useState<Record<string, boolean>>({});
  const [isBulkAuditing, setIsBulkAuditing] = useState(false);

  // Load saved key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('vibe_admin_key');
    if (savedKey) {
      setSecretKey(savedKey);
      setRememberKey(true);
    }
  }, []);

  // Save/Clear key based on rememberKey preference
  useEffect(() => {
    if (rememberKey) {
      if (secretKey.trim()) {
        localStorage.setItem('vibe_admin_key', secretKey);
      }
    } else {
      localStorage.removeItem('vibe_admin_key');
    }
  }, [secretKey, rememberKey]);

  const displayedLeads = useMemo(() => {
    if (!goldOnly) return leads;
    return leads.filter((l) => l.isGold);
  }, [goldOnly, leads]);

  const toggleFlag = (leadToToggle: Lead) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.name === leadToToggle.name && lead.address === leadToToggle.address
          ? { ...lead, isGold: !lead.isGold }
          : lead
      )
    );
  };

  async function deployAgents(lead: Lead, silent = false) {
    const leadKey = `${lead.name}-${lead.address}`;
    setDeployingLeads((prev) => ({ ...prev, [leadKey]: true }));

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          address: lead.address,
          email: lead.email,
          linkedin: lead.linkedin,
          isGold: lead.isGold,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Deployment failed');
      if (!silent) alert(`Agents Deployed for ${lead.name}! 🚀`);
      return true;
    } catch (e) {
      if (!silent) alert(`Agent Error: ${e instanceof Error ? e.message : 'Unknown failure'}`);
      return false;
    } finally {
      setDeployingLeads((prev) => ({ ...prev, [leadKey]: false }));
    }
  }

  async function runBulkAudit() {
    const goldLeads = leads.filter((l) => l.isGold);
    if (goldLeads.length === 0) {
      alert('No Gold leads flagged for audit.');
      return;
    }

    if (!confirm(`Initialize Bulk Audit for ${goldLeads.length} leads? This uses a randomized vibe delay.`)) {
      return;
    }

    setIsBulkAuditing(true);
    setError(null);

    try {
      for (const lead of goldLeads) {
        // Vibe Delay: Wait 0.5 to 1.5 seconds
        await delay(Math.floor(Math.random() * 1000) + 500);
        
        // Proceed with audit (Deploy Agents)
        await deployAgents(lead, true);
      }
      alert('Bulk Audit Sequence Complete. 🤖');
    } catch (e) {
      setError(`Bulk Audit Interrupted: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsBulkAuditing(false);
    }
  }

  async function saveLead(lead: Lead) {
    setVaultNotice(null);
    setError(null);

    const trimmedSecret = secretKey.trim();
    if (!trimmedSecret) {
      setError('Secret Key is required to save to the Vault.');
      return;
    }

    setIsSavingLead(true);
    try {
      const res = await fetch('/api/save-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vibe-secret': trimmedSecret,
          Accept: 'application/json',
        },
        body: JSON.stringify(lead),
      });

      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok) {
        throw new Error(payload?.error || `Request failed with ${res.status}.`);
      }

      setVaultNotice('Lead Secured in Vault! 🔒');
      setTimeout(() => setVaultNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save lead.');
    } finally {
      setIsSavingLead(false);
    }
  }

  async function loadInbox() {
    setInboxError(null);
    setVaultNotice(null);

    const trimmedSecret = secretKey.trim();
    if (!trimmedSecret) {
      setInboxError('Secret Key is required to open the Inbox.');
      return;
    }

    setInboxLoading(true);
    try {
      const res = await fetch('/api/list-form-submissions', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-vibe-secret': trimmedSecret,
        },
      });

      const payload = (await res.json().catch(() => null)) as
        | { items?: FormSubmission[]; error?: string; details?: string }
        | null;

      if (!res.ok) {
        throw new Error(payload?.error || payload?.details || `Request failed with ${res.status}.`);
      }

      if (!payload || !Array.isArray(payload.items)) {
        throw new Error('Unexpected API response shape.');
      }

      setSubmissions(payload.items);
    } catch (e) {
      setInboxError(e instanceof Error ? e.message : 'Failed to load submissions.');
      setSubmissions([]);
    } finally {
      setInboxLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'inbox') {
      void loadInbox();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function executeHunt() {
    setError(null);
    setResponse(null);

    const trimmedSecret = secretKey.trim();
    const trimmedCategory = category.trim();
    const trimmedCity = city.trim();

    if (!trimmedSecret || !trimmedCategory || !trimmedCity) {
      setError('All fields are required (Secret Key, Niche/Category, City).');
      return;
    }

    setIsHunting(true);
    try {
      const res = await fetch('/api/get-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vibe-secret': trimmedSecret,
          Accept: 'application/json',
        },
        body: JSON.stringify({ category: trimmedCategory, city: trimmedCity }),
      });

      const payload = (await res.json().catch(() => null)) as
        | GetLeadsResponse
        | { error?: string; details?: string }
        | null;

      if (!res.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof payload.error === 'string'
            ? payload.error
            : payload &&
              typeof payload === 'object' &&
              'details' in payload &&
              typeof payload.details === 'string'
              ? payload.details
              : null;
        throw new Error(message || `Request failed with ${res.status}.`);
      }

      if (!payload || typeof payload !== 'object' || !('leads' in payload)) {
        throw new Error('Unexpected API response shape.');
      }

      setResponse(payload as GetLeadsResponse);
      setLeads((payload as GetLeadsResponse).leads);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to execute hunt.');
    } finally {
      setIsHunting(false);
    }
  }

  return (
    <div className="min-h-screen crt relative bg-black text-green-400 font-mono">
      <div className="scanline-sweep" />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.35)]">
            LEAD HUNTER COCKPIT
          </h1>
          <p className="mt-2 text-sm text-green-400/90">
            Scan results are dominated by vulnerability flags. Gold rows glow softly.
          </p>
        </header>

        <div className="border border-green-400/20 bg-black/50 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-green-400/15">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-green-400/90">Secret Key</label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberKey}
                      onChange={(e) => setRememberKey(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={[
                        'w-3 h-3 border transition-all duration-200 flex items-center justify-center',
                        rememberKey
                          ? 'bg-green-400 border-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]'
                          : 'bg-black border-white/20 group-hover:border-green-400/50',
                      ].join(' ')}
                    >
                      {rememberKey && (
                        <div className="w-1.5 h-1.5 bg-black" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-green-400/70 group-hover:text-green-400 transition-colors">
                      REMEMBER KEY
                    </span>
                  </label>
                </div>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter secret key..."
                  className="w-full rounded border border-white/15 bg-black/70 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/30"
                />
              </div>

              {activeTab === 'hunter' && (
                <>
                  <div className="flex-1">
                    <label className="block text-xs text-green-400/90 mb-1">
                      Niche/Category
                    </label>
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. roofing, plumbing..."
                      className="w-full rounded border border-white/15 bg-black/70 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/30"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-green-400/90 mb-1">City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Austin, TX"
                      className="w-full rounded border border-white/15 bg-black/70 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/30"
                    />
                  </div>
                  <div className="lg:shrink-0">
                    <button
                      type="button"
                      onClick={executeHunt}
                      disabled={isHunting}
                      className={[
                        'inline-flex items-center justify-center gap-2 rounded px-5 py-2.5',
                        'border transition-all duration-200 font-bold',
                        isHunting
                          ? 'bg-green-400/20 text-green-200 border-green-400/25 cursor-not-allowed'
                          : 'bg-green-400 text-black border-green-400 hover:bg-green-300',
                      ].join(' ')}
                    >
                      {isHunting ? 'HUNTING...' : 'EXECUTE HUNT'}
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'inbox' && (
                <div className="lg:shrink-0">
                  <button
                    type="button"
                    onClick={() => void loadInbox()}
                    disabled={inboxLoading}
                    className={[
                      'inline-flex items-center justify-center gap-2 rounded px-5 py-2.5',
                      'border transition-all duration-200 font-bold',
                      inboxLoading
                        ? 'bg-green-400/20 text-green-200 border-green-400/25 cursor-not-allowed'
                        : 'bg-green-400 text-black border-green-400 hover:bg-green-300',
                    ].join(' ')}
                  >
                    {inboxLoading ? 'LOADING...' : 'REFRESH INBOX'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('hunter')}
                  className={[
                    'px-4 py-2 rounded border transition-colors duration-200 text-xs font-bold',
                    activeTab === 'hunter'
                      ? 'bg-green-400 text-black border-green-400'
                      : 'bg-black/40 text-green-300 border-white/15 hover:bg-white/5',
                  ].join(' ')}
                >
                  HUNTER
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className={[
                    'px-4 py-2 rounded border transition-colors duration-200 text-xs font-bold',
                    activeTab === 'inbox'
                      ? 'bg-green-400 text-black border-green-400'
                      : 'bg-black/40 text-green-300 border-white/15 hover:bg-white/5',
                  ].join(' ')}
                >
                  INBOX
                </button>
              </div>

              {activeTab === 'hunter' ? (
                <>
                  <button
                    type="button"
                    onClick={runBulkAudit}
                    disabled={isBulkAuditing || leads.filter(l => l.isGold).length === 0}
                    className={[
                      'px-3 py-1.5 rounded border text-[10px] font-bold transition-all mr-4',
                      isBulkAuditing
                        ? 'bg-blue-500/20 text-blue-200 border-blue-500/25 cursor-wait'
                        : 'bg-blue-500 text-white border-blue-500 hover:brightness-110 shadow-[0_0_8px_rgba(59,130,246,0.3)] disabled:opacity-30 disabled:cursor-not-allowed',
                    ].join(' ')}
                  >
                    {isBulkAuditing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                        AUDITING...
                      </span>
                    ) : (
                      '🤖 RUN BULK AUDIT'
                    )}
                  </button>
                  <GoldOnlyToggle checked={goldOnly} onChange={setGoldOnly} />
                  <div className="text-xs text-white/70">
                    {leads.length > 0 ? (
                      <>
                        Total Found: <span className="text-green-400">{leads.length}</span> | Gold Leads:{' '}
                        <span className="text-green-400">
                          {leads.filter((l) => l.isGold).length}
                        </span>
                      </>
                    ) : (
                      'Awaiting execution...'
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs text-white/70">
                  {inboxLoading ? (
                    'Scanning inbox storage...'
                  ) : (
                    <>
                      Submissions:{' '}
                      <span className="text-green-400">{submissions.length}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-5">
            {activeTab === 'hunter' && (
              <>
                {vaultNotice && (
                  <div className="mb-4 rounded border border-green-400/30 bg-green-400/10 px-4 py-3 text-green-300 text-sm">
                    {vaultNotice}
                  </div>
                )}

                {error && (
                  <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {isHunting && (
                  <div className="mb-4 rounded border border-green-400/20 bg-green-400/5 px-4 py-3 text-green-300 text-sm">
                    HUNTING... querying map intelligence and transforming results.
                  </div>
                )}

                {!isHunting && displayedLeads.length === 0 && response && !error && (
                  <div className="rounded border border-white/15 bg-white/5 px-4 py-3 text-white/70 text-sm">
                    No leads matched the current filter.
                  </div>
                )}

                {displayedLeads.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-[1250px] w-full border-collapse">
                      <thead>
                        <tr className="text-left text-xs text-green-400/80">
                          <th className="border border-white/10 bg-white/5 px-3 py-2 rounded-tl-lg w-[50px]">FLAG</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2 w-[220px]">FLAGS</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2">NAME</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2 w-[100px]">EMAIL</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2 w-[100px]">LINKEDIN</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2">ADDRESS</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2">RATING</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2">REVIEWS / VIEW</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2 rounded-tr-lg w-[280px]">COMMANDS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedLeads.map((lead, idx) => {
                          const leadKey = `${lead.name || 'unknown'}-${lead.address || 'unknown'}`;
                          const isDeploying = deployingLeads[leadKey];

                          return (
                            <tr
                              key={`${lead.name || 'unknown'}-${lead.address || 'unknown'}-${idx}`}
                              className={[
                                'align-top transition-all duration-300 border-l-2',
                                lead.isGold
                                  ? 'bg-green-400/5 shadow-[0_0_16px_rgba(74,222,128,0.20)] border-green-400/50'
                                  : 'bg-black border-transparent',
                              ].join(' ')}
                            >
                              <td className="border border-white/10 px-3 py-2 text-center">
                                <button
                                  onClick={() => toggleFlag(lead)}
                                  className={[
                                    'text-lg transition-transform active:scale-125 hover:scale-110',
                                    lead.isGold ? 'grayscale-0' : 'grayscale opacity-30',
                                  ].join(' ')}
                                  title={lead.isGold ? 'Unflag Lead' : 'Flag as Gold Lead'}
                                >
                                  🚩
                                </button>
                              </td>
                              <td className="border border-white/10 px-3 py-2">
                                <div className="flex flex-wrap gap-2">
                                  {(lead.flags ?? []).length > 0 ? (
                                    lead.flags.map((f) => (
                                      <React.Fragment key={f}>
                                        <FlagBadge flag={f} />
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-white/50">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="border border-white/10 px-3 py-2">
                                <div className="text-sm text-white font-bold">
                                  {lead.name || 'Unknown'}
                                </div>
                                <div className="mt-1 text-[11px] text-white/60">
                                  {lead.isGold ? 'GOLD LEAD' : 'STANDARD'}
                                </div>
                              </td>
                              <td className="border border-white/10 px-3 py-2 text-center">
                                {lead.email ? (
                                  <a
                                    href={`mailto:${lead.email}`}
                                    className="text-lg hover:brightness-125"
                                    title={lead.email}
                                  >
                                    📧
                                  </a>
                                ) : (
                                  <span className="text-xs text-white/20">...</span>
                                )}
                              </td>
                              <td className="border border-white/10 px-3 py-2 text-center">
                                {lead.linkedin ? (
                                  <a
                                    href={lead.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-lg hover:brightness-125"
                                    title={lead.linkedin}
                                  >
                                    🔗
                                  </a>
                                ) : (
                                  <span className="text-xs text-white/20">...</span>
                                )}
                              </td>
                              <td className="border border-white/10 px-3 py-2">
                                <div className="text-sm text-white/90">
                                  {lead.address || 'Unknown address'}
                                </div>
                              </td>
                              <td className="border border-white/10 px-3 py-2">
                                <div className="text-sm font-bold text-yellow-400">
                                  {Number.isFinite(lead.rating) ? lead.rating.toFixed(1) : '0.0'}
                                </div>
                              </td>
                              <td className="border border-white/10 px-3 py-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-bold text-yellow-400">
                                    {lead.reviews} rev
                                  </div>
                                  {lead.mapUrl ? (
                                    <a
                                      href={lead.mapUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center rounded border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-green-400 hover:bg-white/10 transition-colors"
                                    >
                                      VIEW
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40">
                                      NO MAP
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="border border-white/10 px-3 py-2">
                                <div className="flex gap-2">
                                  {lead.isGold && (
                                    <button
                                      type="button"
                                      onClick={() => deployAgents(lead)}
                                      disabled={isDeploying}
                                      className={[
                                        'flex-1 inline-flex items-center justify-center rounded border px-3 py-1.5 text-[10px] font-black transition-all',
                                        isDeploying
                                          ? 'bg-blue-500/20 text-blue-200 border-blue-500/25 cursor-not-allowed'
                                          : 'bg-blue-500 text-white border-blue-500 hover:brightness-110 shadow-[0_0_10px_rgba(59,130,246,0.4)]',
                                      ].join(' ')}
                                    >
                                      {isDeploying ? (
                                        <span className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                                          ANALYZING...
                                        </span>
                                      ) : (
                                        '🚀 DEPLOY AGENTS'
                                      )}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => saveLead(lead)}
                                    disabled={isSavingLead || !secretKey.trim()}
                                    className={[
                                      'inline-flex items-center justify-center rounded border px-3 py-1.5 text-[10px] font-bold transition-colors',
                                      isSavingLead || !secretKey.trim()
                                        ? 'bg-green-400/20 text-green-200 border-green-400/25 cursor-not-allowed'
                                        : 'bg-green-400 text-black border-green-400 hover:bg-green-300',
                                    ].join(' ')}
                                  >
                                    {isSavingLead ? 'SAVING...' : 'VAULT'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!isHunting && !response && (
                  <div className="mt-4 rounded border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                    Enter a secret key and run a hunt to populate leads.
                  </div>
                )}
              </>
            )}

            {activeTab === 'inbox' && (
              <>
                {inboxError && (
                  <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                    {inboxError}
                  </div>
                )}

                {inboxLoading && (
                  <div className="mb-4 rounded border border-green-400/20 bg-green-400/5 px-4 py-3 text-green-300 text-sm">
                    INBOX... loading submissions from secure storage.
                  </div>
                )}

                {!inboxLoading && submissions.length === 0 && !inboxError && (
                  <div className="rounded border border-white/15 bg-white/5 px-4 py-3 text-white/70 text-sm">
                    Inbox is empty. New transmissions will appear here.
                  </div>
                )}

                {submissions.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-[1050px] w-full border-collapse">
                      <thead>
                        <tr className="text-left text-xs text-green-400/80">
                          <th className="border border-white/10 bg-white/5 px-3 py-2 rounded-tl-lg">RECEIVED</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2">SENDER</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2">EMAIL</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2">URGENCY</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2">SERVICES</th>
                          <th className="border border-white/10 bg-white/5 px-3 py-2 rounded-tr-lg">MESSAGE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((s, idx) => {
                          const received = s.receivedAt ? new Date(s.receivedAt).toLocaleString() : '—';
                          const sender = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown';
                          const services = Array.isArray(s.services)
                            ? s.services.join(', ')
                            : typeof s.services === 'string'
                              ? s.services
                              : '—';
                          const urgency = typeof s.urgency === 'number' || typeof s.urgency === 'string'
                            ? String(s.urgency)
                            : '—';
                          const message = [
                            s.contactMethod ? `Contact: ${s.contactMethod}` : null,
                            s.date ? `Date: ${s.date}` : null,
                            s.description ? `\n${s.description}` : null,
                          ]
                            .filter(Boolean)
                            .join('');

                          return (
                            <tr
                              key={`${s.receivedAt || idx}`}
                              className="align-top bg-black hover:bg-white/5 transition-colors"
                            >
                              <td className="border border-white/10 px-3 py-2 w-[220px]">
                                <div className="text-xs text-white/90">{received}</div>
                              </td>
                              <td className="border border-white/10 px-3 py-2 w-[240px]">
                                <div className="text-sm text-white font-bold">{sender}</div>
                                {s.phone ? (
                                  <div className="mt-1 text-[11px] text-white/60">{s.phone}</div>
                                ) : null}
                              </td>
                              <td className="border border-white/10 px-3 py-2 w-[210px]">
                                <div className="text-sm text-white/90">{s.email || '—'}</div>
                              </td>
                              <td className="border border-white/10 px-3 py-2 w-[120px]">
                                <div className="text-sm font-bold text-yellow-400">{urgency}</div>
                              </td>
                              <td className="border border-white/10 px-3 py-2 w-[240px]">
                                <div className="text-sm text-white/70">{services}</div>
                              </td>
                              <td className="border border-white/10 px-3 py-2">
                                <div className="text-[11px] text-white/60 max-h-16 overflow-hidden whitespace-pre-wrap">
                                  {message || '—'}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

