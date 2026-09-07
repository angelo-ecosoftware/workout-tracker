import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseGuideDrawer } from '../../../../src/components/workout/ExerciseGuideDrawer.tsx';
import {
  MuscleAnatomyHeatmap,
  normalizeMuscleToGroup,
} from '../../../../src/components/workout/anatomy/MuscleAnatomyHeatmap.tsx';

describe('P2.1, P2.2 & P2.4: Exercise Guide Drawer & Muscle Anatomy Heatmap', () => {
  describe('normalizeMuscleToGroup helper', () => {
    it('normalizes standard anatomical muscle names into canonical groups', () => {
      expect(normalizeMuscleToGroup('Pectoralis major')).toBe('chest');
      expect(normalizeMuscleToGroup('Anterior deltoid')).toBe('shoulders');
      expect(normalizeMuscleToGroup('Latissimus dorsi')).toBe('lats');
      expect(normalizeMuscleToGroup('Biceps brachii')).toBe('biceps');
      expect(normalizeMuscleToGroup('Triceps brachii')).toBe('triceps');
      expect(normalizeMuscleToGroup('Quadriceps')).toBe('quads');
      expect(normalizeMuscleToGroup('Hamstrings')).toBe('hamstrings');
      expect(normalizeMuscleToGroup('Gluteus maximus')).toBe('glutes');
      expect(normalizeMuscleToGroup('Gastrocnemius')).toBe('calves');
      expect(normalizeMuscleToGroup('Rectus abdominis')).toBe('abs');
      expect(normalizeMuscleToGroup('Trapezius')).toBe('traps');
      expect(normalizeMuscleToGroup('Erector spinae')).toBe('lower_back');
    });

    it('returns null for unmapped terms', () => {
      expect(normalizeMuscleToGroup('unknown_fiber_xyz')).toBeNull();
    });
  });

  describe('MuscleAnatomyHeatmap component', () => {
    it('renders anterior and posterior SVG body views with target labels', () => {
      render(
        <MuscleAnatomyHeatmap
          primaryMuscles={['Pectoralis major', 'Anterior deltoid']}
          secondaryMuscles={['Triceps brachii']}
        />
      );

      expect(screen.getByRole('figure', { name: /target muscle anatomy heatmap/i })).toBeInTheDocument();
      expect(screen.getByText(/anterior \(front\)/i)).toBeInTheDocument();
      expect(screen.getByText(/posterior \(back\)/i)).toBeInTheDocument();
      expect(screen.getByText(/primary target/i)).toBeInTheDocument();
      expect(screen.getByText(/secondary \/ synergist/i)).toBeInTheDocument();
    });
  });

  describe('ExerciseGuideDrawer component', () => {
    it('renders exercise details, biomechanical cues, and 1080p tutorial link', () => {
      const handleClose = vi.fn();
      render(
        <ExerciseGuideDrawer
          isOpen={true}
          exerciseName="Bench Press (Barbell)"
          onClose={handleClose}
        />
      );

      // Header info
      expect(screen.getByRole('heading', { name: /bench press \(barbell\)/i })).toBeInTheDocument();
      expect(screen.getByText(/chest/i)).toBeInTheDocument();
      expect(screen.getByText(/• barbell/i)).toBeInTheDocument();

      // Biomechanical Form Cues
      expect(screen.getByText(/biomechanical form cues/i)).toBeInTheDocument();
      expect(screen.getByText(/controlled eccentric:/i)).toBeInTheDocument();
      expect(screen.getByText(/explosive concentric:/i)).toBeInTheDocument();

      // Video Tutorial Link
      expect(screen.getByText(/video form tutorial \(1080p\)/i)).toBeInTheDocument();
      const watchLink = screen.getByRole('link', { name: /watch/i });
      expect(watchLink).toBeInTheDocument();
      expect(watchLink).toHaveAttribute('href', expect.stringContaining('youtube.com'));

      // Close button
      const closeBtn = screen.getByRole('button', { name: /close guide/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('returns null when isOpen is false', () => {
      const { container } = render(
        <ExerciseGuideDrawer
          isOpen={false}
          exerciseName="Bench Press (Barbell)"
          onClose={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
