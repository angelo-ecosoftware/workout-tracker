import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPortalView } from '../../../../src/components/admin/AdminPortalView.tsx';
import * as AdminDb from '../../../../src/lib/db/admin.ts';

vi.mock('../../../../src/lib/db/admin.ts', () => ({
  fetchAllUsersForAdmin: vi.fn(),
  updateUserRoleByAdmin: vi.fn(),
  fetchMissingProductReportsForAdmin: vi.fn(),
  updateMissingProductReportStatus: vi.fn(),
}));

describe('AdminPortalView (Command Center)', () => {
  const mockUsers: AdminDb.AdminUserListItem[] = [
    {
      userId: 'usr_athlete_1',
      name: 'John Athlete',
      email: 'john@athlete.com',
      role: 'athlete',
      specialty: null,
      isApproved: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      userId: 'usr_coach_pending',
      name: 'Coach Pending',
      email: 'coach@pending.com',
      role: 'coach',
      specialty: 'strength',
      isApproved: false,
      createdAt: '2026-09-02T00:00:00.000Z',
    },
    {
      userId: 'usr_admin_1',
      name: 'Platform Administrator',
      email: 'tuO45744@gmail.com',
      role: 'admin',
      specialty: null,
      isApproved: true,
      createdAt: '2026-09-03T00:00:00.000Z',
    },
  ];

  const mockReports: AdminDb.AdminMissingProductReport[] = [
    {
      id: 'rep_1',
      name: 'Skyr High Protein',
      barcode: '8710400123456',
      notes: 'Not found in AH search',
      userId: 'usr_athlete_1',
      status: 'pending',
      createdAt: '2026-09-04T12:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AdminDb.fetchAllUsersForAdmin).mockResolvedValue(mockUsers);
    vi.mocked(AdminDb.fetchMissingProductReportsForAdmin).mockResolvedValue(mockReports);
    vi.mocked(AdminDb.updateUserRoleByAdmin).mockResolvedValue({ success: true });
    vi.mocked(AdminDb.updateMissingProductReportStatus).mockResolvedValue({ success: true });
  });

  it('renders admin command center header and user directory', async () => {
    render(<AdminPortalView />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Admin Command Center/i })).toBeInTheDocument();
      expect(screen.getByText(/SUPERUSER/i)).toBeInTheDocument();
    });

    expect(screen.getByText('John Athlete')).toBeInTheDocument();
    expect(screen.getByText('Coach Pending')).toBeInTheDocument();
    expect(screen.getByText('Platform Administrator')).toBeInTheDocument();
  });

  it('filters users by search query and role', async () => {
    const user = userEvent.setup();
    render(<AdminPortalView />);

    await waitFor(() => {
      expect(screen.getByText('John Athlete')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search user by name/i);
    await user.type(searchInput, 'Platform');

    expect(screen.getByText('Platform Administrator')).toBeInTheDocument();
    expect(screen.queryByText('John Athlete')).not.toBeInTheDocument();
  });

  it('allows approving pending coach applications directly', async () => {
    const user = userEvent.setup();
    render(<AdminPortalView />);

    await waitFor(() => {
      expect(screen.getByText('Coach Pending')).toBeInTheDocument();
    });

    // Switch to Coach Verification Queue Tab
    const coachTabBtn = screen.getByRole('button', { name: /Coach Verification Queue/i });
    await user.click(coachTabBtn);

    expect(screen.getByText(/Pending Coach Applications/i)).toBeInTheDocument();
    const approveBtn = screen.getByRole('button', { name: /Approve Coach/i });
    await user.click(approveBtn);

    expect(AdminDb.updateUserRoleByAdmin).toHaveBeenCalledWith(
      'usr_coach_pending',
      'coach',
      'strength',
      true
    );
  });

  it('displays RBAC page permission matrix tab', async () => {
    const user = userEvent.setup();
    render(<AdminPortalView />);

    await waitFor(() => {
      expect(screen.getByText(/User & Role Directory/i)).toBeInTheDocument();
    });

    const permTabBtn = screen.getByRole('button', { name: /Page & Permission Matrix/i });
    await user.click(permTabBtn);

    expect(screen.getByText(/Role-Based Access Control \(RBAC\) Page Matrix/i)).toBeInTheDocument();
    expect(screen.getByText('Daily Workout Tracker')).toBeInTheDocument();
    expect(screen.getByText('Admin Command Center')).toBeInTheDocument();
  });

  it('allows triaging missing product reports', async () => {
    const user = userEvent.setup();
    render(<AdminPortalView />);

    await waitFor(() => {
      expect(screen.getByText(/User & Role Directory/i)).toBeInTheDocument();
    });

    const reportsTabBtn = screen.getByRole('button', { name: /Missing Products Queue/i });
    await user.click(reportsTabBtn);

    expect(screen.getByText('Skyr High Protein')).toBeInTheDocument();
    const resolveBtn = screen.getByRole('button', { name: /Mark Resolved/i });
    await user.click(resolveBtn);

    expect(AdminDb.updateMissingProductReportStatus).toHaveBeenCalledWith('rep_1', 'resolved');
  });
});
