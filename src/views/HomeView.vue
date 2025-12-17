<script setup>
import { watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser, useFirebaseAuth } from 'vuefire'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const isOpen = ref(false)
const router = useRouter()
const user = useCurrentUser()
const auth = useFirebaseAuth()
const provider = new GoogleAuthProvider()

watch(user, (u) => {
  if (u) router.push('/contacts')
})

async function login() {
  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    console.error('Login error:', error)
    alert('Login failed. Please try again.')
  }
}
</script>

<template>
  <main class="home-page">
    <div class="welcome-container">
      <div class="hero-section">
        <h1 class="welcome-title">Welcome to ContactPro</h1>
        <p class="welcome-subtitle">Your smart contact management solution</p>
      </div>

      <div v-if="!user" class="welcome-content">
        <div class="cta-section">
          <p class="instruction-text">
            Get started by logging in to manage your professional network
          </p>
          <button @click="login" class="login-hint">
            <span class="arrow">↑</span>
            <span>Click <strong>Login</strong> above</span>
          </button>
        </div>

        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">📇</div>
            <h3>Organize Contacts</h3>
            <p>Keep all your professional connections organized in one secure place</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📸</div>
            <h3>Capture Business Cards</h3>
            <p>Take photos of business cards and attach them to contacts</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Track Goals</h3>
            <p>Set and monitor your networking goals with visual progress tracking</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #5B7FDB;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 16px 40px;
  position: relative;
  overflow: hidden;
  background: 
    radial-gradient(circle at 10% 20%, #FF6B9D 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, #4ECDC4 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, #FFE66D 0%, transparent 50%),
    radial-gradient(circle at 80% 10%, #95E1D3 0%, transparent 50%),
    #5B7FDB;
}

.home-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.welcome-container {
  width: 100%;
  max-width: 1100px;
  position: relative;
  z-index: 1;
}

.hero-section {
  text-align: center;
  margin-bottom: 48px;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-title {
  font-size: 4.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: #ffffff;
  text-shadow: 2px 4px 12px rgba(0, 0, 0, 0.2);
  letter-spacing: -1px;
}

.welcome-subtitle {
  font-size: 1.75rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 300;
  text-shadow: 1px 2px 8px rgba(0, 0, 0, 0.15);
}

.welcome-content {
  background: #ffffff;
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cta-section {
  text-align: center;
  margin-bottom: 48px;
}

.instruction-text {
  font-size: 1.25rem;
  margin-bottom: 16px;
  line-height: 1.7;
  color: #2d3748;
}

.login-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #7B68EE;
  color: white;
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(123, 104, 238, 0.4);
  animation: pulse 2s infinite;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-hint:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(123, 104, 238, 0.6);
}

.login-hint:active {
  transform: scale(0.98);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(123, 104, 238, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(123, 104, 238, 0.6);
  }
}

.arrow {
  font-size: 1.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #7B68EE;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(123, 104, 238, 0.2);
  border-color: rgba(123, 104, 238, 0.3);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  filter: grayscale(0.3);
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  filter: grayscale(0);
  transform: scale(1.1) rotate(5deg);
}

.feature-card h3 {
  font-size: 1.4rem;
  margin-bottom: 12px;
  color: #2d3748;
  font-weight: 700;
}

.feature-card p {
  font-size: 1rem;
  color: #718096;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .home-page {
    padding: 96px 12px 24px;
    align-items: flex-start;
  }

  .hero-section {
    margin-bottom: 32px;
  }

  .welcome-title {
    font-size: 2.5rem;
  }

  .welcome-subtitle {
    font-size: 1.25rem;
  }

  .welcome-content {
    padding: 32px 24px;
    border-radius: 20px;
  }

  .instruction-text {
    font-size: 1.1rem;
  }

  .features {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feature-card {
    padding: 24px 20px;
  }

  .login-hint {
    font-size: 0.95rem;
    padding: 10px 20px;
  }
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 2rem;
  }

  .welcome-subtitle {
    font-size: 1.1rem;
  }

  .feature-icon {
    font-size: 2.5rem;
  }
}
</style>
