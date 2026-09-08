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

      // Video Tutorial Link (YouTube)
      expect(screen.getByText(/video form tutorial \(1080p\)/i)).toBeInTheDocument();
      const watchLink = screen.getByRole('link', { name: /watch/i });
      expect(watchLink).toBeInTheDocument();
      expect(watchLink).toHaveAttribute('href', expect.stringContaining('youtube.com'));

      // Social Video Link (TikTok Form Cues)
      expect(screen.getByText(/tiktok form cues/i)).toBeInTheDocument();
      const cuesLink = screen.getByRole('link', { name: /cues/i });
      expect(cuesLink).toBeInTheDocument();
      expect(cuesLink).toHaveAttribute('href', expect.stringContaining('tiktok.com'));

      // Dual-phase motion toggle
      expect(screen.getByText(/motion & form phases/i)).toBeInTheDocument();
      const peakBtn = screen.getByRole('button', { name: /2\. peak squeeze/i });
      fireEvent.click(peakBtn);
      expect(screen.getByText(/concentric lockout & peak contraction/i)).toBeInTheDocument();

      // Step-by-step instructions
      expect(screen.getByText(/step-by-step instructions/i)).toBeInTheDocument();

      // Close button
      const closeBtn = screen.getByRole('button', { name: /close guide/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('accurately resolves Bench Press (barbell or dumbbell) with Chest as Primary and Triceps/Shoulders as Secondary', async () => {
      render(
        <ExerciseGuideDrawer
          isOpen={true}
          exerciseName="Bench Press (barbell or dumbbell)"
          onClose={vi.fn()}
        />
      );

      // Must normalize compound name to single exercise Barbell Bench Press and display chest category
      expect(screen.getByRole('heading', { name: /barbell bench press/i })).toBeInTheDocument();
      expect(screen.getByText(/chest/i)).toBeInTheDocument();

      // Check that Chest is marked as Primary (fill #C0FF00) and Triceps/Shoulders as Secondary (fill #EF4444)
      const figure = screen.getByRole('figure', { name: /target muscle anatomy heatmap/i });
      expect(figure).toBeInTheDocument();

      // Check SVG paths: chest path must have highlightColor (#C0FF00)
      const svgPaths = figure.querySelectorAll('path');
      const limePaths = Array.from(svgPaths).filter((p) => p.getAttribute('fill') === '#C0FF00');
      const redPaths = Array.from(svgPaths).filter((p) => p.getAttribute('fill') === '#EF4444');

      // Both primary (chest) and secondary (triceps/shoulders) must be properly colored
      expect(limePaths.length).toBeGreaterThan(0);
      expect(redPaths.length).toBeGreaterThan(0);
    });

    it('renders animated demo GIF container for verified movements', async () => {
      render(
        <ExerciseGuideDrawer
          isOpen={true}
          exerciseName="Barbell Bench Press"
          onClose={vi.fn()}
        />
      );

      expect(await screen.findByAltText(/animated demonstration/i)).toBeInTheDocument();
      expect(screen.getByText(/animated demo/i)).toBeInTheDocument();
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
