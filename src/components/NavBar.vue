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

if (route.query.search) {
  inputValue.value = route.query.search
}

watch(() => route.query.search, (newSearch) => {
  if (newSearch !== inputValue.value) {
    inputValue.value = newSearch || ''
  }
})

let searchTimeout = null

watch(inputValue, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  const isOnContactsPage = route.name === 'contacts'
  
  searchTimeout = setTimeout(() => {
    if (isOnContactsPage) {
      if (newValue.trim()) {
        router.push({
          name: 'contacts',
          query: { search: newValue.trim() }
        })
      } else {
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
      await signInWithPopup(auth, provider)
  } catch {
      alert("oh no");
  }
}

async function logout() {
  try {
    await signOut(auth)
    router.push('/')
  } catch {
    alert("oh no");
  }
}

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
      <li class="pure-menu-item search-item">
        <form class="pure-form pure-form-inline" role="search" @submit.prevent="handleSearch">
          <input 
            v-model="inputValue" 
            class="pure-input-rounded" 
            type="search" 
            placeholder="Search" 
            aria-label="Search"
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

.pure-menu-list {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search-item {
  flex: 1 1 250px;
}

.nav-link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-decoration: none;
}

.nav-link-item .IconImage {
  height: 28px;
  width: 28px;
}

.pure-form-inline {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
}

.pure-input-rounded {
  padding: 0.5em 1em;
  border-radius: 2em;
  width: 100%;
}

@media (max-width: 768px) {
  .pure-menu-list {
    flex-direction: column;
    align-items: stretch;
  }

  .pure-menu-item {
    width: 100%;
    text-align: center;
  }

  .nav-link-item {
    flex-direction: row;
    justify-content: center;
  }

  .pure-form-inline {
    flex-direction: column;
  }
}
</style>
