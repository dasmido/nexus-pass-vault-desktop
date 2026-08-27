<script lang="ts">
  import { Button, InlineNotification, PasswordInput } from 'carbon-components-svelte';

  const minLength = 4;

  let currentPasscode = '';
  let newPasscode = '';
  let confirmPasscode = '';
  let errorMessage = '';
  let successMessage = '';
  let saving = false;

  function resetForm() {
    currentPasscode = '';
    newPasscode = '';
    confirmPasscode = '';
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
