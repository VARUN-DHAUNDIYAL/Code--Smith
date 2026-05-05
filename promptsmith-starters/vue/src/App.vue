<template>
  <div id="app">
    <h1>Vue App</h1>
    <div class="card">
      <button @click="count++">count is {{ count }}</button>
      <p>
        Edit <code>src/App.vue</code> and save to test HMR
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'App',
  setup() {
    const count = ref(0)
    return { count }
  }
}
</script>

<style scoped>
.card {
  padding: 2rem;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}
</style> 