import React from 'react';
import { Calendar, Ruler, Weight } from 'lucide-react';
import { UserMetrics } from '../../models.ts';

interface ProfileBiometricsSectionProps {
  dob: string;
  setDob: (val: string) => void;
  calculatedAge: number | null;
  gender: UserMetrics['gender'];
  setGender: (val: UserMetrics['gender']) => void;
  height: string;
  setHeight: (val: string) => void;
  weight: string;
  setWeight: (val: string) => void;
}

export const ProfileBiometricsSection: React.FC<ProfileBiometricsSectionProps> = ({
  dob,
  setDob,
  calculatedAge,
  gender,
  setGender,
  height,
  setHeight,
  weight,
  setWeight,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#C0FF00] flex items-center gap-1.5">
        <Ruler className="w-3.5 h-3.5" /> Biometrics & Body
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date of Birth & Age */}
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#C0FF00]/60 transition-colors">
          <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#C0FF00]" /> Date of Birth
            </span>
            {calculatedAge !== null && (
              <span className="text-[#C0FF00] font-mono font-black">{calculatedAge} yrs</span>
            )}
          </label>
          <input
            type="date"
            value={dob}
            max={new Date().toISOString().split('T')[0]}
            onClick={(e) => {
              try {
                if ('showPicker' in HTMLInputElement.prototype) {
                  (e.target as HTMLInputElement).showPicker();
                }
              } catch {}
            }}
            onChange={(e) => setDob(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#C0FF00] [color-scheme:dark] cursor-pointer"
          />
        </div>

        {/* Gender */}
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#C0FF00]/60 transition-colors">
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-[#C0FF00]"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        {/* Height */}
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#C0FF00]/60 transition-colors">
          <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1">
            <Ruler className="w-3 h-3 text-[#C0FF00]" /> Height (cm)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="50"
            max="280"
            placeholder="e.g. 182"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#C0FF00]"
          />
        </div>

        {/* Weight */}
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 focus-within:border-[#C0FF00]/60 transition-colors">
          <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1">
            <Weight className="w-3 h-3 text-[#C0FF00]" /> Current Weight (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="20"
            max="400"
            placeholder="e.g. 78.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#C0FF00]"
          />
        </div>
      </div>
    </div>
  );
};
