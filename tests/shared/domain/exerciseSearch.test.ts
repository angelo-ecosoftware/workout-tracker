import { describe, it, expect } from 'vitest';
import {
  ExerciseSearchEngine,
  formatSingleExerciseName,
  isCompoundExerciseName,
} from '../../../src/lib/exerciseSearch.ts';

describe('ExerciseSearchEngine (wger dataset + Fuse.js fuzzy search)', () => {
  it('should find "Bench Press" when user types typo "brenk pres"', () => {
    const results = ExerciseSearchEngine.search({ query: 'brenk pres' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.name.toLowerCase().includes('bench press'))).toBe(true);
  });

  it('should find "Bench Press" when user types typo "bnch prss"', () => {
    const results = ExerciseSearchEngine.search({ query: 'bnch prss' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.name.toLowerCase().includes('bench press'))).toBe(true);
  });

  it('should match exercises by muscle group name like "latissimus" or "lats"', () => {
    const results = ExerciseSearchEngine.search({ query: 'latissimus' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.name === 'Pull-ups' || r.name === 'Lat Pulldown' || r.name.includes('Row'))).toBe(true);
  });

  it('should match exercises by muscle group "triceps"', () => {
    const results = ExerciseSearchEngine.search({ query: 'triceps' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.category === 'Arms' || r.category === 'Chest')).toBe(true);
  });

  it('should match exercises by muscle group "quadriceps" or "quads"', () => {
    const results = ExerciseSearchEngine.search({ query: 'quads' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.name.includes('Squat') || r.name === 'Leg Press')).toBe(true);
  });

  it('should filter exercises correctly by category when selected', () => {
    const chestResults = ExerciseSearchEngine.search({ query: '', category: 'Chest' });
    expect(chestResults.length).toBeGreaterThan(0);
    expect(chestResults.every(r => r.category === 'Chest')).toBe(true);

    const legsResults = ExerciseSearchEngine.search({ query: 'squat', category: 'Legs' });
    expect(legsResults.length).toBeGreaterThan(0);
    expect(legsResults.every(r => r.category === 'Legs')).toBe(true);
  });

  it('should return available categories including "All"', () => {
    const categories = ExerciseSearchEngine.getCategories();
    expect(categories).toContain('All');
    expect(categories).toContain('Chest');
    expect(categories).toContain('Back');
    expect(categories).toContain('Legs');
    expect(categories).toContain('Shoulders');
  });
});

describe('formatSingleExerciseName - 1 Exercise is 1 Exercise Taxonomy', () => {
  it('converts legacy compound names with "or" or "/" into canonical single exercises', () => {
    expect(formatSingleExerciseName('Bench Press (barbell or dumbbell)')).toBe('Barbell Bench Press');
    expect(formatSingleExerciseName('Pull-ups / Lat Pulldown')).toBe('Pull-ups');
    expect(formatSingleExerciseName('Seated Cable Row / Dumbbell Row')).toBe('Seated Cable Row');
    expect(formatSingleExerciseName('Triceps Pushdown or Dips')).toBe('Triceps Pushdown');
    expect(formatSingleExerciseName('Back Squat or Goblet Squat')).toBe('Barbell Back Squat');
    expect(formatSingleExerciseName('Leg Curl (machine or Nordic)')).toBe('Lying Leg Curl');
    expect(formatSingleExerciseName('Chest-Supported Row or Rear-Delt Fly')).toBe('Chest-Supported Row');
    expect(formatSingleExerciseName('Deadlift or Romanian Deadlift')).toBe('Barbell Deadlift');
    expect(formatSingleExerciseName('Front Squat or Leg Press')).toBe('Front Squat');
  });

  it('strips generic multi-exercise "or" or "/" phrasing from custom inputs', () => {
    expect(formatSingleExerciseName('Custom Movement A or Movement B')).toBe('Custom Movement A');
    expect(formatSingleExerciseName('Pushups / Bench Press')).toBe('Pushups');
    expect(formatSingleExerciseName('Bicep Curls (dumbbell or cable)')).toBe('Bicep Curls');
  });

  it('leaves already single exercises untouched', () => {
    expect(formatSingleExerciseName('Barbell Bench Press')).toBe('Barbell Bench Press');
    expect(formatSingleExerciseName('Incline Dumbbell Press')).toBe('Incline Dumbbell Press');
    expect(formatSingleExerciseName('Pull-ups')).toBe('Pull-ups');
    expect(formatSingleExerciseName('Push-ups')).toBe('Push-ups');
  });

  it('detects compound exercise names accurately', () => {
    expect(isCompoundExerciseName('Bench Press (barbell or dumbbell)')).toBe(true);
    expect(isCompoundExerciseName('Pull-ups / Lat Pulldown')).toBe(true);
    expect(isCompoundExerciseName('Squat or Lunge')).toBe(true);
    expect(isCompoundExerciseName('Barbell Bench Press')).toBe(false);
    expect(isCompoundExerciseName('Push-ups')).toBe(false);
  });
});
