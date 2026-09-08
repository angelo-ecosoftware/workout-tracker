import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComplianceDossierModal } from '../../../../src/components/settings/ComplianceDossierModal.tsx';
import * as DossierGenerator from '../../../../src/lib/complianceDossierGenerator.ts';

describe('ComplianceDossierModal Component', () => {
  it('renders modal with title and executive overview tab active by default', () => {
    render(<ComplianceDossierModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/eu compliance & security dossier/i)).toBeInTheDocument();
    expect(screen.getByText(/gdpr • eu cra \(reg 2024\/2847\) • nis2 • enisa standards/i)).toBeInTheDocument();
    expect(screen.getByText(/audited system baseline/i)).toBeInTheDocument();
    expect(screen.getByText(/conformant architecture/i)).toBeInTheDocument();
  });

  it('switches between tabs: SBOM, RLS Matrix, and Cryptographic Proof', () => {
    render(<ComplianceDossierModal isOpen={true} onClose={vi.fn()} />);

    // Switch to SBOM tab
    const sbomTab = screen.getByRole('button', { name: /sbom \(cra art\. 13\)/i });
    fireEvent.click(sbomTab);
    expect(screen.getByText(/0 known vulnerabilities/i)).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('vite')).toBeInTheDocument();

    // Switch to RLS Matrix tab
    const rlsTab = screen.getByRole('button', { name: /rls matrix/i });
    fireEvent.click(rlsTab);
    expect(screen.getByText('body_logs')).toBeInTheDocument();
    expect(screen.getByText('sessions')).toBeInTheDocument();
    expect(screen.getAllByText('FORCE RLS').length).toBeGreaterThan(0);

    // Switch to Cryptographic Proof tab
    const cryptoTab = screen.getByRole('button', { name: /cryptographic proof/i });
    fireEvent.click(cryptoTab);
    expect(screen.getByText('Transport Security')).toBeInTheDocument();
    expect(screen.getByText(/forward secrecy ciphers/i)).toBeInTheDocument();
  });

  it('triggers download when download button is clicked', () => {
    const downloadSpy = vi.spyOn(DossierGenerator, 'downloadComplianceDossier').mockImplementation(() => {});

    render(<ComplianceDossierModal isOpen={true} onClose={vi.fn()} />);

    const downloadBtn = screen.getByRole('button', { name: /download/i });
    fireEvent.click(downloadBtn);

    expect(downloadSpy).toHaveBeenCalledWith('markdown');
    downloadSpy.mockRestore();
  });

  it('triggers export json when export json button is clicked', () => {
    const downloadSpy = vi.spyOn(DossierGenerator, 'downloadComplianceDossier').mockImplementation(() => {});

    render(<ComplianceDossierModal isOpen={true} onClose={vi.fn()} />);

    const exportJsonBtn = screen.getByRole('button', { name: /export json/i });
    fireEvent.click(exportJsonBtn);

    expect(downloadSpy).toHaveBeenCalledWith('json');
    downloadSpy.mockRestore();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ComplianceDossierModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
