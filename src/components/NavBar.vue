<script>
  const provider = new GoogleAuthProvider();
</script>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { useFirebaseAuth, useCurrentUser } from 'vuefire'
import { GoogleAuthProvider, signOut, signInWithPopup } from 'firebase/auth'

const auth = useFirebaseAuth()
const user = useCurrentUser()

const inputValue = ref('')
const router = useRouter()
const route = useRoute()

// Initialize input value from route query if exists
if (route.query.search) {
  inputValue.value = route.query.search
}

// Watch for route changes to sync input value
watch(() => route.query.search, (newSearch) => {
  if (newSearch !== inputValue.value) {
    inputValue.value = newSearch || ''
  }
})

// Debounce timer
let searchTimeout = null

// Watch input value and update route query in real-time
watch(inputValue, (newValue) => {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // Only navigate if we're on contacts page or going to contacts
  const isOnContactsPage = route.name === 'contacts'
  
  // Debounce the search update (wait 300ms after user stops typing)
  searchTimeout = setTimeout(() => {
    if (isOnContactsPage) {
      if (newValue.trim()) {
        router.push({
          name: 'contacts',
          query: { search: newValue.trim() }
        })
      } else {
        // Clear search if input is empty
        router.push({
          name: 'contacts',
          query: {}
        })
      }
    }
  }, 300)
})

async function login() {
  try {
      const result = await signInWithPopup(auth, provider)
  } catch {
      alert("oh no");
  }
}

async function logout() {
  try {
    const result = await signOut(auth)
    router.push('/')
  } catch {
    alert("oh no");
  }
}

// Search handler for form submission (navigates to contacts if not already there)
function handleSearch(e) {
  e.preventDefault()
  if (inputValue.value.trim()) {
    router.push({
      name: 'contacts',
      query: { search: inputValue.value.trim() }
    })
  } else {
    router.push({
      name: 'contacts',
      query: {}
    })
  }
}

</script>

<template>
  <div class="pure-menu pure-menu-horizontal custom-navbar">
    <div class="pure-menu-heading">Contacts App</div>
    <ul class="pure-menu-list">
      <li class="pure-menu-item">
        <form class="pure-form pure-form-inline" role="search" @submit.prevent="handleSearch">
          <input 
            v-model="inputValue" 
            class="pure-input-rounded" 
            type="search" 
            placeholder="Search" 
            aria-label="Search"
            @input="handleSearch"
          />
          <button class="pure-button pure-button-primary" type="submit">Search</button>
        </form>
      </li>
      <li class="pure-menu-item" @click="router.push({ name: 'contacts' })">
        <a href="#" class="pure-menu-link nav-link-item">
          <img class="IconImage" src="../assets/home.svg" alt="Home Icon" />
          <span>Contacts</span>
        </a>
      </li>
      <li class="pure-menu-item" @click="router.push({ name: 'add' })">
        <a href="#" class="pure-menu-link nav-link-item">
          <img class="IconImage" src="../assets/add.svg" alt="Add Icon" />
          <span>Add</span>
        </a>
      </li>
      <li v-if="user" class="pure-menu-item" @click="logout">
        <a href="#" class="pure-menu-link nav-link-item">
          <img class="IconImage" src="../assets/logout.svg" alt="Logout Icon" />
          <span>Logout</span>
        </a>
      </li>
      <li v-else class="pure-menu-item" @click="login">
        <a href="#" class="pure-menu-link nav-link-item">
          <img class="IconImage" src="../assets/login.svg" alt="Login Icon" />
          <span>Login</span>
        </a>
      </li>
      <li v-if="user" class="pure-menu-item">
        <a href="#" class="pure-menu-link nav-link-item">
          <img class="IconImage" :src="user.photoURL" alt="Profile Icon" />
          <span>{{ user.displayName }}</span>
        </a>
      </li>
      <li v-else class="pure-menu-item">
        <span class="pure-menu-link">Not Logged In</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.custom-navbar {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
}

.custom-navbar .pure-menu-heading {
  color: #333;
  font-weight: bold;
}

.nav-link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-decoration: none;
}

.nav-link-item .IconImage {
  height: 30px;
  width: 30px;
}

.pure-form-inline {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pure-input-rounded {
  padding: 0.5em 1em;
  border-radius: 2em;
}

@media (max-width: 768px) {
  .custom-navbar {
    padding: 0.5rem;
  }
  
  .pure-form-inline {
    flex-direction: column;
    width: 100%;
  }
  
  .pure-input-rounded {
    width: 100%;
  }
}
</style>
