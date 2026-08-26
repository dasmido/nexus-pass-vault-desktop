<script lang="ts">
  import { Button } from 'carbon-components-svelte';

  let count: number = $state(0);
</script>

<main>
  <h1>Hello from Electron + Svelte + Carbon Design System!</h1>
  <Button onclick={() => count++}>
    Clicks: {count}
  </Button>
</main>

<style>
  main {
    text-align: center;
    padding: 2rem;
  }
</style>