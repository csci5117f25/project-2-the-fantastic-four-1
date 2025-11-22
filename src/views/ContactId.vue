<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCurrentUser, useDocument } from 'vuefire'
import { db } from '../firebase_conf'
import { doc, updateDoc } from 'firebase/firestore'

const route = useRoute()
const user = useCurrentUser()

// Get ID from URL
const contactId = computed(() => route.params.id)

// Firestore document reference
const contactRef = computed(() => {
  if (!user.value || !contactId.value) return null
  return doc(db, 'Users', user.value.uid, 'Contacts', contactId.value)
})

// Auto-updates in realtime
const contact = useDocument(contactRef)

// Editing fields
const isEditing = ref(false)
const edited = ref({
  name: '',
  company: '',
  meetingPlace: '',
  dateMet: '',
  notes: '',
  nextSteps: ''
})

// Start editing (clone data)
const startEditing = () => {
  if (!contact.value) return
  
  edited.value = {
    name: contact.value.name,
    company: contact.value.company,
    meetingPlace: contact.value.meetingPlace,
    dateMet: contact.value.dateMet,
    notes: contact.value.notes,
    nextSteps: contact.value.nextSteps
  }

  isEditing.value = true
}

// Save changes
const saveChanges = async () => {
  if (!contactRef.value) return

  await updateDoc(contactRef.value, edited.value)
  isEditing.value = false
}

</script>

<template>
  <div v-if="contact">
    <h2>Contact Details</h2>

    <div v-if="!isEditing">
      <p><strong>Name:</strong> {{ contact.name }}</p>
      <p><strong>Company:</strong> {{ contact.company }}</p>
      <p><strong>Meeting Place:</strong> {{ contact.meetingPlace }}</p>
      <p><strong>Date Met:</strong> {{ contact.dateMet }}</p>

      <h3>Notes</h3>
      <p>{{ contact.notes || "No notes provided" }}</p>

      <h3>Next Steps</h3>
      <p>{{ contact.nextSteps || "No next steps listed" }}</p>

      <button @click="startEditing">Edit Contact</button>
    </div>

    <div v-else>
      <h3>Edit Contact</h3>

      <input v-model="edited.name" placeholder="Name" />
      <input v-model="edited.company" placeholder="Company" />
      <input v-model="edited.meetingPlace" placeholder="Meeting place" />
      <input type="date" v-model="edited.dateMet" />

      <textarea v-model="edited.notes" placeholder="Notes"></textarea>
      <textarea v-model="edited.nextSteps" placeholder="Next steps"></textarea>

      <button @click="saveChanges">Save</button>
      <button @click="isEditing = false">Cancel</button>
    </div>
  </div>

  <div v-else>
    <p>Loading contact...</p>
  </div>
</template>