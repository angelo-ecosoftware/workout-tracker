import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, CircleHelp, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { FitnessLevel, Somatotype, UserProfile } from '../../models.ts';
import { initializeUser, OnboardingProfileData, saveOnboardingProfile } from '../../lib/db/users.ts';
import { ONBOARDING_GOALS } from '../modals/ProfileGoalsSection.tsx';

interface OnboardingModalProps {
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

const DURATIONS = [30, 60, 90, 120] as const;
const LEVELS: Array<{ value: FitnessLevel; label: string }> = [
  { value: 'absolute_beginner', label: 'Absolute beginner' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'rookie', label: 'Rookie' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'amateur', label: 'Amateur' },
  { value: 'professional_athlete', label: 'Professional athlete' },
];

const TOUR_STEPS = [
  ['[data-onboarding="goals"]', 'Your goal', 'Choose at least one goal so your future routines and plans can fit what you want to achieve.'],
  ['[data-onboarding="days"]', 'Your training days', 'Select every day you are available. You can change this later.'],
  ['[data-onboarding="duration"]', 'Your session length', 'Choose the time you normally have available for a session.'],
  ['[data-onboarding="experience"]', 'Your experience', 'This helps Kinisia keep recommendations appropriate and sustainable.'],
  ['[data-onboarding="location"]', 'Training location', 'Choose where you normally train so future suggestions match your environment.'],
  ['[data-onboarding="optional"]', 'Optional profile details', 'These fields improve personalization but are never required to start.'],
] as const;

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  userId,
  onComplete,
}) => {
  const [stage, setStage] = useState<'welcome' | 'form' | 'saving' | 'confirmSkip'>('welcome');
  const [goals, setGoals] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [duration, setDuration] = useState<OnboardingProfileData['sessionDurationMinutes'] | null>(null);
  const [level, setLevel] = useState<FitnessLevel | undefined>(undefined);
  const [location, setLocation] = useState<UserProfile['trainingLocation'] | undefined>(undefined);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<UserProfile['gender']>('prefer_not_to_say');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyType, setBodyType] = useState<Somatotype>('not_specified');
  const [injuries, setInjuries] = useState('');
  const [error, setError] = useState<string | null>(null);
  const driverRef = useRef<Driver | null>(null);
  const tourStartedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    initializeUser(userId)
      .then((savedProfile) => {
        setDays(savedProfile.trainingDays || []);
        setDuration(savedProfile.sessionDurationMinutes || null);
        setLevel(savedProfile.fitnessLevel === 'advanced' ? 'amateur' : savedProfile.fitnessLevel);
        setLocation(savedProfile.trainingLocation);
        setGoals(savedProfile.goals || savedProfile.metrics?.goals || []);
        setDateOfBirth(savedProfile.dateOfBirth || savedProfile.metrics?.dateOfBirth || '');
        setGender(savedProfile.gender || savedProfile.metrics?.gender || 'prefer_not_to_say');
        setHeight(savedProfile.heightCm?.toString() || savedProfile.metrics?.height?.toString() || '');
        setWeight(savedProfile.weightKg?.toString() || savedProfile.metrics?.weight?.toString() || '');
        setBodyType(savedProfile.metrics?.somatotype || 'not_specified');
        setInjuries(savedProfile.injuriesNotes || savedProfile.metrics?.bodyMeasurementsNotes || '');
      })
      .catch(() => {
        // New users have no saved onboarding values yet.
      });
  }, [isOpen, userId]);

  const isComplete = useMemo(
    () => goals.length > 0 && days.length > 0 && Boolean(duration && level && location),
    [days.length, duration, goals.length, level, location]
  );

  useEffect(() => {
    if (!isOpen || stage !== 'form' || tourStartedRef.current) return;
    tourStartedRef.current = true;

    const timer = window.setTimeout(() => {
      const tour = driver({
        allowClose: false,
        allowScroll: false,
        popoverClass: 'kinisia-driver-popover',
        showProgress: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Done',
        steps: TOUR_STEPS.map(([element, popoverTitle, description]) => ({
          element,
          popover: { title: popoverTitle, description },
        })),
        onPopoverRender: (popover) => {
          popover.wrapper.classList.add('kinisia-driver-popover');
          if (popover.footerButtons.querySelector('[data-skip-onboarding]')) return;
          const skipButton = document.createElement('button');
          skipButton.type = 'button';
          skipButton.dataset.skipOnboarding = 'true';
          skipButton.className = 'driver-popover-footer-btn kinisia-driver-skip';
          skipButton.textContent = 'Skip onboarding';
          skipButton.addEventListener('click', () => {
            tour.destroy();
            setStage('confirmSkip');
          });
          popover.footerButtons.prepend(skipButton);
        },
      });
      driverRef.current = tour;
      tour.drive();
    }, 250);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
      tourStartedRef.current = false;
    };
  }, [isOpen, stage]);

  if (!isOpen) return null;

  const toggle = (values: string[], value: string, setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const profile: OnboardingProfileData = {
    trainingDays: days,
    sessionDurationMinutes: duration || 60,
    fitnessLevel: level,
    trainingLocation: location,
    goals,
    dateOfBirth: dateOfBirth || undefined,
    gender,
    heightCm: height ? Number(height) : undefined,
    weightKg: weight ? Number(weight) : undefined,
    bodyType,
    injuriesNotes: injuries || undefined,
  };

  const advanceSingleChoice = () => {
    if (!driverRef.current?.isActive()) return;

    window.setTimeout(() => {
      if (driverRef.current?.isActive()) {
        driverRef.current.moveNext();
      }
    }, 0);
  };

  const save = async (status: 'completed' | 'deferred') => {
    setError(null);
    setStage('saving');
    try {
      await saveOnboardingProfile(userId, profile, status);
      onComplete();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save onboarding.');
      setStage(status === 'deferred' ? 'confirmSkip' : 'form');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#2b2b2b] bg-[#111] shadow-2xl">
        {stage === 'welcome' && (
          <div className="overflow-y-auto p-6 sm:p-9">
            <div className="flex items-center gap-2 text-[#C0FF00]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">First-time setup</span>
            </div>
            <h1 id="onboarding-title" className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Welcome to Kinisia
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
              Tell us how you train so the app can organize your experience around your real schedule. You can complete optional details later.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['Choose', 'your goals and availability'],
                ['Track', 'sessions without friction'],
                ['Improve', 'your plan over time'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-[#292929] bg-[#181818] p-4">
                  <p className="font-display text-lg font-black uppercase text-[#C0FF00]">{title}</p>
                  <p className="mt-1 text-xs text-gray-400">{text}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setStage('form')} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C0FF00] px-5 py-3 font-display text-sm font-black uppercase tracking-wider text-black">
              Choose your preferences <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {stage === 'form' && (
          <div className="overflow-y-auto p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C0FF00]">Your onboarding profile</span>
                <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">Choose your starting point</h2>
                <p className="mt-2 text-xs text-gray-400">Required choices are marked by the guided steps. Optional details can be completed later.</p>
              </div>
              <button type="button" aria-label="Open skip onboarding confirmation" onClick={() => { driverRef.current?.destroy(); setStage('confirmSkip'); }} className="shrink-0 rounded-xl border border-[#333] px-3 py-2 text-[10px] font-bold uppercase text-gray-400 hover:text-white">
                Skip onboarding
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <fieldset data-onboarding="goals">
                <legend className="text-[10px] font-bold uppercase text-gray-400">Goals · choose at least one</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ONBOARDING_GOALS.map((goal) => {
                    const selected = goals.includes(goal);
                    return <button key={goal} type="button" aria-pressed={selected} onClick={() => toggle(goals, goal, setGoals)} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-xs font-bold ${selected ? 'border-[#C0FF00] bg-[#C0FF00]/15 text-white' : 'border-[#333] bg-[#181818] text-gray-400'}`}>{goal}{selected && <Check className="h-4 w-4 text-[#C0FF00]" aria-hidden="true" />}</button>;
                  })}
                </div>
              </fieldset>

              <fieldset data-onboarding="days">
                <legend className="text-[10px] font-bold uppercase text-gray-400">Available training days · choose all that apply</legend>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {DAYS.map(([value, label]) => {
                    const selected = days.includes(value);
                    return <button key={value} type="button" aria-pressed={selected} onClick={() => toggle(days, value, setDays)} className={`rounded-xl border px-2 py-3 text-[10px] font-bold uppercase ${selected ? 'border-[#C0FF00] bg-[#C0FF00] text-black' : 'border-[#333] bg-[#181818] text-gray-400'}`}>{label}</button>;
                  })}
                </div>
              </fieldset>

              <fieldset data-onboarding="duration">
                <legend className="text-[10px] font-bold uppercase text-gray-400">Gym time per session</legend>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {DURATIONS.map((value) => <button key={value} type="button" aria-pressed={duration === value} onClick={() => { setDuration(value); advanceSingleChoice(); }} className={`rounded-xl border px-2 py-3 text-xs font-bold ${duration === value ? 'border-[#C0FF00] bg-[#C0FF00] text-black' : 'border-[#333] bg-[#181818] text-gray-400'}`}>{value} min</button>)}
                </div>
              </fieldset>

              <fieldset data-onboarding="experience">
                <legend className="text-[10px] font-bold uppercase text-gray-400">Experience level</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LEVELS.map((option) => <button key={option.value} type="button" aria-pressed={level === option.value} onClick={() => { setLevel(option.value); advanceSingleChoice(); }} className={`rounded-xl border px-3 py-3 text-left text-[10px] font-bold uppercase ${level === option.value ? 'border-[#C0FF00] bg-[#C0FF00] text-black' : 'border-[#333] bg-[#181818] text-gray-400'}`}>{option.label}</button>)}
                </div>
              </fieldset>

              <fieldset data-onboarding="location">
                <legend className="text-[10px] font-bold uppercase text-gray-400">Training location</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['gym', 'home', 'hybrid'] as const).map((value) => <button key={value} type="button" aria-pressed={location === value} onClick={() => { setLocation(value); advanceSingleChoice(); }} className={`rounded-xl border px-3 py-3 text-xs font-bold uppercase ${location === value ? 'border-[#C0FF00] bg-[#C0FF00] text-black' : 'border-[#333] bg-[#181818] text-gray-400'}`}>{value}</button>)}
                </div>
              </fieldset>

              <fieldset data-onboarding="optional" className="rounded-2xl border border-[#292929] bg-[#181818] p-4">
                <legend className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400"><CircleHelp className="h-3 w-3 text-[#C0FF00]" aria-hidden="true" /> Optional profile details</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Date of birth<input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="mt-2 w-full rounded-xl border border-[#333] bg-[#111] px-3 py-2 text-xs text-white [color-scheme:dark]" /></label>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Gender<select value={gender} onChange={(event) => setGender(event.target.value as UserProfile['gender'])} className="mt-2 w-full rounded-xl border border-[#333] bg-[#111] px-3 py-2 text-xs text-white"><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Height (cm)<input type="number" min="100" max="250" value={height} onChange={(event) => setHeight(event.target.value)} className="mt-2 w-full rounded-xl border border-[#333] bg-[#111] px-3 py-2 text-xs text-white" /></label>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Weight (kg)<input type="number" min="30" max="300" value={weight} onChange={(event) => setWeight(event.target.value)} className="mt-2 w-full rounded-xl border border-[#333] bg-[#111] px-3 py-2 text-xs text-white" /></label>
                  <label className="text-[10px] font-bold uppercase text-gray-400 sm:col-span-2">Body type<select value={bodyType} onChange={(event) => setBodyType(event.target.value as Somatotype)} className="mt-2 w-full rounded-xl border border-[#333] bg-[#111] px-3 py-2 text-xs text-white"><option value="not_specified">Not specified</option><option value="ectomorph">Ectomorph</option><option value="mesomorph">Mesomorph</option><option value="endomorph">Endomorph</option></select></label>
                  <label className="text-[10px] font-bold uppercase text-gray-400 sm:col-span-2">Injuries or exercises to avoid<textarea value={injuries} onChange={(event) => setInjuries(event.target.value)} rows={2} className="mt-2 w-full resize-y rounded-xl border border-[#333] bg-[#111] px-3 py-2 text-xs text-white" /></label>
                </div>
              </fieldset>
            </div>

            <p className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-gray-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C0FF00]" aria-hidden="true" /> Your information is stored securely in your account and used to personalize Kinisia. You can update or remove it anytime in Profile settings.</p>
            {error && <p role="alert" className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
            <button type="button" disabled={!isComplete} onClick={() => save('completed')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C0FF00] px-5 py-3 font-display text-sm font-black uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-40">
              Save onboarding <Check className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {stage === 'saving' && (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-[#C0FF00]" aria-label="Saving onboarding" />
            <p className="mt-4 font-display text-xl font-black uppercase text-white">Saving your preferences</p>
          </div>
        )}

        {stage === 'confirmSkip' && (
          <div className="p-6 sm:p-9">
            <button type="button" aria-label="Return to onboarding" onClick={() => setStage('form')} className="absolute right-5 top-5 rounded-lg p-2 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            <h2 className="font-display text-2xl font-black uppercase text-white">Skip onboarding?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">Are you sure you want to skip onboarding? You can complete it later from Profile settings.</p>
            {error && <p role="alert" className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setStage('form')} className="rounded-xl border border-[#333] px-4 py-3 text-xs font-bold uppercase text-gray-300">No, continue</button>
              <button type="button" onClick={() => save('deferred')} className="rounded-xl bg-[#C0FF00] px-4 py-3 text-xs font-black uppercase text-black">Yes, skip onboarding</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
