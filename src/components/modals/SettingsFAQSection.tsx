import React, { useState, useMemo } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'workouts' | 'nutrition' | 'coaching' | 'system';
  question: string;
  answer: string;
  hasWalkthroughAction?: boolean;
}

const FAQ_DATABASE: FAQItem[] = [
  {
    id: 'faq-routine-onboarding',
    category: 'workouts',
    question: 'How do I create a routine and log my first exercise?',
    answer:
      '1. Create a Routine: Go to Settings -> Training -> Edit Routines to name your split day (e.g. Day 1: Upper Body).\n2. Add an Exercise: Tap "+ Find & Add Exercise" and pick from 100+ exercises with anatomy heatmaps and form cues.\n3. Log Your Sets: Enter your working weight and reps, then tap the checkmark [✓] when finished to trigger rest vibration timers.\n\nTap the button below to launch the interactive step-by-step walkthrough anytime!',
    hasWalkthroughAction: true,
  },
  {
    id: 'faq-progression',
    category: 'workouts',
    question: 'How is progressive overload calculated?',
    answer:
      'When you hit the maximum prescribed reps on all working sets (e.g. 10 reps on a 6-10 rep target), the system automatically prompts you to increase weight by +2.5 kg on your next session. If reps are below target, it suggests mastering the current weight.',
  },
  {
    id: 'faq-rest-timer',
    category: 'workouts',
    question: 'How does the rest timer and vibration work?',
    answer:
      'Checking off any completed set row automatically starts a background rest countdown and gives a light haptic pulse. When your rest interval reaches 0 seconds, your phone emits a gentle 1-second vibration buzz so you do not have to stare at your screen.',
  },
  {
    id: 'faq-barcode',
    category: 'nutrition',
    question: 'How do I scan or import supermarket groceries?',
    answer:
      'In the Dietary tab, tap "+ Search Foods" and use the Camera Barcode Scanner for physical retail EAN barcodes, or paste direct product links from supported supermarkets (AH, Jumbo, Dirk, PLUS, Aldi, Lidl, Picnic, Hoogvliet, Spar). Nutritional macros are automatically extracted and validated.',
  },
  {
    id: 'faq-offline',
    category: 'system',
    question: 'Can I log workouts offline in gym basements?',
    answer:
      'Yes. The app is a Progressive Web App (PWA) with offline draft persistence in IndexedDB. Your active workout sets, photos, and notes are cached locally on your device and synchronized to Supabase as soon as your cellular connection restores.',
  },
  {
    id: 'faq-coach-invite',
    category: 'coaching',
    question: 'How do I invite an athlete or connect with my trainer?',
    answer:
      'Coaches can generate secure 6-character invite codes or shareable links directly from the Coach Command Center. Athletes can accept invites via Settings -> Coach Connections or by opening the direct invitation link.',
  },
  {
    id: 'faq-backups',
    category: 'system',
    question: 'How do I backup and restore my training data?',
    answer:
      'In Settings under "Data Backup & Restore", you can export a full machine-readable JSON backup containing all routines, workout sets, and body logs. You can import this backup anytime on any new device.',
  },
];

interface SettingsFAQSectionProps {
  onLaunchRoutineOnboarding?: () => void;
}

export const SettingsFAQSection: React.FC<SettingsFAQSectionProps> = ({
  onLaunchRoutineOnboarding,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FAQ_DATABASE;
    return FAQ_DATABASE.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const toggleItem = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 flex items-center justify-center text-[#C0FF00]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-display font-bold text-sm tracking-tight uppercase">
              Help & FAQ
            </h4>
            <p className="text-[10px] text-gray-500 font-mono">
              Quick answers about workouts, timers, scanning & backups
            </p>
          </div>
        </div>
      </div>

      {/* Quick Interactive Routine Walkthrough Banner */}
      {onLaunchRoutineOnboarding && (
        <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-xl flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[#C0FF00] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-white font-bold block truncate">
                Interactive Routine Guide
              </span>
              <span className="text-[11px] text-gray-400 font-sans block truncate">
                Learn how to add a routine, pick an exercise & log sets
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLaunchRoutineOnboarding}
            className="px-2.5 py-1.5 rounded-lg bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-[10px] uppercase tracking-wider shrink-0 cursor-pointer shadow-sm"
          >
            Start Guide
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search FAQ (e.g. rest timer, barcode, backup)..."
          className="w-full bg-[#1c1c1c] border border-[#2a2a2a] focus:border-[#C0FF00] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none font-sans"
        />
      </div>

      {/* Accordion List */}
      <div className="space-y-2 pt-1">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isExpanded}
                  className="w-full p-3 text-left flex items-center justify-between gap-2 cursor-pointer hover:bg-[#1f1f1f] transition-colors"
                >
                  <span className="font-sans font-bold text-xs text-gray-200">
                    {item.question}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#C0FF00] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-[#222] text-xs font-sans text-gray-400 leading-relaxed animate-in fade-in space-y-2.5">
                    <div className="whitespace-pre-line">{item.answer}</div>
                    {item.hasWalkthroughAction && onLaunchRoutineOnboarding && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={onLaunchRoutineOnboarding}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Launch Interactive Walkthrough</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-xs font-mono text-gray-500 bg-[#181818] rounded-xl border border-[#262626]">
            No answers matching &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
};
