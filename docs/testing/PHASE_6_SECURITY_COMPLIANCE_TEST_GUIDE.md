# 🧪 Phase 6 Test Guide: Enterprise Security, ENISA & EU Compliance Dossier

This document outlines the user acceptance test cases for **Phase 6** features:
1. **P6.1: GDPR Article 17 ("Right to be Forgotten") 1-Tap Permanent Cascade Purge**
2. **P6.2: EU Cybersecurity (NIS2, CRA, DORA, ENISA) Audit Dossier Generator**
3. **P6.3: Zero-Knowledge Biometric Vault & MFA Readiness**

---

## 🛡️ Test Suite 1: EU Compliance & Security Dossier

### Test 1.1: Direct Access from Settings Hub
1. **Action:** Tap the **Gear icon (⚙️)** in the top right to open **Settings**.
2. **Action:** Scroll down and locate the button **"EU Compliance & Security Dossier"** (with shield badge and `[ Dossier ]` pill).
3. **Action:** Tap **"EU Compliance & Security Dossier"**.
4. **Expected Result:**
   * The **EU Compliance & Security Dossier** modal opens smoothly.
   * Header displays: `EU COMPLIANCE & SECURITY DOSSIER • GDPR • EU CRA (Reg 2024/2847) • NIS2 • ENISA Standards`.
   * **Executive Overview tab** is active by default with audited baseline info, conformant status indicators, and the GDPR Article 9 special-category biometrics map.

---

### Test 1.2: Exploring Dossier Tabs (SBOM, RLS, Cryptographic Proof)
1. **Action:** Tap the tab **"SBOM (CRA Art. 13)"**.
   * **Expected Result:** Shows a table of components, licenses, versions, and a green badge confirming `0 Known Vulnerabilities`.
2. **Action:** Tap the tab **"RLS Matrix (12 Tables)"**.
   * **Expected Result:** Displays all 12 production PostgreSQL tables (`body_logs`, `sessions`, `sets`, `exercises`, etc.) with `FORCE RLS` tags and access scopes.
3. **Action:** Tap the tab **"Cryptographic Proof"**.
   * **Expected Result:** Displays **TLS 1.3** transport security, forward secrecy ciphers (`TLS_AES_256_GCM_SHA384`, etc.), HSTS, and Content Security Policy headers.

---

### Test 1.3: Downloading Dossier Files
1. **Action:** In the top right of the modal, tap **`[ Download ]`**.
   * **Expected Result:** A file named `EU_COMPLIANCE_DOSSIER_YYYY-MM-DD.md` downloads to your device in formatted markdown.
2. **Action:** In the bottom left, tap **`[ Export JSON ]`**.
   * **Expected Result:** A machine-readable `EU_COMPLIANCE_DOSSIER_YYYY-MM-DD.json` file downloads containing the raw data schema.

---

## 🔒 Test Suite 2: GDPR Article 17 ("Right to be Forgotten") Safety Guardrails

### Test 2.1: Navigation via Privacy & Visibility Modal
1. **Action:** Open **Settings (⚙️)** $\rightarrow$ Tap **"Privacy & Visibility"**.
2. **Action:** Scroll to the bottom of the modal to find:
   * **Section 4:** *EU Security & Compliance Dossier* (with `[ View Dossier ]`).
   * **Section 5:** Red-accented *GDPR Article 17: Right to be Forgotten (Account Purge)* card.
3. **Action:** Tap the red button **`[ Erase My Account & Data ]`**.
4. **Expected Result:**
   * The **Right to be Forgotten** confirmation modal opens with a red warning border.

---

### Test 2.2: Safety Countdown Timer Lock
1. **Action:** Observe the button **`[ Erase All Data ]`** immediately upon opening.
2. **Expected Result:**
   * The button is **disabled** and grayed out.
   * An active countdown displays: `Safety lock active: wait 5s...` counting down `5s → 4s → 3s → 2s → 1s → 0s`.

---

### Test 2.3: Text Confirmation Phrase Verification
1. **Action:** Once the 5-second countdown reaches 0, observe the button state.
2. **Expected Result:**
   * The button remains **disabled** until the exact confirmation phrase is entered.
3. **Action:** Type random letters (e.g. `delete` or `no`).
   * **Expected Result:** The button stays disabled.
4. **Action:** Type the exact phrase: **`PERMANENTLY DELETE`**.
5. **Expected Result:**
   * The button lights up bright red and becomes clickable.

---

### Test 2.4: Safe Dismissal / Cancellation
1. **Action:** Tap **`[ Cancel ]`** or the top **`(X)`** close icon.
2. **Expected Result:**
   * The modal closes safely without triggering any deletion or data loss.

---

## 💥 Test Suite 3: End-to-End Account Purge (Atomic Relational & S3 Cascade)
> ⚠️ **Warning:** Only run this test on a test/dummy user account, as this permanently deletes all database records and S3 media.

1. **Action:** Sign into a test account.
2. **Action:** Open **Settings** $\rightarrow$ **Privacy & Visibility** $\rightarrow$ **`[ Erase My Account & Data ]`**.
3. **Action:** Wait for the 5-second safety timer, type `PERMANENTLY DELETE`, and tap **`[ Erase All Data ]`**.
4. **Expected Result:**
   * The button shows a spinner with `Erasing Data...`.
   * The database executes `public.purge_user_account_gdpr(target_user_id)` without column errors.
   * Media objects in `workout-media` bucket belonging to the user are purged.
   * Local storage and IndexedDB draft photos are wiped.
   * A checkmark screen displays: `Account Permanently Erased: All personal records, workout logs, biometrics, and photos have been purged.`
   * Automatically invalidates session and redirects to the landing page.
