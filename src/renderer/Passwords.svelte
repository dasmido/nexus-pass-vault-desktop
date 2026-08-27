<script lang="ts">
  import {
    Button,
    DataTable
  } from 'carbon-components-svelte';
  import type { DataTableHeader } from 'carbon-components-svelte/src/DataTable/DataTable.svelte';
  import Filter from 'carbon-icons-svelte/lib/Filter.svelte';
  import Download from 'carbon-icons-svelte/lib/Download.svelte';
  import DocumentPdf from 'carbon-icons-svelte/lib/DocumentPdf.svelte';
  import Add from 'carbon-icons-svelte/lib/Add.svelte';
  import Launch from 'carbon-icons-svelte/lib/Launch.svelte';
  import Copy from 'carbon-icons-svelte/lib/Copy.svelte';
  import Edit from 'carbon-icons-svelte/lib/Edit.svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import { onMount } from 'svelte';

  const headers: DataTableHeader<PasswordEntry>[] = [
    { key: 'website', value: 'Website' },
    { key: 'username', value: 'Username' },
    { key: 'secret', value: 'Secret' },
    { key: 'actions', empty: true }
  ];

  let rows: PasswordEntry[] = [];
  let loading = true;
  let errorMessage = '';
  let editorOpen = false;
  let editingId: string | null = null;
  let form: PasswordEntryInput = { website: '', username: '', secret: '' };

  async function loadEntries() {
    loading = true;
    try {
      rows = await window.api.passwords.list();
      errorMessage = '';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to load passwords.';
    } finally {
      loading = false;
    }
  }

  function openCreate() {
    editingId = null;
    form = { website: '', username: '', secret: '' };
    editorOpen = true;
  }

  function openEdit(entry: PasswordEntry) {
    editingId = entry.id;
    form = { website: entry.website, username: entry.username, secret: entry.secret };
    editorOpen = true;
  }

  function closeEditor() {
    editorOpen = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) closeEditor();
  }

  async function saveEntry() {
    const input = {
      website: form.website.trim(),
      username: form.username.trim(),
      secret: form.secret
    };
    if (!input.website || !input.username || !input.secret) {
      errorMessage = 'Website, username, and secret are required.';
      return;
    }

    try {
      if (editingId) {
        const updated = await window.api.passwords.update(editingId, input);
        rows = rows.map((entry) => (entry.id === updated.id ? updated : entry));
      } else {
        const created = await window.api.passwords.create(input);
        rows = [...rows, created].sort((a, b) => a.website.localeCompare(b.website));
      }
      errorMessage = '';
      closeEditor();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to save password.';
    }
  }

  async function removeEntry(entry: PasswordEntry) {
    if (!window.confirm(`Delete the password for ${entry.website}?`)) return;
    try {
      await window.api.passwords.delete(entry.id);
      rows = rows.filter((item) => item.id !== entry.id);
      errorMessage = '';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to delete password.';
    }
  }

  onMount(loadEntries);

  function favicon(website: string) {
    return `https://www.google.com/s2/favicons?sz=32&domain=${website}`;
  }

  function copy(value: string) {
    navigator.clipboard?.writeText(value);
  }
</script>

<div class="passwords-page">
  <div class="page-heading">
    <div>
      <h1 class="eyebrow">Vault workspace</h1>
      <p class="page-description">Manage your saved credentials and keep access close at hand.</p>
    </div>
    <Button kind="primary" icon={Add} iconDescription="Add password" size="lg" onclick={openCreate}>
      Add password
    </Button>
  </div>

  <div class="overview-strip" aria-label="Vault overview">
    <div class="overview-item">
      <span class="overview-label">Saved credentials</span>
      <strong>{rows.length}</strong>
    </div>
    <div class="overview-item">
      <span class="overview-label">Vault status</span>
      <strong class="status"><span></span>Protected</strong>
    </div>
    <div class="overview-item">
      <span class="overview-label">Last activity</span>
      <strong>Just now</strong>
    </div>
  </div>

  <div class="table-toolbar">
    <div>
      <h2>All passwords</h2>
      <span>{rows.length} entries</span>
    </div>
    <div class="passwords-actions">
      <button class="toolbar-button" type="button" aria-label="Filter passwords" title="Filter passwords">
        <Filter size={16} />
      </button>
      <button class="toolbar-button" type="button" aria-label="Export passwords to Excel" title="Export passwords to Excel">
        <Download size={16} />
      </button>
      <button class="toolbar-button" type="button" aria-label="Export passwords to PDF" title="Export passwords to PDF">
        <DocumentPdf size={16} />
      </button>
    </div>
  </div>

  {#if errorMessage}
    <div class="error-message" role="alert">{errorMessage}</div>
  {/if}

  {#if loading}
    <div class="loading-message">Loading passwords...</div>
  {:else}
    <DataTable {headers} {rows} size="tall">
    <svelte:fragment slot="cell" let:row let:cell>
      {#if cell.key === 'website'}
        <div class="cell-website">
          <img class="favicon" src={favicon(row.website)} alt="" />
          <span>{row.website}</span>
          <a
            class="icon-link"
            href={`https://${row.website}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${row.website}`}
          >
            <Launch size={16} />
          </a>
        </div>
      {:else if cell.key === 'username'}
        <div class="cell-with-action">
          <span>{row.username}</span>
          <button
            class="icon-button"
            type="button"
            aria-label="Copy username"
            onclick={() => copy(row.username)}
          >
            <Copy size={16} />
          </button>
        </div>
      {:else if cell.key === 'secret'}
        <div class="cell-with-action">
          <span class="secret">{cell.value ?? row.secret}</span>
          <button
            class="icon-button"
            type="button"
            aria-label="Copy secret"
            onclick={() => copy(row.secret)}
          >
            <Copy size={16} />
          </button>
        </div>
      {:else if cell.key === 'actions'}
        <div class="row-actions">
          <button class="icon-button" type="button" aria-label={`Edit ${row.website}`} onclick={() => openEdit(row)}>
            <Edit size={16} />
          </button>
          <button class="icon-button danger" type="button" aria-label={`Delete ${row.website}`} onclick={() => removeEntry(row)}>
            <TrashCan size={16} />
          </button>
        </div>
      {/if}
    </svelte:fragment>
    </DataTable>
  {/if}

  {#if editorOpen}
    <div class="editor-backdrop" role="presentation" onclick={handleBackdropClick}>
      <div class="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <form onsubmit={(event) => { event.preventDefault(); saveEntry(); }}>
          <div class="editor-header">
            <h2 id="editor-title">{editingId ? 'Edit password' : 'Add password'}</h2>
            <button class="icon-button" type="button" aria-label="Close editor" onclick={closeEditor}><Close size={20} /></button>
          </div>
          <label>
            Website
            <input bind:value={form.website} placeholder="example.com" autocomplete="url" />
          </label>
          <label>
            Username
            <input bind:value={form.username} autocomplete="username" />
          </label>
          <label>
            Secret
            <input bind:value={form.secret} type="password" autocomplete="new-password" />
          </label>
          <div class="editor-actions">
            <Button kind="secondary" type="button" onclick={closeEditor}>Cancel</Button>
            <Button kind="primary" type="submit">Save password</Button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .passwords-page {
    color: var(--page-text, #161616);
    padding: 0;
  }

  .page-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2.5rem;
  }

  h1 {
    margin: 0;
    color: var(--page-text, #161616);
    font-size: 2.625rem;
    font-weight: 400;
    line-height: 1;
  }

  .eyebrow {
    margin: 0 0 0.5rem;
    color: #0f62fe;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .page-description {
    margin: 0.75rem 0 0;
    color: var(--page-muted, #525252);
    font-size: 0.875rem;
  }

  .overview-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin-bottom: 2.5rem;
    border-top: 1px solid var(--page-border, #c6c6c6);
    border-bottom: 1px solid var(--page-border, #c6c6c6);
  }

  .overview-item {
    min-height: 6.5rem;
    padding: 1rem 1.25rem;
    border-right: 1px solid var(--page-border, #c6c6c6);
  }

  .overview-item:last-child {
    border-right: 0;
  }

  .overview-label {
    display: block;
    margin-bottom: 0.75rem;
    color: var(--page-muted, #525252);
    font-size: 0.75rem;
  }

  .overview-item strong {
    display: block;
    color: var(--page-text, #161616);
    font-size: 1.75rem;
    font-weight: 400;
  }

  .overview-item .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #198038;
    font-size: 1rem;
  }

  .status span {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #198038;
  }

  .table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .table-toolbar h2 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
    font-weight: 400;
  }

  .table-toolbar span {
    color: var(--page-muted, #6f6f6f);
    font-size: 0.75rem;
  }

  .passwords-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .toolbar-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border: 0;
    color: var(--page-text, #161616);
    background: transparent;
    cursor: pointer;
  }

  .toolbar-button:hover,
  .toolbar-button:focus-visible {
    background: var(--page-border, #c6c6c6);
    outline: 2px solid #0f62fe;
    outline-offset: -2px;
  }

  .cell-website,
  .cell-with-action {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .favicon {
    width: 16px;
    height: 16px;
  }

  .icon-link,
  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--cds-icon-01, #161616);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .secret {
    letter-spacing: 0.1em;
  }

  .row-actions {
    display: flex;
    gap: 0.75rem;
  }

  .icon-button.danger {
    color: #da1e28;
  }

  .loading-message,
  .error-message {
    padding: 1rem;
    background: var(--page-border, #c6c6c6);
    color: var(--page-text, #161616);
  }

  .error-message {
    margin-bottom: 1rem;
    border-left: 3px solid #da1e28;
  }

  .editor-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgb(0 0 0 / 55%);
  }

  .editor {
    width: min(30rem, 100%);
    padding: 1.5rem;
    background: var(--page-background, #f4f4f4);
    color: var(--page-text, #161616);
    box-shadow: 0 1rem 2rem rgb(0 0 0 / 25%);
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .editor-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 400;
  }

  .editor label {
    display: block;
    margin-bottom: 1rem;
    color: var(--page-muted, #525252);
    font-size: 0.75rem;
  }

  .editor input {
    display: block;
    box-sizing: border-box;
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.75rem;
    border: 0;
    border-bottom: 1px solid var(--page-border, #c6c6c6);
    background: var(--page-border, #e0e0e0);
    color: var(--page-text, #161616);
    font: inherit;
  }

  .editor input:focus {
    outline: 2px solid #0f62fe;
    outline-offset: -2px;
  }

  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 2rem;
  }

  @media (max-width: 672px) {
    .page-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .overview-strip {
      grid-template-columns: 1fr;
    }

    .overview-item {
      min-height: auto;
      border-right: 0;
      border-bottom: 1px solid var(--page-border, #c6c6c6);
    }

    .overview-item:last-child {
      border-bottom: 0;
    }

    .table-toolbar {
      align-items: flex-start;
    }
  }
</style>
