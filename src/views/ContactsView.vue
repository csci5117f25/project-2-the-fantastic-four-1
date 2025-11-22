<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCollection, useCurrentUser } from 'vuefire'
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import {db} from '../firebase_conf'

const name = ref('')
const company = ref('')
const meetingPlace = ref('')
const dateMet = ref('')
const notes = ref('')
const nextSteps = ref('')

const router = useRouter()
const user = useCurrentUser()

const userContactsRef = computed(() => {
  if (!user.value) return null
  return collection(db, 'Users', user.value.uid, 'Contacts')
})

const contacts = useCollection(computed(() => {
  if (!userContactsRef.value) return null
  return query(userContactsRef.value, orderBy('createdAt', 'desc'))
}))

const toggleDone = async (contact) => {
  if (!user.value) return

  const ref = doc(db, 'ContactItems', user.value.uid, 'Items', contact.id)
  await updateDoc(ref, { Done: !contact.Done })
}

</script>

<template>
  <div>
    <h3>Your Contacts</h3>

    <div v-for="c in contacts" :key="c.id">
      <router-link :to="`/contact/${c.id}`">{{ c.name }}</router-link>
      <p>Company: {{ c.company }}</p>
      <p>Meeting Place: {{ c.meetingPlace }}</p>
      <p>Date Met: {{ c.dateMet }}</p>
      <p>Notes: {{ c.notes }}</p>
      <p>nextSteps: {{ c.nextSteps }}</p>
    </div>
  </div>
</template>
