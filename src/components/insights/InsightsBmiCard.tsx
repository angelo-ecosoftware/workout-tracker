import React from 'react';
import { Scale, ShieldCheck, Calendar } from 'lucide-react';
import { BodyMeasurementLog, UserMetrics } from '../../models.ts';
import { HeatmapDay } from '../../lib/insightsEngine.ts';

export interface BmiCategoryInfo {
  label: string;
  color: string;
  badgeBg: string;
  markerPos: number;
  advice: string;
}

export interface HoveredBmiDay {
  date: string;
  isToday: boolean;
  log?: BodyMeasurementLog;
  dayBmi: number | null;
  cat: BmiCategoryInfo | null;
}

interface InsightsBmiCardProps {
  userMetrics: UserMetrics | null;
  bmiValue: number | null;
  bmiCategory: BmiCategoryInfo | null;
  bodyLogs: BodyMeasurementLog[];
  heatmapDays: HeatmapDay[];
  hoveredBmiDay: HoveredBmiDay | null;
  onHoverBmiDay: (day: HoveredBmiDay | null) => void;
  getBmiCategory: (bmi: number) => BmiCategoryInfo;
}

export const InsightsBmiCard: React.FC<InsightsBmiCardProps> = ({
  userMetrics,
  bmiValue,
  bmiCategory,
  bodyLogs,
  heatmapDays,
  hoveredBmiDay,
  onHoverBmiDay,
  getBmiCategory,
}) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-3">
        <div>
          <h3 className="font-display font-black text-base text-white uppercase tracking-tight flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#C0FF00]" />
            90-Day Body Mass Index (BMI) & Biometrics
          </h3>
          <p className="text-[11px] font-sans text-gray-400 mt-0.5">
            Athlete body composition metric based on height and weight.
          </p>
        </div>

        {bmiCategory ? (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold self-start sm:self-auto ${bmiCategory.badgeBg}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {bmiCategory.label} (BMI {bmiValue})
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-[#333] text-[11px] font-mono text-gray-400 self-start sm:self-auto">
            Set Height & Weight in Profile
          </div>
        )}
      </div>

      {bmiValue && bmiCategory ? (
        <div className="space-y-4">
          {/* Quick Metrics Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#141414] border border-[#222] rounded-2xl p-3.5 space-y-1">
              <div className="text-[9px] font-mono uppercase font-bold text-gray-400">BMI Score</div>
              <div className="text-2xl font-display font-black text-white flex items-baseline gap-1.5">
                <span className={bmiCategory.color}>{bmiValue}</span>
                <span className="text-[10px] font-mono font-normal text-gray-500">kg/m²</span>
              </div>
              <div className={`text-[10px] font-mono font-bold ${bmiCategory.color}`}>
                {bmiCategory.label}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222] rounded-2xl p-3.5 space-y-1">
              <div className="text-[9px] font-mono uppercase font-bold text-gray-400">Current Weight</div>
              <div className="text-2xl font-display font-black text-white">
                {userMetrics?.weight ? `${userMetrics.weight} kg` : '—'}
              </div>
              <div className="text-[9px] font-mono text-gray-500">From athlete profile</div>
            </div>

            <div className="bg-[#141414] border border-[#222] rounded-2xl p-3.5 space-y-1">
              <div className="text-[9px] font-mono uppercase font-bold text-gray-400">Height</div>
              <div className="text-2xl font-display font-black text-white">
                {userMetrics?.height ? `${userMetrics.height} cm` : '—'}
              </div>
              <div className="text-[9px] font-mono text-gray-500">From athlete profile</div>
            </div>

            <div className="bg-[#141414] border border-[#222] rounded-2xl p-3.5 space-y-1">
              <div className="text-[9px] font-mono uppercase font-bold text-gray-400">Normal Range</div>
              <div className="text-xl font-display font-black text-[#C0FF00]">
                18.5 – 24.9
              </div>
              <div className="text-[9px] font-mono text-gray-500">WHO Standard</div>
            </div>
          </div>

          {/* 90-Day BMI & Bodyweight Calendar Heatmap Grid */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-2.5">
              <div>
                <span className="text-[11px] font-display font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C0FF00]" />
                  90-Day Bodyweight & BMI Heatmap Matrix
                </span>
                <p className="text-[10px] font-sans text-gray-400 mt-0.5">
                  {bodyLogs.length} logged daily weigh-ins over the last 90 days.
                </p>
              </div>

              {/* Heatmap Legend by Category */}
              <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400 self-start sm:self-auto flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#181818] border border-[#282828] inline-block" />
                  None
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400/80 inline-block" />
                  &lt;18.5
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#C0FF00] inline-block" />
                  18.5-24.9
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                  25-29.9
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                  ≥30
                </span>
              </div>
            </div>

            {/* Grid - Standard Calendar View: Left to Right, Rows = Weeks */}
            <div className="space-y-1.5 pt-1">
              {/* Day of week headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Calendar Grid: Left-to-Right by day, Top-to-Bottom by week */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 max-w-xl mx-auto">
                {heatmapDays.map((day) => {
                  const log = bodyLogs.find((l) => l.logDate === day.date);
                  const logHeightM = (log?.heightCm || userMetrics?.height) ? (log?.heightCm || userMetrics!.height!) / 100 : null;
                  const dayBmi = log?.calculatedBmi || (log && logHeightM && logHeightM > 0 ? Number((log.weightKg / (logHeightM * logHeightM)).toFixed(1)) : null);
                  const cat = dayBmi ? getBmiCategory(dayBmi) : null;

                  let bgClass = 'bg-[#181818] border border-[#282828] hover:border-[#555]';
                  if (log && dayBmi && cat) {
                    if (dayBmi < 18.5) {
                      bgClass = 'bg-sky-400 text-black font-bold border border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.3)]';
                    } else if (dayBmi < 25) {
                      bgClass = 'bg-[#C0FF00] text-black font-bold border border-[#C0FF00] shadow-[0_0_8px_rgba(192,255,0,0.3)]';
                    } else if (dayBmi < 30) {
                      bgClass = 'bg-amber-400 text-black font-bold border border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]';
                    } else {
                      bgClass = 'bg-rose-500 text-white font-bold border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
                    }
                  }

                  const d = new Date(day.date);
                  const dayOfMonth = d.getDate();

                  const dayPayload = {
                    date: day.date,
                    isToday: day.isToday,
                    log,
                    dayBmi,
                    cat,
                  };

                  return (
                    <div
                      key={day.date}
                      onMouseEnter={() => onHoverBmiDay(dayPayload)}
                      onMouseLeave={() => onHoverBmiDay(null)}
                      className={`h-7 sm:h-8 rounded-md flex flex-col items-center justify-center transition-all cursor-pointer px-0.5 relative ${bgClass} ${
                        day.isToday ? 'ring-1.5 ring-white font-black' : ''
                      } hover:scale-105`}
                    >
                      <span className={`text-[9px] sm:text-[10px] leading-none font-mono ${log ? 'font-black' : 'text-gray-400'}`}>
                        {dayOfMonth}
                      </span>
                      {log && (
                        <span className="text-[7px] leading-tight font-mono font-black uppercase tracking-tighter truncate max-w-full">
                          {Math.round(log.weightKg)}kg
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hover details pill */}
              <div className="min-h-[28px] mt-2 flex items-center">
                {hoveredBmiDay ? (
                  <div className="text-[11px] font-mono text-gray-300 flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#333] inline-flex flex-wrap">
                    <span className="text-[#C0FF00] font-bold">{hoveredBmiDay.date}:</span>
                    {hoveredBmiDay.log ? (
                      <span>
                        <strong className="text-white">{hoveredBmiDay.log.weightKg} kg</strong>
                        {hoveredBmiDay.dayBmi && (
                          <span className="ml-1.5">
                            • BMI <strong className={hoveredBmiDay.cat?.color || 'text-white'}>{hoveredBmiDay.dayBmi}</strong> ({hoveredBmiDay.cat?.label})
                          </span>
                        )}
                        {hoveredBmiDay.log.source && (
                          <span className="ml-1.5 text-[9px] uppercase px-1 py-0.2 rounded bg-[#222] text-gray-400">
                            {hoveredBmiDay.log.source}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">No weigh-in recorded</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-gray-500">
                    Hover or tap any date to inspect daily bodyweight and BMI calculation.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visual BMI Gauge Spectrum */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-gray-400">
              <span>BMI Spectrum Distribution</span>
              <span className={bmiCategory.color}>Your Position: {bmiValue}</span>
            </div>

            {/* Gradient Track with Marker */}
            <div className="relative pt-2 pb-1">
              <div className="h-3 rounded-full w-full bg-gradient-to-r from-sky-400 via-[#C0FF00] via-45% via-amber-400 via-75% to-rose-500 overflow-hidden opacity-90 shadow-inner" />
              
              {/* Pointer Marker */}
              <div
                className="absolute top-0 -ml-2 flex flex-col items-center transition-all duration-500 pointer-events-none"
                style={{ left: `${bmiCategory.markerPos}%` }}
              >
                <div className="w-4 h-4 rounded-full bg-white border-2 border-black shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                <div className="w-0.5 h-3 bg-white" />
              </div>
            </div>

            {/* Spectrum Range Labels */}
            <div className="grid grid-cols-4 text-center text-[9px] font-mono text-gray-400 pt-1">
              <div className="text-left">
                <span className="block text-sky-400 font-bold">&lt; 18.5</span>
                <span className="text-gray-500">Underweight</span>
              </div>
              <div className="text-center">
                <span className="block text-[#C0FF00] font-bold">18.5 – 24.9</span>
                <span className="text-gray-500">Normal</span>
              </div>
              <div className="text-center">
                <span className="block text-amber-400 font-bold">25.0 – 29.9</span>
                <span className="text-gray-500">Overweight</span>
              </div>
              <div className="text-right">
                <span className="block text-rose-400 font-bold">&ge; 30.0</span>
                <span className="text-gray-500">Obese</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#222] flex items-center justify-between text-[11px] font-sans text-gray-400">
              <span><strong className="text-white">Guidance:</strong> {bmiCategory.advice}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
            <Scale className="w-5 h-5" />
          </div>
          <div className="text-xs font-display font-bold text-white uppercase">
            No Biometric Data Recorded
          </div>
          <p className="text-[11px] font-sans text-gray-400 max-w-sm mx-auto">
            Click your user profile avatar in the header to enter your height and weight. Your real-time BMI trajectory, classification, and fitness guidance will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
