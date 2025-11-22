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

const createContact = async () => {
  if (!user.value) return router.push('/')

  await addDoc(userContactsRef.value, {
    name: name.value,
    company: company.value,
    meetingPlace: meetingPlace.value,
    dateMet: dateMet.value,
    notes: notes.value,
    nextSteps: nextSteps.value,
    createdAt: serverTimestamp()
  })

  name.value = ''
  company.value = ''
  meetingPlace.value = ''
  dateMet.value = ''
  notes.value = ''
  nextSteps.value = ''
}

</script>

<template>
  <div>
    <h2>Add New Professional Contact</h2>

    <input v-model="name" placeholder="Name" />
    <input v-model="company" placeholder="Company" />
    <input v-model="meetingPlace" placeholder="Meeting place" />
    <input type="date" v-model="dateMet" />

    <textarea v-model="notes" placeholder="Notes"></textarea>
    <textarea v-model="nextSteps" placeholder="Next steps"></textarea>

    <button @click="createContact">Save Contact</button>
  </div>
</template>
