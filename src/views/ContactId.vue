<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCollection, useCurrentUser, useDocument } from 'vuefire'
import { db } from '../firebase_conf'
import { doc, collection, addDoc, query, orderBy, updateDoc } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const user = useCurrentUser()

const contactId = computed(() => route.params.id)

const contactRef = computed(() => {
  if (!user.value || !contactId.value) return null
  return doc(db, 'Users', user.value.uid, 'Contacts', contactId.value)
})

const contact = useDocument(contactRef)

const isEditing = ref(false)
const edited = ref({
  name: '',
  company: '',
  title: '',
  meetingPlace: '',
  dateMet: '',
  notes: [],
  nextSteps: []
})

const startEditing = () => {
  if (!contact.value) return
  
  edited.value = {
    name: contact.value.name || '',
    company: contact.value.company || '',
    title: contact.value.title || '',
    meetingPlace: contact.value.meetingPlace || '',
    dateMet: contact.value.dateMet || '',
    notes: notes.value
    ? notes.value.map(n => ({
        id: n.id,
        text: n.text,
        day: n.day,
        createdAt: n.createdAt
      }))
    : [],

  nextSteps: nextSteps.value
    ? nextSteps.value.map(s => ({
        id: s.id,
        text: s.text,
        done: s.done,
        createdAt: s.createdAt
      }))
    : []
  }

  isEditing.value = true
}

const saveChanges = async () => {
  // Update main contact fields
  await updateDoc(contactRef.value, {
    name: edited.value.name,
    company: edited.value.company,
    title: edited.value.title,
    meetingPlace: edited.value.meetingPlace,
    dateMet: edited.value.dateMet
  })

  // Update Notes subcollection
  const notesRef = collection(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'Notes')
  for (const note of edited.value.notes) {
    if (!note.id && note.text.trim() !== '') {
      await addDoc(notesRef, {
        text: note.text,
        day: new Date().toISOString().split('T')[0],
        createdAt: new Date()
      })
    } else if (note.id) {
      const noteDoc = doc(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'Notes', note.id)
      await updateDoc(noteDoc, { text: note.text })
    }
  }

  // Update NextSteps subcollection
  const stepsRef = collection(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'NextSteps')
  for (const step of edited.value.nextSteps) {
    if (!step.id && step.text.trim() !== '') {
      await addDoc(stepsRef, {
        text: step.text,
        done: step.done || false,
        createdAt: new Date()
      })
    } else if (step.id) {
      const stepDoc = doc(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'NextSteps', step.id)
      await updateDoc(stepDoc, { text: step.text, done: step.done })
    }
  }
  
  isEditing.value = false
}

// Notes
const notesRef = computed(() => {
  if (!user.value || !contactId.value) return null
  return collection(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'Notes')
})
const notes = useCollection(computed(() => notesRef.value && query(notesRef.value, orderBy('createdAt', 'desc'))))

// Next Steps
const stepsRef = computed(() => {
  if (!user.value || !contactId.value) return null
  return collection(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'NextSteps')
})
const nextSteps = useCollection(computed(() => stepsRef.value && query(stepsRef.value, orderBy('createdAt', 'asc'))))

// Toggle step done
const toggleStepDone = async (step) => {
  const stepDoc = doc(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'NextSteps', step.id)
  await updateDoc(stepDoc, { done: !step.done })
}

</script>

<template>
  <div class="pure-g contact-detail-container">
    <div class="pure-u-1">
      <div v-if="contact" class="contact-detail-card">
        <div v-if="!isEditing" class="view-mode">
          <div class="pure-g detail-header">
            <div class="pure-u-3-4">
              <h1 class="contact-detail-name">{{ contact.name || 'Unnamed Contact' }}</h1>
            </div>
            <div class="pure-u-1-4" style="text-align: right;">
              <button @click="startEditing" class="pure-button pure-button-primary edit-button">Edit</button>
            </div>
          </div>

          <div class="detail-section">
            <div v-if="contact.company" class="pure-g detail-row">
              <div class="pure-u-1-4">
                <span class="detail-label">Company:</span>
              </div>
              <div class="pure-u-3-4">
                <span class="detail-value">{{ contact.company }}</span>
              </div>
            </div>
            
            <div v-if="contact.title" class="pure-g detail-row">
              <div class="pure-u-1-4">
                <span class="detail-label">Title:</span>
              </div>
              <div class="pure-u-3-4">
                <span class="detail-value">{{ contact.title }}</span>
              </div>
            </div>
            
            <div v-if="contact.meetingPlace" class="pure-g detail-row">
              <div class="pure-u-1-4">
                <span class="detail-label">Meeting Place:</span>
              </div>
              <div class="pure-u-3-4">
                <span class="detail-value">{{ contact.meetingPlace }}</span>
              </div>
            </div>
            
            <div v-if="contact.dateMet" class="pure-g detail-row">
              <div class="pure-u-1-4">
                <span class="detail-label">Date Met:</span>
              </div>
              <div class="pure-u-3-4">
                <span class="detail-value">{{ contact.dateMet }}</span>
              </div>
            </div>

            <!-- NEXT STEPS -->
            <div v-if="nextSteps" class="detail-row">
              <div v-for="step in nextSteps" :key="step.id">
                <label>
                  <input type="checkbox" :checked="step.done" @change="toggleStepDone(step)" />
                  <span class="detail-value">{{ step.text }}</span>
                </label>
              </div>
            </div>

            <!-- NOTES -->
            <div v-if="notes" class="detail-row">
              <div v-for="note in notes" :key="note.id" class="pure-g">
                <div class="pure-u-1-4">
                  <span class="detail-label">{{ note.day }}</span>
                </div>
                <div class="pure-u-3-4">
                  <span class="detail-value">{{ note.text }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button @click="router.push('/contacts')" class="pure-button back-button">Back to Contacts</button>
          </div>
        </div>

        <div v-else class="edit-mode">
          <h2 class="edit-title">Edit Contact</h2>
          
          <form @submit.prevent="saveChanges" class="pure-form pure-form-stacked edit-form">
            <div class="pure-g form-row">
              <div class="pure-u-1 pure-u-md-1-3">
                <label for="edit-name">Name</label>
                <input 
                  id="edit-name"
                  v-model="edited.name" 
                  type="text" 
                  class="pure-input-1"
                  required
                />
              </div>
              <div class="pure-u-1 pure-u-md-1-3">
                <label for="edit-company">Company</label>
                <input 
                  id="edit-company"
                  v-model="edited.company" 
                  type="text" 
                  class="pure-input-1"
                />
              </div>
              <div class="pure-u-1 pure-u-md-1-3">
                <label for="edit-title">Title</label>
                <input 
                  id="edit-title"
                  v-model="edited.title" 
                  type="text" 
                  class="pure-input-1"
                />
              </div>
            </div>

            <div class="pure-u-1">
              <label for="edit-meetingPlace">Meeting Place</label>
              <input 
                id="edit-meetingPlace"
                v-model="edited.meetingPlace" 
                type="text" 
                class="pure-input-1"
              />
            </div>

            <div class="pure-u-1">
              <label for="edit-dateMet">Date Met</label>
              <input 
                id="edit-dateMet"
                v-model="edited.dateMet" 
                type="text" 
                class="pure-input-1"
                placeholder="e.g. Nov 20, 2025"
              />
            </div>

            <div class="pure-u-1">
              <label>Notes</label>
              <div v-for="(note, i) in edited.notes" :key="note.id || i" class="dynamic-input">
                <input v-model="note.text" type="text" class="pure-input-1" placeholder="Enter a note..." />
              </div>
              <button type="button" class="pure-button" @click="edited.notes.push({ text: '' })">+ Add Note</button>
            </div>

            <div class="pure-u-1">
              <label>Next Steps</label>
              <div v-for="(step, i) in edited.nextSteps" :key="step.id || i" class="dynamic-input">
                <input v-model="step.text" type="text" class="pure-input-1" placeholder="Enter next step..." />
                <label>
                  <input type="checkbox" v-model="step.done" />
                  Done
                </label>
              </div>
              <button type="button" class="pure-button" @click="edited.nextSteps.push({ text: '', done: false })">+ Add Next Step</button>
            </div>

            <div class="pure-u-1 form-actions">
              <button type="submit" class="pure-button pure-button-primary save-button">Save</button>
              <button type="button" @click="isEditing = false" class="pure-button cancel-button">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div v-else class="loading-state">
        <p>Loading contact...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-detail-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fafafa;
}

.contact-detail-card {
  background-color: white;
  padding: 2rem;
}

.detail-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.contact-detail-name {
  font-size: 2rem;
  font-weight: bold;
  color: #1a1a1a;
  margin: 0;
}

.edit-button {
  padding: 0.5rem 1.5rem;
  font-size: 0.9rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-row {
  margin-bottom: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-label {
  font-weight: 500;
  color: #333;
}

.detail-value {
  color: #666;
}

.action-buttons {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.back-button {
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
}

.edit-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
}

.edit-form {
  margin-top: 1.5rem;
}

.form-row {
  margin-bottom: 1.5rem;
}

.dynamic-input {
  margin-bottom: 0.5rem;
}

.form-actions {
  margin-top: 1rem;
}

.save-button {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  margin-right: 1rem;
}

.cancel-button {
  padding: 0.875rem 2rem;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 768px) {
  .contact-detail-container {
    padding: 1rem;
  }
  
  .contact-detail-card {
    padding: 1.5rem;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .detail-label {
    min-width: auto;
  }
}
</style>