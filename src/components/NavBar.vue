<script>
  const provider = new GoogleAuthProvider();
</script>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useFirebaseAuth, useCurrentUser } from 'vuefire'
import { GoogleAuthProvider, signOut, signInWithPopup } from 'firebase/auth'

const auth = useFirebaseAuth()
const user = useCurrentUser()

const inputValue = ref('')
const router = useRouter()

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

</script>

<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid">
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <form class="d-flex" role="search">
          <input v-model="inputValue" class="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
          <button class="btn btn-outline-success" type="submit">Search</button>
        </form>
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item" @click="router.push({ name: 'todos' })">
            <img class="IconImage" src="../assets/home.svg" alt="Home Icon" />
            <span class="nav-link" aria-current="page">Todos</span>
          </li>
          <li class="nav-item" @click="router.push({ name: 'done' })">
            <img class="IconImage" src="../assets/done.svg" alt="Done Icon" />
            <span class="nav-link">Done</span>
          </li>
          <li v-if="user" class="nav-item" @click="logout">
            <img class="IconImage" src="../assets/logout.svg" alt="Logout Icon" />
            <span class="nav-link">Logout</span>
          </li>
          <li v-else class="nav-item" @click="login">
            <img class="IconImage" src="../assets/login.svg" alt="Login Icon" />
            <span class="nav-link">Login</span>
          </li>
          <li v-if="user" class="nav-item">
            <img class="IconImage" :src="user.photoURL" alt="Profile Icon" />
            <span class="nav-link">{{ user.displayName }}</span>
          </li>
          <li v-else class="nav-item">
            <span class="nav-link">Not Logged In</span>
          </li>
          <!--          Dont need right now but could be helpful-->
          <!--          <li class="nav-item dropdown">-->
          <!--            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">-->
          <!--              Dropdown-->
          <!--            </a>-->
          <!--            <ul class="dropdown-menu">-->
          <!--              <li><a class="dropdown-item" href="#">Action</a></li>-->
          <!--              <li><a class="dropdown-item" href="#">Another action</a></li>-->
          <!--              <li><hr class="dropdown-divider"></li>-->
          <!--              <li><a class="dropdown-item" href="#">Something else here</a></li>-->
          <!--            </ul>-->
          <!--          </li>-->
          <!--          <li class="nav-item">-->
          <!--            <a class="nav-link disabled" aria-disabled="true">Disabled</a>-->
          <!--          </li>-->
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.HeroImage {
  display: block;
  margin: 0 auto;
  max-width: 50%;
  height: auto;
  @media (width >= 992px) {
    display: inline-block;
    margin: 0;
    max-width: 20%;
    height: auto;
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  .IconImage {
    height: 30px;
    width: 30px;
  }
}
</style>
