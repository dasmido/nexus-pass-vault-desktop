<script lang="ts">
  import { Button, InlineNotification, TextInput } from 'carbon-components-svelte';
  import Locked from 'carbon-icons-svelte/lib/Locked.svelte';

  export let mode: 'setup' | 'unlock' = 'unlock';
  export let onunlocked: () => void = () => {};

  const minLength = 4;

  let passcode = '';
  let confirmPasscode = '';
  let errorMessage = '';
  let busy = false;

  async function submit() {
    errorMessage = '';

    if (passcode.length < minLength) {
      errorMessage = `Passcode must be at least ${minLength} characters.`;
      return;
    }

    busy = true;
    try {
      if (mode === 'setup') {
        if (passcode !== confirmPasscode) {
          errorMessage = 'Passcodes do not match.';
          return;
        }
        await window.api.auth.setup(passcode);
      } else {
        const accepted = await window.api.auth.unlock(passcode);
        if (!accepted) {
          errorMessage = 'Incorrect passcode.';
          passcode = '';
          return;
        }
      }
      passcode = '';
      confirmPasscode = '';
      onunlocked();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to verify passcode.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="lock-screen">
  <form class="lock-card" on:submit|preventDefault={submit}>
    <div class="lock-icon"><Locked size={32} /></div>
    <h1>{mode === 'setup' ? 'Create your passcode' : 'Unlock your vault'}</h1>
    <p class="lock-hint">
      {mode === 'setup'
        ? 'This passcode protects every secret stored in Nexus Pass Vault. It cannot be recovered, so keep it safe.'
        : 'Enter your passcode to open Nexus Pass Vault.'}
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

    <TextInput
      labelText="Passcode"
      type="password"
      autocomplete="off"
      placeholder="Enter passcode"
      bind:value={passcode}
    />

    {#if mode === 'setup'}
      <TextInput
        labelText="Confirm passcode"
        type="password"
        autocomplete="off"
        placeholder="Re-enter passcode"
        bind:value={confirmPasscode}
      />
    {/if}

    <Button type="submit" disabled={busy}>
      {mode === 'setup' ? 'Set passcode' : 'Unlock'}
    </Button>
  </form>
</div>

<style>
  .lock-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
  }

  .lock-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 24rem;
    padding: 2rem;
    border: 1px solid var(--page-border);
    background: var(--page-background);
  }

  .lock-icon {
    color: var(--page-text);
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 400;
    color: var(--page-text);
  }

  .lock-hint {
    margin: 0;
    font-size: 0.875rem;
    color: var(--page-muted);
  }
</style>
