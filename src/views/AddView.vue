<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser } from 'vuefire'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import {db} from '../firebase_conf'

const name = ref('')
const company = ref('')
const title = ref('')
const dateMet = ref('')
const meetingPlace = ref('')

const notes = reactive([{ text: '' }])
const nextSteps = reactive([{ text: '' }])

const imageFile = ref(null)
const voiceNote = ref(null)

const router = useRouter()
const user = useCurrentUser()

const userContactsRef = computed(() => {
  if (!user.value) return null
  return collection(db, 'Users', user.value.uid, 'Contacts')
})

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
  }
}

const handleVoiceNote = () => {
  alert('Voice note feature coming soon!')
}

const addNoteField = () => notes.push({ text: '' })
const addNextStepField = () => nextSteps.push({ text: '' })

const createContact = async () => {
  if (!user.value) return router.push('/')
  
  const contactDocRef = await addDoc(userContactsRef.value, {
    name: name.value,
    company: company.value,
    title: title.value,
    meetingPlace: meetingPlace.value || '',
    dateMet: dateMet.value || '',
    createdAt: serverTimestamp()
  })

  const contactId = contactDocRef.id

  // Add notes
  const notesRef = collection(db, 'Users', user.value.uid, 'Contacts', contactId, 'Notes')
  for (const n of notes) {
    if (n.text.trim() !== '') {
      await addDoc(notesRef, {
        text: n.text,
        day: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      })
    }
  }

  // Add next steps
  const stepsRef = collection(db, 'Users', user.value.uid, 'Contacts', contactId, 'NextSteps')
  for (const s of nextSteps) {
    if (s.text.trim() !== '') {
      await addDoc(stepsRef, {
        text: s.text,
        done: false,
        createdAt: serverTimestamp()
      })
    }
  }

  name.value = ''
  company.value = ''
  title.value = ''
  meetingPlace.value = ''
  dateMet.value = ''
  notes.splice(0, notes.length, { text: '' })
  nextSteps.splice(0, nextSteps.length, { text: '' })
  imageFile.value = null
  voiceNote.value = null
  
  router.push('/contacts')
}

</script>

<template>
  <div class="new-person-entry">
    <h1 class="entry-title">New Person Entry</h1>
    
    <form @submit.prevent="createContact" class="entry-form">
      <div class="form-row">
        <div class="form-field">
          <label for="name">Name</label>
          <input id="name" v-model="name" type="text" class="form-input" required />
        </div>
        <div class="form-field">
          <label for="company">Company</label>
          <input id="company" v-model="company" type="text" class="form-input" />
        </div>
        <div class="form-field">
          <label for="title">Title</label>
          <input id="title" v-model="title" type="text" class="form-input" />
        </div>
      </div>

      <div class="form-field full-width">
        <label for="meetingPlace">Meeting Place</label>
        <input id="meetingPlace" v-model="meetingPlace" type="text" class="form-input" placeholder="e.g. Coffee shop" />
      </div>

      <div class="form-field full-width">
        <label for="dateMet">Date Met</label>
        <input
          id="dateMet"
          v-model="dateMet"
          type="text"
          class="form-input"
          placeholder="e.g. Nov 20, 2025"
        />
      </div>

      <!-- Notes -->
      <div class="form-field full-width">
        <label>Notes</label>
        <div v-for="(note, index) in notes" :key="index" class="dynamic-input">
          <input v-model="note.text" type="text" class="form-input" placeholder="Enter a note..." />
        </div>
        <button type="button" class="add-button" @click="addNoteField">+ Add another note</button>
      </div>

      <!-- Next Steps -->
      <div class="form-field full-width">
        <label>Next Steps</label>
        <div v-for="(step, index) in nextSteps" :key="index" class="dynamic-input">
          <input v-model="step.text" type="text" class="form-input" placeholder="Enter a next step..." />
        </div>
        <button type="button" class="add-button" @click="addNextStepField">+ Add another next step</button>
      </div>

      <div class="media-options">
        <div class="media-option">
          <input type="file" id="imageUpload" accept="image/*" @change="handleImageUpload" style="display: none;" />
          <label for="imageUpload" class="upload-button image-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="upload-icon">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="M3 12l3-3 3 3 6-6 6 6" stroke="#666" fill="none"></path>
              <path d="M3 18l3-3 3 3 6-6 6 6" stroke="#666" fill="none"></path>
              <circle cx="8.5" cy="8.5" r="1.5" fill="#999"></circle>
            </svg>
            <span>+ Upload Image</span>
          </label>
        </div>
        
        <span class="or-divider">or</span>
        
        <div class="media-option">
          <button type="button" @click="handleVoiceNote" class="upload-button voice-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="voice-icon">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            <span>+ Voice Note</span>
          </button>
        </div>
      </div>

      <div class="submit-section">
        <button type="submit" class="submit-button">Save Contact</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.new-person-entry {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fafafa;
}

.entry-title {
  font-size: 2rem;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 2rem;
}

.entry-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  width: 100%;
}

.form-field label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
}

.form-input:focus {
  outline: none;
  border-color: #4a90e2;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  background-color: white;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #4a90e2;
}

.form-textarea::placeholder {
  color: #999;
}

.media-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.media-option {
  flex: 1;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border-radius: 12px;
  background-color: white;
  cursor: pointer;
  width: 100%;
  font-size: 0.9rem;
  color: #333;
  border: 1px solid #ddd;
}

.upload-button:hover {
  border-color: #4a90e2;
  background-color: #f0f7ff;
}

.image-button {
  border-style: solid;
}

.voice-button {
  border-radius: 50%;
  width: 120px;
  height: 120px;
  background-color: #1a1a1a;
  color: white;
  border: none;
  padding: 0;
}

.voice-button:hover {
  background-color: #333;
}

.upload-icon {
  width: 40px;
  height: 40px;
  color: #666;
}

.voice-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.or-divider {
  font-size: 0.9rem;
  color: #666;
}

.submit-section {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.submit-button {
  padding: 0.875rem 2rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.submit-button:hover {
  background-color: #357abd;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .media-options {
    flex-direction: column;
  }
  
  .voice-button {
    width: 100%;
    height: auto;
    border-radius: 12px;
    padding: 1.5rem;
  }
}
</style>
