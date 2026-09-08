import React from 'react';
import { Calendar, Ruler, Weight, User } from 'lucide-react';
import { UserMetrics, Somatotype } from '../../models.ts';

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
  somatotype?: Somatotype;
  setSomatotype: (val: Somatotype) => void;
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
  somatotype,
  setSomatotype,
}) => {
  const SOMATOTYPE_OPTIONS: Array<{
    type: Somatotype;
    label: string;
    description: string;
    trait: string;
  }> = [
    {
      type: 'ectomorph',
      label: 'Ectomorph',
      description: 'Naturally lean, fast metabolism, narrow shoulders',
      trait: 'Hardgainer • Fast Recovery',
    },
    {
      type: 'mesomorph',
      label: 'Mesomorph',
      description: 'Athletic, naturally muscular, broad shoulders',
      trait: 'Efficient Muscle Gain • Balanced',
    },
    {
      type: 'endomorph',
      label: 'Endomorph',
      description: 'Naturally solid, broad build, slower metabolism',
      trait: 'High Strength • Easy Bulk',
    },
  ];

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
            onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | 'prefer_not_to_say')}
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
            placeholder="e.g. 78.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#C0FF00]"
          />
        </div>
      </div>

      {/* Somatotype / Body Type Selector */}
      <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3 space-y-2">
        <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-[#C0FF00]" /> Body Type (Somatotype)
          </span>
          {somatotype && (
            <span className="text-[#C0FF00] font-mono font-bold uppercase text-[9px] bg-[#C0FF00]/10 border border-[#C0FF00]/25 px-2 py-0.5 rounded">
              {somatotype}
            </span>
          )}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SOMATOTYPE_OPTIONS.map((item) => {
            const isSelected = somatotype === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setSomatotype(item.type)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#C0FF00]/15 border-[#C0FF00] text-white shadow-sm'
                    : 'bg-[#121212] border-[#2c2c2c] text-gray-300 hover:border-gray-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-tight ${isSelected ? 'text-[#C0FF00]' : 'text-white'}`}>
                      {item.label}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#C0FF00] animate-pulse" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans leading-tight">
                    {item.description}
                  </p>
                </div>
                <div className={`mt-2 text-[9px] font-mono font-bold uppercase tracking-wider ${isSelected ? 'text-[#C0FF00]' : 'text-gray-500'}`}>
                  {item.trait}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
