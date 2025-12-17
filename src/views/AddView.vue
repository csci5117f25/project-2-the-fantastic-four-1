<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser } from 'vuefire'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase_conf'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'

const isRecording = ref(false)
const recognitionInstance = ref(null)
const recordingTimeout = ref(null)

let mediaRecorder = null
let audioChunks = []

const name = ref('')
const company = ref('')
const title = ref('')
const dateMet = ref(null)
const meetingPlace = ref('')

const notes = reactive([{ text: '' }])
const nextSteps = reactive([{ text: '' }])

const imageFile = ref(null)
const imageFileURL = ref(null)
const voiceNote = ref(null)
const showCamera = ref(false)
const capturedPhoto = ref(null)
const videoStream = ref(null)
const capturedPhotoURL = ref(null)

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
    imageFileURL.value = URL.createObjectURL(file)
  }
}

const toggleVoiceRecording = () => {
  if (isRecording.value) stopVoiceRecording()
  else startVoiceRecording()
}

const startVoiceRecording = () => {
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    alert("Speech recognition not supported. Use Chrome.")
    return
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognitionInstance.value = recognition

  recognition.lang = "en-US"
  recognition.interimResults = true
  recognition.continuous = true

  isRecording.value = true

  let finalTranscript = ""
  let liveNoteIndex = notes.length
  notes.push({ text: "" })

  recognition.onresult = (event) => {
    let interimTranscript = ""
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) finalTranscript += transcript + " "
      else interimTranscript += transcript + " "
    }
    notes[liveNoteIndex].text = finalTranscript + interimTranscript
  }

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error)
    if (event.error !== "no-speech") {
      stopVoiceRecording()
      alert("Speech recognition failed: " + event.error)
    }
  }

  recognition.onend = () => {
    if (finalTranscript.trim() !== "") notes[liveNoteIndex].text = finalTranscript.trim()
    else notes.splice(liveNoteIndex, 1)
    isRecording.value = false
    recognitionInstance.value = null
    clearTimeout(recordingTimeout.value)
  }

  recognition.start()
  recordingTimeout.value = setTimeout(stopVoiceRecording, 30_000)
}

const stopVoiceRecording = () => {
  if (recognitionInstance.value) {
    recognitionInstance.value.stop()
    recognitionInstance.value = null
  }
  isRecording.value = false
  clearTimeout(recordingTimeout.value)
}

// Camera functions
const openCamera = async () => {
  try {
    showCamera.value = true
    await new Promise(resolve => setTimeout(resolve, 0))

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    videoStream.value = stream

    const videoEl = document.getElementById('camera-preview')
    if (videoEl) videoEl.srcObject = stream
  } catch (error) {
    showCamera.value = false
    let errorMessage = 'Unable to access camera.\n\n'
    if (error.name === 'NotAllowedError') errorMessage += 'Please allow camera access in your browser settings.'
    else if (error.name === 'NotFoundError') errorMessage += 'No camera found.'
    else errorMessage += error.message
    alert(errorMessage)
  }
}

const capturePhoto = () => {
  const videoEl = document.getElementById('camera-preview')
  const canvas = document.createElement('canvas')
  canvas.width = videoEl.videoWidth
  canvas.height = videoEl.videoHeight
  canvas.getContext('2d').drawImage(videoEl, 0, 0)
  canvas.toBlob((blob) => {
    capturedPhoto.value = blob
    capturedPhotoURL.value = URL.createObjectURL(blob)
    closeCamera()
  }, 'image/jpeg')
}

const closeCamera = () => {
  if (videoStream.value) videoStream.value.getTracks().forEach(track => track.stop())
  videoStream.value = null
  showCamera.value = false
}

const addNoteField = () => notes.push({ text: '' })
const addNextStepField = () => nextSteps.push({ text: '' })

const createContact = async () => {
  if (!user.value) return router.push('/')
  let photoURL = null
  const photoToUpload = capturedPhoto.value || imageFile.value

  if (photoToUpload) {
    try {
      const photoFileName = `photos/${user.value.uid}/${Date.now()}.jpg`
      const photoStorageRef = storageRef(storage, photoFileName)
      await uploadBytes(photoStorageRef, photoToUpload)
      photoURL = await getDownloadURL(photoStorageRef)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    }
  }

  const contactDocRef = await addDoc(userContactsRef.value, {
    name: name.value,
    company: company.value,
    title: title.value,
    meetingPlace: meetingPlace.value || '',
    dateMet: dateMet.value
      ? dateMet.value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
    photoURL: photoURL || null,
    createdAt: serverTimestamp()
  })

  const contactId = contactDocRef.id

  const notesRef = collection(db, 'Users', user.value.uid, 'Contacts', contactId, 'Notes')
  for (const n of notes) {
    if (n.text.trim() !== '') await addDoc(notesRef, { text: n.text, day: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() })
  }

  const stepsRef = collection(db, 'Users', user.value.uid, 'Contacts', contactId, 'NextSteps')
  for (const s of nextSteps) {
    if (s.text.trim() !== '') await addDoc(stepsRef, { text: s.text, done: false, createdAt: serverTimestamp() })
  }

  // Reset form
  name.value = ''
  company.value = ''
  title.value = ''
  meetingPlace.value = ''
  dateMet.value = ''
  notes.splice(0, notes.length, { text: '' })
  nextSteps.splice(0, nextSteps.length, { text: '' })
  imageFile.value = null
  imageFileURL.value = null
  voiceNote.value = null
  capturedPhoto.value = null
  capturedPhotoURL.value = null
  showCamera.value = false

  router.push('/contacts')
}
</script>

<template>
  <div class="new-person-entry">
    <h1 class="entry-title">New Person Entry</h1>
    <form @submit.prevent="createContact" class="entry-form">
      <!-- Contact Info -->
      <div class="form-row">
        <div class="form-field"><label for="name">Name</label><input id="name" v-model="name" class="form-input" required /></div>
        <div class="form-field"><label for="company">Company</label><input id="company" v-model="company" class="form-input" /></div>
        <div class="form-field"><label for="title">Title</label><input id="title" v-model="title" class="form-input" /></div>
      </div>
      <div class="form-field full-width">
        <label for="meetingPlace">Meeting Place</label>
        <input id="meetingPlace" v-model="meetingPlace" class="form-input" placeholder="e.g. Coffee shop" />
      </div>
      <div class="form-field full-width">
        <label>Date Met</label>
        <DatePicker v-model="dateMet" appendTo="body" dateFormat="M d, yy" showIcon inputClass="form-input" placeholder="Select date" />
      </div>

      <!-- Notes -->
      <div class="form-field full-width">
        <label>Notes</label>
        <div v-for="(note, index) in notes" :key="index" class="dynamic-input">
          <input v-model="note.text" type="text" class="form-input" placeholder="Enter a note..." />
        </div>
        <div class="notes-buttons" style="display:flex; gap:0.5rem; margin-top:0.5rem;">
          <Button class="p-button p-button-lg p-button-rounded p-button-primary" icon="pi pi-microphone" :label="isRecording ? 'Stop Recording' : 'Use Voice Transcription for Note'" @click="toggleVoiceRecording" />
          <Button class="p-button p-button-lg p-button-rounded p-button-primary" icon="pi pi-plus" label="Add another note" @click="addNoteField" />
        </div>
      </div>

      <!-- Next Steps -->
      <div class="form-field full-width">
        <label>Next Steps</label>
        <div v-for="(step, index) in nextSteps" :key="index" class="dynamic-input">
          <input v-model="step.text" class="form-input" placeholder="Enter a next step..." />
        </div>
<Button 
  class="p-button p-button-lg p-button-rounded p-button-primary" 
  icon="pi pi-plus" 
  label="Add another next step" 
  @click="addNextStepField" 
  style="margin-top:0.5rem; width: 50%;" 
/>
      </div>

      

<!-- Media -->
<div class="media-options" style="display: flex; align-items: center; gap: 0.5rem;">
  <div class="media-option" style="flex: 1; text-align: right;">
    <input type="file" id="imageUpload" accept="image/*" @change="handleImageUpload" style="display:none;" ref="imageInput" />
    <Button 
      class="p-button p-button-lg p-button-rounded p-button-primary" 
      icon="pi pi-image" 
      label="Upload Image" 
      @click.prevent="$refs.imageInput.click()" 
    />
  </div>

  <span style="flex: 0; text-align: center;">or</span>

  <div class="media-option" style="flex: 1; text-align: left;">
    <Button class="p-button p-button-lg p-button-rounded p-button-primary" icon="pi pi-camera" label="Take Photo" @click="openCamera" />
  </div>
</div>


<!-- Camera Modal -->
<div v-if="showCamera" class="camera-modal">
  <div class="camera-container">
    <video id="camera-preview" class="camera-preview" autoplay playsinline></video>
    <div class="camera-controls" style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
      <Button class="p-button p-button-lg p-button-rounded p-button-primary" label="📷 Capture" @click="capturePhoto" />
      <span style="text-align: center;">or</span>
      <Button class="p-button p-button-lg p-button-rounded p-button-secondary" label="✕ Close" @click="closeCamera" />
    </div>
  </div>
</div>




      <!-- Captured / Uploaded Photo -->
      <div v-if="capturedPhoto || imageFile" class="photo-preview">
        <img :src="capturedPhotoURL || imageFileURL" class="captured-image" />
        <Button class="p-button p-button-rounded p-button-secondary" label="✕ Remove" @click="() => { capturedPhoto = null; capturedPhotoURL = null; imageFile = null; imageFileURL = null }" style="margin-top:0.5rem;" />
      </div>

      <!-- Submit -->
      <div class="submit-section">
<Button 
  class="p-button p-button-rounded" 
  label="Save Contact" 
  type="submit"
  style="background-color: #065f46 !important; color: white !important; border-radius: 12px !important;"
/>

      </div>
    </form>
  </div>
</template>

<style scoped>
.p-button {
  font-size: 1.05rem;
  padding: 0.85rem 1.5rem;
}

::v-deep(.p-button-rounded) {
  border-radius: 12px !important; 
}


.p-button-primary {
  background-color: #4a90e2;
  color: white;
  border: none;
}

.p-button-primary:hover {
  background-color: #357abd;
}

.p-button-secondary {
  background-color: #dc2626;
  color: white;
  border: none;
}

.p-button-secondary:hover {
  background-color: #b91c1c;
}
::v-deep(.p-button-primary) {
  background-color: #4a90e2 !important;
  color: white !important;
  border: none !important;
}

::v-deep(.p-button-primary:hover) {
  background-color: #357abd !important;
}

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
  background-color: #fff;
}

.form-input:focus {
  outline: none;
  border-color: #4a90e2;
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

.camera-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.camera-container {
  max-width: 640px;
  width: 90%;
}

.camera-preview {
  width: 100%;
  border-radius: 12px;
  background-color: #000;
}

.camera-controls {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
}

.captured-image {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  display: block;
}

.submit-section {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .media-options {
    flex-direction: column;
  }
}

</style>
