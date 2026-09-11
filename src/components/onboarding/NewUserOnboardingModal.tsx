import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { FitnessLevel, Somatotype, UserMetrics, Workout, Exercise } from '../../models.ts';
import { completeUserOnboarding, saveUserMetrics, saveWorkoutsAndExercises } from '../../lib/supabaseData.ts';
import { saveRoutineProgramToLibrary, setActiveRoutineProgram } from '../../lib/db/routineLibrary.ts';

type GeneratedExercise = {
  name: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  formCues?: string[];
};

type GeneratedRoutine = {
  title: string;
  description: string;
  days: Array<{ day: string; focus: string; exercises: GeneratedExercise[] }>;
};

interface NewUserOnboardingModalProps {
  isOpen: boolean;
  userId: string;
  onComplete: () => void;
}

const DAYS = [
  ['monday', 'Mon'],
  ['tuesday', 'Tue'],
  ['wednesday', 'Wed'],
  ['thursday', 'Thu'],
  ['friday', 'Fri'],
  ['saturday', 'Sat'],
  ['sunday', 'Sun'],
] as const;

const EXPERIENCE_OPTIONS: Array<{ value: FitnessLevel; label: string }> = [
  { value: 'absolute_beginner', label: 'Absolute beginner' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'rookie', label: 'Rookie' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'amateur', label: 'Amateur' },
  { value: 'professional_athlete', label: 'Professional athlete' },
];

const parseReps = (reps: string): [number, number] => {
  const values = reps.match(/\d+/g)?.map(Number) || [8, 12];
  return [values[0] || 8, values[1] || values[0] || 12];
};

const toWorkouts = (routine: GeneratedRoutine): (Workout & { exercises: Exercise[] })[] =>
  routine.days.map((day, dayIndex) => ({
    id: `custom_w_ai_${dayIndex}`,
    name: `Day ${dayIndex + 1} - ${day.focus || day.day}`,
    order: dayIndex + 1,
    exerciseIds: day.exercises.map((_, index) => `custom_ai_${dayIndex}_${index}`),
    exercises: day.exercises.map((exercise, index) => {
      const [targetRepMin, targetRepMax] = parseReps(exercise.reps);
      return {
        id: `custom_ai_${dayIndex}_${index}`,
        name: exercise.name,
        type: 'strength',
        targetSets: Math.max(1, Number(exercise.sets) || 3),
        targetRepMin,
        targetRepMax,
        customCues: {
          cues: exercise.formCues || [],
        },
      };
    }),
  }));

export const NewUserOnboardingModal: React.FC<NewUserOnboardingModalProps> = ({
  isOpen,
  userId,
  onComplete,
}) => {
  const [step, setStep] = useState<'welcome' | 'profile' | 'generating' | 'review'>('welcome');
  const [goal, setGoal] = useState('General fitness');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('absolute_beginner');
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'wednesday', 'friday']);
  const [trainingLocation, setTrainingLocation] = useState<UserMetrics['trainingLocation']>('gym');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState<Somatotype>('not_specified');
  const [equipment, setEquipment] = useState('');
  const [injuries, setInjuries] = useState('');
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(
    () => Number(weight) > 0 && Number(height) > 0 && selectedDays.length > 0,
    [height, selectedDays.length, weight]
  );

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.length > 1 ? current.filter((item) => item !== day) : current
        : [...current, day]
    );
  };

  const generateRoutine = async () => {
    if (!canContinue) return;
    setError(null);
    setStep('generating');

    const profile = {
      mainGoal: goal,
      fitnessLevel,
      availableDays: selectedDays,
      workoutDurationMinutes: 60,
      equipment: equipment || (trainingLocation === 'gym' ? 'Commercial gym' : 'Bodyweight and basic equipment'),
      injuriesOrAvoidances: injuries || 'None provided',
      trainingLocation,
      heightCm: Number(height),
      weightKg: Number(weight),
      bodyType,
    };

    try {
      await saveUserMetrics(userId, {
        fitnessLevel,
        trainingLocation,
        somatotype: bodyType,
        goals: [goal],
        height: Number(height),
        weight: Number(weight),
        bodyMeasurementsNotes: injuries || undefined,
        updatedAt: new Date().toISOString(),
      });

      const response = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const payload = await response.json() as { routine?: GeneratedRoutine; error?: string };
      if (!response.ok || !payload.routine) throw new Error(payload.error || 'Could not generate your routine.');
      setRoutine(payload.routine);
      setStep('review');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not generate your routine.');
      setStep('profile');
    }
  };

  const approveRoutine = async () => {
    if (!routine) return;
    setSaving(true);
    setError(null);
    try {
      const workouts = toWorkouts(routine);
      const savedProgram = await saveRoutineProgramToLibrary(
        userId,
        routine.title,
        { workouts },
        routine.description
      );
      await saveWorkoutsAndExercises(userId, workouts);
      if (!savedProgram.id.startsWith('prog_')) {
        await setActiveRoutineProgram(userId, savedProgram.id);
      }
      await completeUserOnboarding(userId, 1);
      try {
        localStorage.setItem(`welcome_shown_${userId}`, 'true');
      } catch {}
      window.dispatchEvent(new Event('onboarding_completed'));
      onComplete();
      window.setTimeout(() => {
        const tour = driver({
          showProgress: true,
          allowClose: true,
          steps: [
            {
              element: '[data-tour="session-nav"]',
              popover: { title: 'Your Session', description: 'Open your routine, choose a training day, and start tracking your sets.' },
            },
            {
              element: '[data-tour="start-workout"]',
              popover: { title: 'Start tracking', description: 'Start the workout when you are ready, then record each set as you train.' },
            },
          ],
        });
        tour.drive();
      }, 500);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your routine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#2b2b2b] bg-[#111] shadow-2xl">
        {step === 'welcome' && (
          <div className="overflow-y-auto p-5 sm:p-8">
            <div className="mb-5 flex items-center gap-2 text-[#C0FF00]">
              <Sparkles className="h-5 w-5" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">Welcome to Kinisia</span>
            </div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Build momentum. Track every session.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
              We’ll use a few essentials to create a starter routine that fits your goals, experience, and available days.
            </p>
            <img
              src="/onboarding/workout-introduction.svg"
              alt="Kinisia workout tracking preview"
              className="mt-6 w-full rounded-2xl border border-[#292929] bg-[#0b0b0b]"
            />
            <button
              type="button"
              onClick={() => setStep('profile')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C0FF00] px-5 py-3 font-display text-sm font-black uppercase tracking-wider text-black"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 'profile' && (
          <div className="overflow-y-auto p-5 sm:p-8">
            <div className="mb-5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C0FF00]">Step 1 · Required setup</span>
              <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">Choose your starting point</h2>
              <p className="mt-2 text-xs text-gray-400">Weight, height, experience, and available days are required. Everything else is optional.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="rounded-xl border border-[#292929] bg-[#181818] p-3 text-[10px] font-bold uppercase text-gray-400">
                Weight (kg)
                <input required type="number" min="30" max="300" value={weight} onChange={(event) => setWeight(event.target.value)} className="mt-2 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#C0FF00]" />
              </label>
              <label className="rounded-xl border border-[#292929] bg-[#181818] p-3 text-[10px] font-bold uppercase text-gray-400">
                Height (cm)
                <input required type="number" min="100" max="250" value={height} onChange={(event) => setHeight(event.target.value)} className="mt-2 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#C0FF00]" />
              </label>
            </div>

            <div className="mt-4">
              <label className="text-[10px] font-bold uppercase text-gray-400">Experience level</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => setFitnessLevel(option.value)} className={`rounded-xl border px-2 py-2 text-[10px] font-bold uppercase ${fitnessLevel === option.value ? 'border-[#C0FF00] bg-[#C0FF00] text-black' : 'border-[#333] bg-[#181818] text-gray-400'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-[10px] font-bold uppercase text-gray-400">Available training days</label>
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {DAYS.map(([value, label]) => (
                  <button key={value} type="button" onClick={() => toggleDay(value)} className={`rounded-xl border px-2 py-2 text-[10px] font-bold uppercase ${selectedDays.includes(value) ? 'border-[#C0FF00] bg-[#C0FF00] text-black' : 'border-[#333] bg-[#181818] text-gray-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] font-bold uppercase text-gray-400">Primary goal
                <select value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-2 w-full rounded-xl border border-[#333] bg-[#181818] px-3 py-2 text-xs text-white">
                  <option>General fitness</option>
                  <option>Muscle gain</option>
                  <option>Fat loss</option>
                  <option>Strength</option>
                  <option>Mobility</option>
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase text-gray-400">Training location
                <select value={trainingLocation} onChange={(event) => setTrainingLocation(event.target.value as UserMetrics['trainingLocation'])} className="mt-2 w-full rounded-xl border border-[#333] bg-[#181818] px-3 py-2 text-xs text-white">
                  <option value="gym">Gym</option>
                  <option value="home">Home</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder="Equipment (optional)" className="rounded-xl border border-[#333] bg-[#181818] px-3 py-2 text-xs text-white outline-none focus:border-[#C0FF00]" />
              <input value={injuries} onChange={(event) => setInjuries(event.target.value)} placeholder="Injuries or exercises to avoid (optional)" className="rounded-xl border border-[#333] bg-[#181818] px-3 py-2 text-xs text-white outline-none focus:border-[#C0FF00]" />
            </div>

            {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
            <button type="button" disabled={!canContinue} onClick={generateRoutine} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C0FF00] px-5 py-3 font-display text-sm font-black uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-40">
              Generate my starter routine <Sparkles className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#C0FF00]" />
            <h2 className="mt-5 font-display text-2xl font-black uppercase text-white">Building your starting routine</h2>
            <p className="mt-2 max-w-md text-sm text-gray-400">We’re balancing your training days, recovery, goal, and experience.</p>
          </div>
        )}

        {step === 'review' && routine && (
          <div className="flex max-h-[92vh] flex-col">
            <div className="border-b border-[#292929] p-5 sm:p-7">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C0FF00]">Review before saving</span>
              <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">{routine.title}</h2>
              <p className="mt-2 text-xs text-gray-400">{routine.description}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5 sm:p-7">
              {routine.days.map((day) => (
                <div key={day.day} className="rounded-2xl border border-[#292929] bg-[#181818] p-4">
                  <h3 className="font-bold uppercase text-white">{day.day} · {day.focus}</h3>
                  <p className="mt-2 text-xs text-gray-400">{day.exercises.map((exercise) => `${exercise.name} (${exercise.sets} × ${exercise.reps})`).join(' · ')}</p>
                </div>
              ))}
              {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
            </div>
            <div className="flex gap-3 border-t border-[#292929] p-5 sm:p-7">
              <button type="button" disabled={saving} onClick={() => setStep('profile')} className="flex-1 rounded-2xl border border-[#333] px-4 py-3 text-xs font-bold uppercase text-gray-300">Adjust profile</button>
              <button type="button" disabled={saving} onClick={approveRoutine} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#C0FF00] px-4 py-3 text-xs font-black uppercase text-black">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save and start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
