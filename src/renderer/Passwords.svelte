<script lang="ts">
  import {
    Button,
    DataTable,
    InlineLoading,
    Modal,
    OverflowMenu,
    OverflowMenuItem,
    Pagination,
    TextInput
  } from 'carbon-components-svelte';
  import type { DataTableHeader } from 'carbon-components-svelte/src/DataTable/DataTable.svelte';
  import Add from 'carbon-icons-svelte/lib/Add.svelte';
  import Launch from 'carbon-icons-svelte/lib/Launch.svelte';
  import Copy from 'carbon-icons-svelte/lib/Copy.svelte';
  import Edit from 'carbon-icons-svelte/lib/Edit.svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import Locked from 'carbon-icons-svelte/lib/Locked.svelte';
  import { onMount } from 'svelte';

  const unlockPin = '1234';

  const headers: DataTableHeader<PasswordEntry>[] = [
    { key: 'website', value: 'Website' },
    { key: 'username', value: 'Username' },
    { key: 'secret', value: 'Secret' },
    { key: 'actions', empty: true }
  ];

  const defaultPageSize = 10;
  let rows: PasswordEntry[] = [];
  let currentPage = 1;
  let pageSize = defaultPageSize;
  let totalItems = 0;
  let loading = true;
  let errorMessage = '';
  let editorOpen = false;
  let editingId: string | null = null;
  let saving = false;
  let form: PasswordEntryInput = { website: '', username: '', secret: '' };
  let revealedIds = new Set<string>();
  const revealTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let pinDialogOpen = false;
  let pinDialogRowId: string | null = null;
  let pinCode = '';
  let pinError = '';
  let deleteDialogOpen = false;
  let pendingDelete: PasswordEntry | null = null;
  let deleting = false;

  async function loadEntries(page = currentPage, requestedPageSize = pageSize) {
    loading = true;
    try {
      const result = await window.api.passwords.list(page, requestedPageSize);
      rows = result.entries;
      totalItems = result.totalItems;
      currentPage = page;
      pageSize = requestedPageSize;
      errorMessage = '';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to load passwords.';
    } finally {
      loading = false;
    }
  }

  function handlePaginationChange(event: CustomEvent<{ page?: number; pageSize?: number }>) {
    const nextPage = event.detail.page ?? currentPage;
    const nextPageSize = event.detail.pageSize ?? pageSize;
    void loadEntries(nextPage, nextPageSize);
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

  function openPinDialog(entry: PasswordEntry) {
    pinDialogRowId = entry.id;
    pinCode = '';
    pinError = '';
    pinDialogOpen = true;
  }

  function closePinDialog() {
    pinDialogOpen = false;
    pinDialogRowId = null;
    pinCode = '';
    pinError = '';
  }

  function verifyPin() {
    if (pinCode !== unlockPin) {
      pinError = 'Incorrect PIN.';
      return;
    }

    if (pinDialogRowId) {
      const rowId = pinDialogRowId;
      const currentTimer = revealTimers.get(rowId);
      if (currentTimer) clearTimeout(currentTimer);

      revealedIds = new Set(revealedIds).add(rowId);
      revealTimers.set(rowId, setTimeout(() => {
        const nextRevealedIds = new Set(revealedIds);
        nextRevealedIds.delete(rowId);
        revealedIds = nextRevealedIds;
        revealTimers.delete(rowId);
      }, 10000));
    }
    closePinDialog();
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
      saving = true;
      if (editingId) {
        const updated = await window.api.passwords.update(editingId, input);
        await loadEntries();
      } else {
        await window.api.passwords.create(input);
        await loadEntries(1, pageSize);
      }
      errorMessage = '';
      closeEditor();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to save password.';
    } finally {
      saving = false;
    }
  }

  function requestRemove(entry: PasswordEntry) {
    pendingDelete = entry;
    deleteDialogOpen = true;
  }

  function closeDeleteDialog() {
    if (deleting) return;
    deleteDialogOpen = false;
    pendingDelete = null;
  }

  async function removeEntry() {
    if (!pendingDelete) return;
    const entry = pendingDelete;
    try {
      deleting = true;
      await window.api.passwords.delete(entry.id);
      await loadEntries(currentPage, pageSize);
      errorMessage = '';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to delete password.';
    } finally {
      deleting = false;
      closeDeleteDialog();
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
    </Button>
  </div>

  <div class="overview-strip" aria-label="Vault overview">
    <div class="overview-item">
      <span class="overview-label">Saved credentials</span>
      <strong>{totalItems}</strong>
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
      <span>{totalItems} entries</span>
    </div>
  </div>

  {#if errorMessage}
    <div class="error-message" role="alert">{errorMessage}</div>
  {/if}

  {#if loading}
    <div class="loading-message" role="status" aria-live="polite">
      <InlineLoading status="active" description="Loading passwords" />
    </div>
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
          {#if revealedIds.has(row.id)}
            <span class="secret">{row.secret}</span>
            <button
              class="icon-button"
              type="button"
              aria-label="Copy password"
              title="Copy password"
              onclick={() => copy(row.secret)}
            >
              <Copy size={16} />
            </button>
          {:else}
            <span class="secret">********</span>
            <button
              class="icon-button lock-button"
              type="button"
              aria-label={`Unlock password for ${row.website}`}
              title="Unlock password"
              onclick={() => openPinDialog(row)}
            >
              <Locked size={16} />
            </button>
          {/if}
        </div>
      {:else if cell.key === 'actions'}
        <OverflowMenu flipped iconDescription={`Actions for ${row.website}`}>
          <OverflowMenuItem text="Edit" icon={Edit} on:click={() => openEdit(row)} />
          <OverflowMenuItem text="Delete" icon={TrashCan} danger on:click={() => requestRemove(row)} />
        </OverflowMenu>
      {/if}
    </svelte:fragment>
    </DataTable>
    <Pagination
      page={currentPage}
      pageSize={pageSize}
      pageSizes={[5, 10, 25, 50]}
      totalItems={totalItems}
      dynamicPageSizes
      on:change={handlePaginationChange}
    />
  {/if}

  {#if editorOpen}
    <Modal
      open
      size="sm"
      hasForm
      modalHeading={editingId ? 'Edit password' : 'Add password'}
      modalLabel="Vault credentials"
      iconDescription="Close password editor"
      primaryButtonText="Save password"
      secondaryButtonText="Cancel"
      primaryButtonLoading={saving}
      primaryButtonLoadingDescription="Saving password"
      on:close={closeEditor}
      on:click:button--primary={saveEntry}
      on:click:button--secondary={closeEditor}
    >
      <TextInput bind:value={form.website} labelText="Website" placeholder="example.com" name="website" required />
      <TextInput bind:value={form.username} labelText="Username" name="username" required />
      <TextInput bind:value={form.secret} type="password" labelText="Secret" name="secret" required />
    </Modal>
  {/if}

  {#if pinDialogOpen}
    <Modal
      open
      size="sm"
      modalHeading="Unlock password"
      modalLabel="Protected credential"
      iconDescription="Close PIN dialog"
      primaryButtonText="OK"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!pinCode}
      on:close={closePinDialog}
      on:click:button--primary={verifyPin}
      on:click:button--secondary={closePinDialog}
    >
      <p class="pin-help">Enter your PIN to reveal this password.</p>
      <TextInput
        bind:value={pinCode}
        type="password"
        labelText="PIN"
        name="pin"
        inputmode="numeric"
        autocomplete="off"
        invalid={Boolean(pinError)}
        invalidText={pinError}
      />
    </Modal>
  {/if}

  {#if deleteDialogOpen}
    <Modal
      open
      size="sm"
      danger
      modalHeading="Delete password"
      modalLabel="Confirm deletion"
      iconDescription="Close delete confirmation"
      primaryButtonText="Delete"
      secondaryButtonText="Cancel"
      primaryButtonLoading={deleting}
      primaryButtonLoadingDescription="Deleting password"
      on:close={closeDeleteDialog}
      on:click:button--primary={removeEntry}
      on:click:button--secondary={closeDeleteDialog}
    >
      <p class="delete-message">
        Are you sure you want to remove the password for <strong>{pendingDelete?.website}</strong>?
        This action cannot be undone.
      </p>
    </Modal>
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

  .lock-button {
    color: #0f62fe;
  }

  .pin-help {
    margin: 0 0 1rem;
    color: var(--page-muted, #525252);
    font-size: 0.875rem;
  }

  .delete-message {
    margin: 0;
    color: var(--page-muted, #525252);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .delete-message strong {
    color: var(--page-text, #161616);
  }

  .loading-message,
  .error-message {
    padding: 1rem;
    background: var(--page-border, #c6c6c6);
    color: var(--page-text, #161616);
  }

  .loading-message {
    display: flex;
    min-height: 3rem;
    align-items: center;
  }

  .error-message {
    margin-bottom: 1rem;
    border-left: 3px solid #da1e28;
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
