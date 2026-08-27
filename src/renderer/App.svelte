<script lang="ts">
  import { onMount } from 'svelte';
  import { Header, HeaderGlobalAction } from 'carbon-components-svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';
  import Sun from 'carbon-icons-svelte/lib/Sun.svelte';
  import Passwords from './Passwords.svelte';

  let darkMode = false;

  function applyTheme(enabled: boolean) {
    darkMode = enabled;
    document.documentElement.dataset.theme = enabled ? 'dark' : 'light';
    document.body.classList.toggle('theme-dark', enabled);
    const darkTheme = document.getElementById('carbon-dark-theme') as HTMLLinkElement | null;
    if (darkTheme) darkTheme.disabled = !enabled;
    localStorage.setItem('nexus-theme', enabled ? 'dark' : 'light');
  }

  function toggleTheme() {
    applyTheme(!darkMode);
  }

  onMount(() => {
    const savedTheme = localStorage.getItem('nexus-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme ? savedTheme === 'dark' : systemPrefersDark);
  });
</script>

<Header companyName="Nexus" platformName="Pass Vault">
  <HeaderGlobalAction
    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    icon={darkMode ? Sun : Moon}
    onclick={toggleTheme}
  />
</Header>

<main id="main-content" class="shell-content">
  <div class="content-frame">
    <Passwords />
  </div>
</main>

<style>
  :global(body) {
    --page-background: #f4f4f4;
    --page-text: #161616;
    --page-muted: #525252;
    --page-border: #c6c6c6;
    margin: 0;
    background: var(--page-background);
    color: var(--page-text);
    font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
    transition: background-color 160ms ease, color 160ms ease;
  }

  :global(body.theme-dark) {
    --page-background: #161616;
    --page-text: #f4f4f4;
    --page-muted: #c6c6c6;
    --page-border: #525252;
  }

  :global(.bx--header) {
    background: #161616;
  }

  :global(.bx--header__name--prefix) {
    color: #a8a8a8;
  }

  :global(.bx--header__name) {
    color: #f4f4f4;
  }

  :global(.bx--side-nav) {
    background: #262626;
    border-right: 1px solid #393939;
  }

  :global(.bx--side-nav__link) {
    color: #f4f4f4;
  }

  :global(.bx--side-nav__link:hover),
  :global(.bx--side-nav__link[aria-current='page']) {
    background: #393939;
  }

  :global(.bx--side-nav__link[aria-current='page'])::before {
    background: #78a9ff;
  }

  .shell-content {
    box-sizing: border-box;
    width: 100%;
    min-height: calc(100vh - 3rem);
    padding-top: 3rem;
  }

  .content-frame {
    box-sizing: border-box;
    max-width: 88rem;
    width: 100%;
    margin: 0 auto;
    padding: 1.5rem 3rem 4rem;
  }

  @media (max-width: 672px) {
    .content-frame {
      padding: 1rem 1rem 3rem;
    }
  }
</style>