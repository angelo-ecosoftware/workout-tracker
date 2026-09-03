import React, { useState } from 'react';
import { Scale, Info, X } from 'lucide-react';
import { UserMetrics, BodyMeasurementLog } from '../../models.ts';

interface BodyMetricsCardProps {
  userMetrics: UserMetrics | null;
  bodyLogs: BodyMeasurementLog[];
}

export const BodyMetricsCard: React.FC<BodyMetricsCardProps> = ({ userMetrics, bodyLogs }) => {
  const [activeInfoKey, setActiveInfoKey] = useState<string | null>(null);

  const heightM = userMetrics?.height ? userMetrics.height / 100 : null;
  const weightKg = userMetrics?.weight || null;
  const bmiValue =
    heightM && weightKg && heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : null;

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) {
      return {
        label: 'Underweight',
        color: 'text-sky-400',
        badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
        markerPos: Math.min(Math.max(((bmi - 14) / (35 - 14)) * 100, 4), 96),
        advice: 'Consider a caloric surplus and progressive strength training to build lean muscle mass.',
      };
    }
    if (bmi < 25) {
      return {
        label: 'Normal Weight',
        color: 'text-[#C0FF00]',
        badgeBg: 'bg-[#C0FF00]/10 border-[#C0FF00]/30 text-[#C0FF00]',
        markerPos: Math.min(Math.max(((bmi - 14) / (35 - 14)) * 100, 4), 96),
        advice: 'Optimal health range. Focus on progressive overload and body recomposition.',
      };
    }
    if (bmi < 30) {
      return {
        label: 'Overweight',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        markerPos: Math.min(Math.max(((bmi - 14) / (35 - 14)) * 100, 4), 96),
        advice: 'Maintain training volume with a moderate calorie deficit or high-protein recomposition.',
      };
    }
    return {
      label: 'Obese',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      markerPos: Math.min(Math.max(((bmi - 14) / (35 - 14)) * 100, 4), 96),
      advice: 'Prioritize consistent low-impact movement, clean nutrition, and structured resistance training.',
    };
  };

  const bmiCategory = bmiValue ? getBmiCategory(bmiValue) : null;

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-[24px] p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#C0FF00]" />
          <h3 className="font-display font-black text-sm uppercase text-white tracking-wide">
            Body Composition & BMI
          </h3>
          <button
            type="button"
            onClick={() => setActiveInfoKey(activeInfoKey === 'bmi' ? null : 'bmi')}
            className="text-gray-500 hover:text-gray-300 p-0.5 rounded cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        {bmiCategory && (
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${bmiCategory.badgeBg}`}
          >
            {bmiCategory.label}
          </span>
        )}
      </div>

      {activeInfoKey === 'bmi' && (
        <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl text-xs text-gray-300 font-sans flex items-start justify-between gap-2">
          <p>
            Body Mass Index (BMI) evaluates weight relative to height squared. Strength athletes carrying substantial muscle mass may register higher categories with low body fat.
          </p>
          <button
            type="button"
            onClick={() => setActiveInfoKey(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {bmiValue ? (
        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black font-display text-white">{bmiValue}</span>
            <span className="text-xs font-mono text-gray-400">
              Weight: {userMetrics?.weight}kg • Height: {userMetrics?.height}cm
            </span>
          </div>

          {/* BMI Gauge Range Visualizer */}
          {bmiCategory && (
            <div className="space-y-1.5">
              <div className="relative h-2.5 bg-gradient-to-r from-sky-500 via-[#C0FF00] via-amber-500 to-rose-500 rounded-full overflow-hidden">
                <div
                  style={{ left: `${bmiCategory.markerPos}%` }}
                  className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_white] -translate-x-1/2"
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>18.5 (Under)</span>
                <span>25.0 (Normal)</span>
                <span>30.0 (Over)</span>
              </div>
            </div>
          )}

          {bmiCategory && (
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              {bmiCategory.advice}
            </p>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500 font-sans py-4">
          Set your height and bodyweight in settings or during workout check-ins to unlock BMI and lean mass metrics.
        </div>
      )}
    </div>
  );
};
