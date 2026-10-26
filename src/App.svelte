<script lang="ts">
  import { instruments } from './data/instruments'
</script>

<main>
  <h1>Odeon</h1>
  <p>Tuner coming soon. {instruments.length} instruments loaded.</p>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #111;
    color: #f5f5f5;
    font-family: system-ui, sans-serif;
  }
  main {
    padding: 1rem;
  }
</style>
