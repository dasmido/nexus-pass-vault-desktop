<script lang="ts">
  import {
    Button,
    DataTable,
    OverflowMenu,
    OverflowMenuItem
  } from 'carbon-components-svelte';
  import Filter from 'carbon-icons-svelte/lib/Filter.svelte';
  import Download from 'carbon-icons-svelte/lib/Download.svelte';
  import DocumentPdf from 'carbon-icons-svelte/lib/DocumentPdf.svelte';
  import Add from 'carbon-icons-svelte/lib/Add.svelte';
  import Launch from 'carbon-icons-svelte/lib/Launch.svelte';
  import Copy from 'carbon-icons-svelte/lib/Copy.svelte';

  interface PasswordEntry {
    id: string;
    website: string;
    username: string;
    secret: string;
  }

  const headers = [
    { key: 'website', value: 'Website' },
    { key: 'username', value: 'Username' },
    { key: 'secret', value: 'Secret' },
    { key: 'actions', value: 'Actions', empty: true }
  ];

  const rows: PasswordEntry[] = [
    { id: '1', website: 'google.com', username: 'GmailUser', secret: '••••••••' },
    { id: '2', website: 'youtube.com', username: 'YoutubeUser', secret: '••••••••' },
    { id: '3', website: 'github.com', username: 'GithubUser', secret: '••••••••' },
    { id: '4', website: 'gitlab.com', username: 'GitlabUser', secret: '••••••••' }
  ];

  function favicon(website: string) {
    return `https://www.google.com/s2/favicons?sz=32&domain=${website}`;
  }

  function copy(value: string) {
    navigator.clipboard?.writeText(value);
  }
</script>

<div class="passwords-page">
  <div class="passwords-header">
    <h1>Passwords</h1>
    <div class="passwords-actions">
      <Button kind="ghost" icon={Filter} iconDescription="Filter passwords" hasIconOnly />
      <Button kind="ghost" icon={Download} iconDescription="Export passwords to Excel" hasIconOnly />
      <Button kind="ghost" icon={DocumentPdf} iconDescription="Export passwords to PDF" hasIconOnly />
      <Button kind="primary" icon={Add} iconDescription="Add password" hasIconOnly size="lg" />
    </div>
  </div>

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
        <OverflowMenu flipped>
          <OverflowMenuItem text="Edit" />
          <OverflowMenuItem text="Delete" danger />
        </OverflowMenu>
      {/if}
    </svelte:fragment>
  </DataTable>
</div>

<style>
  .passwords-page {
    padding: 2rem 3rem;
  }

  .passwords-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .passwords-header h1 {
    font-size: 3.375rem;
    font-weight: 300;
    line-height: 1;
    margin: 0;
  }

  .passwords-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
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
</style>
