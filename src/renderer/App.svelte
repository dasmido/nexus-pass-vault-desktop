<script lang="ts">
  import { Header, HeaderGlobalAction, SkipToContent } from 'carbon-components-svelte';
  import LogoGithub from 'carbon-icons-svelte/lib/LogoGithub.svelte';
  import Apps from 'carbon-icons-svelte/lib/Apps.svelte';
  import Passwords from './Passwords.svelte';
</script>

<Header companyName="Nexus" platformName="Pass Vault">
  <svelte:fragment slot="skipToContent">
    <SkipToContent />
  </svelte:fragment>
  <HeaderGlobalAction
    aria-label="Open Nexus Pass Vault on GitHub"
    icon={LogoGithub}
    href="https://github.com/dasmido/nexus-pass-vault"
    target="_blank"
    rel="noreferrer"
  />
  <HeaderGlobalAction aria-label="Apps" icon={Apps} />
</Header>

<main id="main-content">
  <Passwords />
</main>

<style>
  /* Matches the primary accent color used on nexuspassvault.dasmido.dev */
  :global(.bx--btn--primary:not(.bx--header__action)) {
    background-color: #6709d8 !important;
  }

  :global(.bx--btn--primary:not(.bx--header__action):hover) {
    background-color: #5206aa !important;
  }
</style>