<script setup>
import Navbar from './components/NavBar.vue'
</script>

<template>
  <div id="app">
    <header>
      <div>
        <Navbar />
      </div>
    </header>
    <RouterView />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: 
    radial-gradient(circle at 10% 20%, #FF6B9D 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, #4ECDC4 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, #FFE66D 0%, transparent 50%),
    radial-gradient(circle at 80% 10%, #95E1D3 0%, transparent 50%),
    #5B7FDB;
  background-attachment: fixed;
}
</style>
