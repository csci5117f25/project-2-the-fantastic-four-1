<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser } from 'vuefire'

const router = useRouter()
const user = useCurrentUser()


watch(user, (u) => {
  if (u) router.push('/todos')
})

</script>

<template>
  <main>
    <Navbar />
    <div v-if="!user">
      <p>Please sign in to continue.</p>
    </div>
  </main>
</template>
