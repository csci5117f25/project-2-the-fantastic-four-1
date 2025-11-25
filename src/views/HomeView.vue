<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser } from 'vuefire'

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
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.welcome-container {
  text-align: center;
  color: white;
  max-width: 900px;
}

.welcome-title {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.welcome-subtitle {
  font-size: 1.5rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.welcome-content {
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.instruction-text {
  font-size: 1.2rem;
  margin-bottom: 40px;
  line-height: 1.6;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.feature-card {
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 15px;
  padding: 30px 20px;
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  background-color: rgba(255, 255, 255, 0.25);
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.feature-card p {
  font-size: 1rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 2.5rem;
  }
  
  .welcome-subtitle {
    font-size: 1.2rem;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
}
</style>
