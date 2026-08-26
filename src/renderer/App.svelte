<script lang="ts">
  let count: number = $state(0);
</script>

<main>
  <h1>Hello from Electron + Svelte + TypeScript!</h1>
  <button onclick={() => count++}>
    Clicks: {count}
  </button>
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    text-align: center;
    padding: 2rem;
  }
</style>