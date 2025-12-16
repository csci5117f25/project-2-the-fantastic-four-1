<script setup>
import { watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser } from 'vuefire'

const isOpen = ref(false)
const router = useRouter()
const user = useCurrentUser()

watch(user, (u) => {
  if (u) router.push('/contacts')
})
</script>

<template>
  <main class="home-page">
    <div class="welcome-container">
      <h1 class="welcome-title">Welcome</h1>
      <p class="welcome-subtitle">Manage your contacts efficiently</p>

      <div v-if="!user" class="welcome-content">
        <p class="instruction-text">
          Please click the <strong>Login</strong> button in the navigation bar above to get started.
        </p>

        <div class="features">
          <div class="feature-card">
            <h3>Organize Contacts</h3>
            <p>Keep all your contacts in one place</p>
          </div>
          <div class="feature-card">
            <h3>Easy to Add</h3>
            <p>Quickly add new contacts with our simple form</p>
          </div>
          <div class="feature-card">
            <h3>Search & Filter</h3>
            <p>Find any contact in seconds</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: rgb(144, 198, 252);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 16px 40px;
}

.welcome-container {
  width: 100%;
  max-width: 900px;
  text-align: center;
  color: rgb(0, 0, 0);
}

.welcome-title {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.welcome-subtitle {
  font-size: 1.5rem;
  margin-bottom: 32px;
}

.welcome-content {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.instruction-text {
  font-size: 1.1rem;
  margin-bottom: 32px;
  line-height: 1.6;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.feature-card {
  background-color: #ffffff;
  border-radius: 15px;
  padding: 24px 16px;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .home-page {
    padding: 96px 12px 24px;
    align-items: flex-start;
  }

  .welcome-title {
    font-size: 2.3rem;
  }

  .welcome-subtitle {
    font-size: 1.1rem;
  }

  .welcome-content {
    padding: 24px 16px;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>
