<script lang="ts">
  import { Button, InlineNotification, PasswordInput } from 'carbon-components-svelte';

  const minLength = 4;

  let currentPasscode = '';
  let newPasscode = '';
  let confirmPasscode = '';
  let errorMessage = '';
  let successMessage = '';
  let saving = false;

  let csvErrorMessage = '';
  let csvSuccessMessage = '';
  let exporting = false;
  let importing = false;

  function resetForm() {
    currentPasscode = '';
    newPasscode = '';
    confirmPasscode = '';
  }

  async function exportCsv() {
    csvErrorMessage = '';
    csvSuccessMessage = '';
    exporting = true;
    try {
      const result = await window.api.passwords.exportCsv();
      if (!result.canceled) {
        csvSuccessMessage = `Exported ${result.count ?? 0} password${result.count === 1 ? '' : 's'} to ${result.filePath}.`;
      }
    } catch (error) {
      csvErrorMessage = error instanceof Error ? error.message : 'Unable to export passwords.';
    } finally {
      exporting = false;
    }
  }

  async function importCsv() {
    csvErrorMessage = '';
    csvSuccessMessage = '';
    importing = true;
    try {
      const result = await window.api.passwords.importCsv();
      if (!result.canceled) {
        csvSuccessMessage = `Imported ${result.imported ?? 0} of ${result.total ?? 0} row${result.total === 1 ? '' : 's'} from the CSV file.`;
      }
    } catch (error) {
      csvErrorMessage = error instanceof Error ? error.message : 'Unable to import passwords.';
    } finally {
      importing = false;
    }
  }

  async function changePasscode() {
    errorMessage = '';
    successMessage = '';

    if (newPasscode.length < minLength) {
      errorMessage = `New passcode must be at least ${minLength} characters.`;
      return;
    }
    if (newPasscode !== confirmPasscode) {
      errorMessage = 'New passcodes do not match.';
      return;
    }
    if (newPasscode === currentPasscode) {
      errorMessage = 'New passcode must be different from the current one.';
      return;
    }

    saving = true;
    try {
      await window.api.auth.changePasscode(currentPasscode, newPasscode);
      resetForm();
      successMessage = 'Passcode updated.';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to update passcode.';
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings-page">
  <div class="page-heading">
    <h1 class="eyebrow">Settings</h1>
    <p class="page-description">Manage how your vault is protected.</p>
  </div>

  <section class="settings-card">
    <h2>Reset passcode</h2>
    <p class="section-hint">
      Your passcode unlocks the vault and reveals saved secrets. It cannot be recovered if lost.
    </p>

    {#if errorMessage}
      <InlineNotification
        kind="error"
        lowContrast
        hideCloseButton
        title="Error"
        subtitle={errorMessage}
      />
    {/if}
    {#if successMessage}
      <InlineNotification
        kind="success"
        lowContrast
        hideCloseButton
        title="Success"
        subtitle={successMessage}
      />
    {/if}

    <form class="settings-form" on:submit|preventDefault={changePasscode}>
      <PasswordInput
        labelText="Current passcode"
        autocomplete="off"
        bind:value={currentPasscode}
      />
      <PasswordInput
        labelText="New passcode"
        helperText={`At least ${minLength} characters.`}
        autocomplete="off"
        bind:value={newPasscode}
      />
      <PasswordInput
        labelText="Confirm new passcode"
        autocomplete="off"
        bind:value={confirmPasscode}
      />

      <div class="form-actions">
        <Button kind="secondary" type="button" disabled={saving} onclick={resetForm}>Clear</Button>
        <Button type="submit" disabled={saving || !currentPasscode}>Update passcode</Button>
      </div>
    </form>
  </section>

  <section class="settings-card">
    <h2>Import / export passwords</h2>
    <p class="section-hint">
      Import passwords from a CSV file (columns: website, username, secret) or export your vault
      to a CSV file for backup.
    </p>
    <p class="section-hint section-warning">
      Importing a CSV file replaces all passwords currently in your vault. You'll be asked to
      confirm before anything is removed.
    </p>

    {#if csvErrorMessage}
      <InlineNotification
        kind="error"
        lowContrast
        hideCloseButton
        title="Error"
        subtitle={csvErrorMessage}
      />
    {/if}
    {#if csvSuccessMessage}
      <InlineNotification
        kind="success"
        lowContrast
        hideCloseButton
        title="Success"
        subtitle={csvSuccessMessage}
      />
    {/if}

    <div class="form-actions csv-actions">
      <Button kind="secondary" disabled={importing} onclick={importCsv}>
        {importing ? 'Importing…' : 'Import from CSV'}
      </Button>
      <Button kind="secondary" disabled={exporting} onclick={exportCsv}>
        {exporting ? 'Exporting…' : 'Export to CSV'}
      </Button>
    </div>
  </section>
</div>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-heading .eyebrow {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 400;
    color: var(--page-text);
  }

  .page-description {
    margin: 0.25rem 0 0;
    color: var(--page-muted);
  }

  .settings-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 32rem;
    padding: 1.5rem;
    border: 1px solid var(--page-border);
  }

  .settings-card h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 400;
    color: var(--page-text);
  }

  .section-hint {
    margin: 0;
    font-size: 0.875rem;
    color: var(--page-muted);
  }

  .section-warning {
    color: var(--support-warning, #f1c21b);
  }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
