<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCollection, useCurrentUser } from 'vuefire'
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import {db} from '../firebase_conf'

const newAction = ref('')
const newDate = ref('')

const router = useRouter()
const user = useCurrentUser()

const userTodosRef = computed(() => {
  if (!user.value) return null
  return collection(db, 'TodoItems', user.value.uid, 'Items')
})

const TodoItems = useCollection(computed(() => {
  if (!userTodosRef.value) return null
  return query(userTodosRef.value, orderBy('CreatedAt', 'desc'))
}))

const createTodo = async () => {
  if (!user.value) return router.push('/')

  try {
    const docRef = await addDoc(
      collection(db, 'TodoItems', user.value.uid, 'Items'),
      {
        Actions: newAction.value,
        Date: newDate.value,
        Done: false,
        CreatedAt: serverTimestamp()
      }
    )
    newAction.value = ''
    newDate.value = ''
  } catch (e) {
    console.error(e)
  }
}

const toggleDone = async (todo) => {
  if (!user.value) return

  const ref = doc(db, 'TodoItems', user.value.uid, 'Items', todo.id)
  await updateDoc(ref, { Done: !todo.Done })
}

</script>

<template>
  <div>
    <input
      placeholder="New action"
      type="text"
      v-model="newAction"
    />
    <input
      placeholder="Date"
      type="text"
      v-model="newDate"
    />
    <button class="button" @click="createTodo">Add</button>
    <router-link to="/done">View done</router-link>

    <div v-for="todo in TodoItems.filter(t => t.Done)" :key="todo.id" class="todo-item">
      <router-link :to="`/todo/${todo.id}`">{{ todo.id }}</router-link>
      <span>{{todo.Actions}}</span>

      <br>

      <span>{{todo.Date}}</span>

      <br>

      <input
      type="checkbox"
      :checked="todo.Done"
      @change="toggleDone(todo)"
      />
      <span>
        {{ todo.Done ? "Done" : "In progress" }}
      </span>
    </div>
  </div>
</template>
