<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser } from 'vuefire'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase_conf'


const name = ref('')
const company = ref('')
const title = ref('')
const dateMet = ref('')
const meetingPlace = ref('')
const imagePreviewUrl = ref(null)


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
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}


const handleVoiceNote = () => {
  alert('Voice note feature coming soon!')
}

const addNoteField = () => notes.push({ text: '' })
const addNextStepField = () => nextSteps.push({ text: '' })

const createContact = async () => {
  console.log('createContact called')
  console.log('user:', user.value)
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

  // Storage code stuff
  if (imageFile.value) {
  const file = imageFile.value

const imageRef = storageRef(
  storage,
  `photos/${user.value.uid}/contacts/${contactId}/business-card`
)


  await uploadBytes(imageRef, file)

  const imageUrl = await getDownloadURL(imageRef)

  console.log('IMAGE URL:', imageUrl)

  await updateDoc(
    doc(db, 'Users', user.value.uid, 'Contacts', contactId),
    {
      businessCardUrl: imageUrl
    }
  )
}


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
  <div class="pure-g new-person-entry">
    <div class="pure-u-1">
      <h1 class="entry-title">New Person Entry</h1>
      
      <form @submit.prevent="createContact" class="pure-form pure-form-stacked entry-form">
        <div class="pure-g form-row">
          <div class="pure-u-1 pure-u-md-1-3">
            <label for="name">Name</label>
            <input id="name" v-model="name" type="text" class="pure-input-1" required />
          </div>
          <div class="pure-u-1 pure-u-md-1-3">
            <label for="company">Company</label>
            <input id="company" v-model="company" type="text" class="pure-input-1" />
          </div>
          <div class="pure-u-1 pure-u-md-1-3">
            <label for="title">Title</label>
            <input id="title" v-model="title" type="text" class="pure-input-1" />
          </div>
        </div>

        <div class="pure-u-1">
          <label for="meetingPlace">Meeting Place</label>
          <input id="meetingPlace" v-model="meetingPlace" type="text" class="pure-input-1" placeholder="e.g. Coffee shop" />
        </div>

        <div class="pure-u-1">
          <label for="dateMet">Date Met</label>
          <input
            id="dateMet"
            v-model="dateMet"
            type="text"
            class="pure-input-1"
            placeholder="e.g. Nov 20, 2025"
          />
        </div>

        <!-- Notes -->
        <div class="pure-u-1">
          <label>Notes</label>
          <div v-for="(note, index) in notes" :key="index" class="dynamic-input">
            <input v-model="note.text" type="text" class="pure-input-1" placeholder="Enter a note..." />
          </div>
          <button type="button" class="pure-button" @click="addNoteField">+ Add another note</button>
        </div>

        <!-- Next Steps -->
        <div class="pure-u-1">
          <label>Next Steps</label>
          <div v-for="(step, index) in nextSteps" :key="index" class="dynamic-input">
            <input v-model="step.text" type="text" class="pure-input-1" placeholder="Enter a next step..." />
          </div>
          <button type="button" class="pure-button" @click="addNextStepField">+ Add another next step</button>
        </div>

        <div class="pure-g media-options">
          <div class="pure-u-1 pure-u-md-1-2">
            <input type="file" id="imageUpload" accept="image/*" @change="handleImageUpload" style="display: none;" />
            <label for="imageUpload" class="pure-button upload-button image-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="upload-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M3 12l3-3 3 3 6-6 6 6" stroke="#666" fill="none"></path>
                <path d="M3 18l3-3 3 3 6-6 6 6" stroke="#666" fill="none"></path>
                <circle cx="8.5" cy="8.5" r="1.5" fill="#999"></circle>
              </svg>
              <span>+ Upload Image</span>
            </label>
          </div>
          
          <div class="pure-u-1 pure-u-md-1-2" style="text-align: center; line-height: 120px;">
            <span class="or-divider">or</span>
          </div>
          
          <div class="pure-u-1 pure-u-md-1-2">
            <button type="button" @click="handleVoiceNote" class="pure-button upload-button voice-button">
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
        <div v-if="imagePreviewUrl" class="image-preview">
        <img :src="imagePreviewUrl" alt="Preview" />
        </div>


        <div class="pure-u-1 submit-section">
          <button type="submit" class="pure-button pure-button-primary submit-button">Save Contact</button>
        </div>
      </form>
    </div>
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
  margin-top: 1.5rem;
}

.form-row {
  margin-bottom: 1.5rem;
}

.dynamic-input {
  margin-bottom: 0.5rem;
}

.media-options {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  width: 100%;
  font-size: 0.9rem;
}

.image-button {
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
}

.image-button:hover {
  border-color: #0078e7;
  background-color: #f0f7ff;
}

.voice-button {
  border-radius: 50%;
  width: 120px;
  height: 120px;
  background-color: #1a1a1a;
  color: white;
  padding: 0;
  margin: 0 auto;
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
  text-align: center;
}

.submit-button {
  padding: 0.875rem 2rem;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .voice-button {
    width: 100%;
    height: auto;
    border-radius: 0.3em;
    padding: 1.5rem;
  }
}
.image-preview {
  margin-bottom: 1rem;
  text-align: center;
}

.image-preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

</style>
