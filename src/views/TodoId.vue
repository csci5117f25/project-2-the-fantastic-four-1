<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const id = route.params.id
</script>

<template>
  <main>
    ID: {{ id }}
  </main>
</template>
