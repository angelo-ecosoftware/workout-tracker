import { describe, it, expect } from 'vitest';
import { ExerciseSearchEngine } from '../src/lib/exerciseSearch.ts';

describe('ExerciseSearchEngine (wger dataset + Fuse.js fuzzy search)', () => {
  it('should find "Bench Press" when user types typo "brenk pres"', () => {
    const results = ExerciseSearchEngine.search({ query: 'brenk pres' });
    expect(results.length).toBeGreaterThan(0);
    const topResult = results[0];
    expect(topResult.name).toContain('Bench Press');
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
