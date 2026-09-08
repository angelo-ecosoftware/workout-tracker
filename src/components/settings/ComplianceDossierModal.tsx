import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Download,
  FileText,
  Lock,
  Layers,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Server,
  Key,
} from 'lucide-react';
import {
  generateComplianceDossier,
  downloadComplianceDossier,
  ComplianceDossierData,
} from '../../lib/complianceDossierGenerator.ts';

interface ComplianceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceDossierModal: React.FC<ComplianceDossierModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sbom' | 'rls' | 'crypto'>('overview');
  const [dossier] = useState<ComplianceDossierData>(() => generateComplianceDossier());

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compliance-dossier-title"
      onClick={onClose}
      className="fixed inset-0 z-[105] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-[#2a2a2a] rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden text-left animate-in zoom-in-95 duration-200"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C0FF00]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/15 border border-[#C0FF00]/30 flex items-center justify-center text-[#C0FF00] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3
                id="compliance-dossier-title"
                className="font-display font-black text-base sm:text-lg text-white uppercase tracking-tight truncate"
              >
                EU Compliance & Security Dossier
              </h3>
              <p className="text-[10px] font-mono text-gray-400 truncate">
                GDPR • EU CRA (Reg 2024/2847) • NIS2 • ENISA Standards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadComplianceDossier('markdown')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              title="Download Compliance Dossier as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-xl bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2a2a2a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 pb-2 border-b border-[#222] bg-[#121212] overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#C0FF00] text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Executive Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sbom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sbom'
                ? 'bg-[#C0FF00] text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            SBOM (CRA Art. 13)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rls')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rls'
                ? 'bg-[#C0FF00] text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            RLS Matrix (12 Tables)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crypto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'crypto'
                ? 'bg-[#C0FF00] text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cryptographic Proof
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-sans">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-[#161616] border border-[#282828] rounded-2xl p-4 space-y-2">
                <span className="font-mono text-[10px] font-bold text-[#C0FF00] uppercase tracking-wider block">
                  Audited System Baseline
                </span>
                <div className="text-white font-bold text-sm">{dossier.platform.name}</div>
                <div className="font-mono text-gray-400 text-[11px]">
                  Specification: {dossier.platform.specification}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 space-y-1">
                  <div className="text-gray-400 text-[10px] font-mono uppercase font-bold">
                    GDPR Posture (Art. 9 & 17)
                  </div>
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conformant Architecture</span>
                  </div>
                </div>

                <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 space-y-1">
                  <div className="text-gray-400 text-[10px] font-mono uppercase font-bold">
                    EU Cyber Resilience Act (CRA)
                  </div>
                  <div className="text-[#C0FF00] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SBOM & Security In Place</span>
                  </div>
                </div>

                <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 space-y-1">
                  <div className="text-gray-400 text-[10px] font-mono uppercase font-bold">
                    OWASP Benchmark
                  </div>
                  <div className="text-sky-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ASVS 5.0.0 Level 2</span>
                  </div>
                </div>

                <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 space-y-1">
                  <div className="text-gray-400 text-[10px] font-mono uppercase font-bold">
                    Right to be Forgotten
                  </div>
                  <div className="text-amber-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>1-Tap Atomic Cascade</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
                <div className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  GDPR Article 9 Special Category Biometrics Map
                </div>
                <ul className="space-y-1.5 text-gray-300">
                  {dossier.gdprDataMap.article9HealthData.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C0FF00]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'sbom' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
                <span>Format: {dossier.sbom.format}</span>
                <span className="text-[#C0FF00] font-bold">0 Known Vulnerabilities</span>
              </div>

              <div className="border border-[#262626] rounded-2xl overflow-hidden bg-[#141414]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#181818] text-[10px] font-mono text-gray-400 uppercase">
                      <th className="p-2.5">Component</th>
                      <th className="p-2.5">Version</th>
                      <th className="p-2.5">Purpose</th>
                      <th className="p-2.5">License</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222] font-mono text-xs">
                    {dossier.sbom.topDependencies.map((dep, idx) => (
                      <tr key={idx} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-2.5 font-bold text-white">{dep.name}</td>
                        <td className="p-2.5 text-gray-400">{dep.version}</td>
                        <td className="p-2.5 text-gray-300 font-sans text-[11px]">{dep.purpose}</td>
                        <td className="p-2.5 text-[#C0FF00]">{dep.license}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-3">
              <div className="text-gray-400 text-xs font-mono">
                12 Production Relational Tables Verified with Strict Row Level Security.
              </div>

              <div className="border border-[#262626] rounded-2xl overflow-hidden bg-[#141414]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#181818] text-[10px] font-mono text-gray-400 uppercase">
                      <th className="p-2.5">Table</th>
                      <th className="p-2.5">RLS Enforced</th>
                      <th className="p-2.5">Access Scope</th>
                      <th className="p-2.5">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222] font-mono text-xs">
                    {dossier.rlsMatrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-2.5 font-bold text-white">{row.tableName}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">FORCE RLS</td>
                        <td className="p-2.5 text-gray-300 font-sans text-[11px]">{row.accessScope}</td>
                        <td className="p-2.5 text-gray-400 text-[10px]">{row.healthDataClassification}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'crypto' && (
            <div className="space-y-3 font-mono">
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
                <div className="text-[#C0FF00] text-xs font-bold uppercase">Transport Security</div>
                <div className="text-white text-xs">{dossier.cryptographicSecurity.tlsVersion}</div>
                <div className="text-gray-400 text-[11px] pt-1">HSTS: {dossier.cryptographicSecurity.hsts}</div>
              </div>

              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
                <div className="text-[#C0FF00] text-xs font-bold uppercase">Forward Secrecy Ciphers</div>
                <ul className="space-y-1 text-xs text-gray-300">
                  {dossier.cryptographicSecurity.ciphers.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C0FF00]" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
                <div className="text-[#C0FF00] text-xs font-bold uppercase">HTTP Security Headers</div>
                <div className="text-gray-300 text-[11px] leading-relaxed">
                  <div>Cookies: {dossier.cryptographicSecurity.cookieSecurity}</div>
                  <div className="mt-1">CSP: {dossier.cryptographicSecurity.csp}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#222] bg-[#141414] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => downloadComplianceDossier('json')}
            className="px-3.5 py-2 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-gray-300 font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
