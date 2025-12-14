<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCollection, useCurrentUser, useDocument } from 'vuefire'
import { db, storage } from '../firebase_conf'
import { doc, collection, addDoc, query, orderBy, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

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
  nextSteps: [],
  photoURL: ''
})

// Photo capture state
const showCamera = ref(false)
const capturedPhoto = ref(null)
const capturedPhotoURL = ref(null)
const videoStream = ref(null)
const oldPhotoURL = ref('')

const startEditing = () => {
  if (!contact.value) return
  
  edited.value = {
    name: contact.value.name || '',
    company: contact.value.company || '',
    title: contact.value.title || '',
    meetingPlace: contact.value.meetingPlace || '',
    dateMet: contact.value.dateMet || '',
    photoURL: contact.value.photoURL || '',
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

  oldPhotoURL.value = contact.value.photoURL || ''
  capturedPhoto.value = null
  capturedPhotoURL.value = null
  isEditing.value = true
}

const saveChanges = async () => {
  // Handle photo upload if new photo was captured
  if (capturedPhoto.value) {
    try {
      // Delete old photo
      if (oldPhotoURL.value) {
        const oldPhotoRef = storageRef(storage, oldPhotoURL.value)
        await deleteObject(oldPhotoRef).catch(() => {})
      }

      // Upload new photo
      const timestamp = Date.now()
      const photoRef = storageRef(storage, `photos/${user.value.uid}/${timestamp}.jpg`)
      await uploadBytes(photoRef, capturedPhoto.value)
      const photoURL = await getDownloadURL(photoRef)
      edited.value.photoURL = photoURL
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please check Firebase Storage rules.')
    }
  }

  await updateDoc(contactRef.value, {
    name: edited.value.name,
    company: edited.value.company,
    title: edited.value.title,
    meetingPlace: edited.value.meetingPlace,
    dateMet: edited.value.dateMet,
    photoURL: edited.value.photoURL
  })

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
  
  capturedPhoto.value = null
  capturedPhotoURL.value = null
  oldPhotoURL.value = ''
  isEditing.value = false
}

// Camera photo capture functions
const openCamera = async () => {
  try {
    showCamera.value = true;
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoStream.value = stream;
    
    const videoEl = document.getElementById('camera-preview-edit');
    if (videoEl) {
      videoEl.srcObject = stream;
      videoEl.play();
    }
  } catch (error) {
    showCamera.value = false;
    let errorMessage = 'Unable to access camera.\n\n';
    
    if (error.name === 'NotAllowedError') {
      errorMessage += 'Please allow camera access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'No camera found.';
    } else {
      errorMessage += error.message;
    }
    alert(errorMessage);
  }
};

const capturePhoto = () => {
  const videoEl = document.getElementById('camera-preview-edit');
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext('2d').drawImage(videoEl, 0, 0);
  
  canvas.toBlob((blob) => {
    capturedPhoto.value = blob;
    capturedPhotoURL.value = URL.createObjectURL(blob);
    closeCamera();
  }, 'image/jpeg');
};

const closeCamera = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop());
    videoStream.value = null;
  }
  showCamera.value = false;
};

// Notes
const notesRef = computed(() => {
  if (!user.value || !contactId.value) return null
  return query(collection(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'Notes'), orderBy('createdAt', 'desc'))
})
const notes = useCollection(notesRef)

// Next Steps
const stepsRef = computed(() => {
  if (!user.value || !contactId.value) return null
  return query(collection(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'NextSteps'), orderBy('createdAt', 'asc'))
})
const nextSteps = useCollection(stepsRef)

// Toggle step done
const toggleStepDone = async (step) => {
  const stepDoc = doc(db, 'Users', user.value.uid, 'Contacts', contactId.value, 'NextSteps', step.id)
  await updateDoc(stepDoc, { done: !step.done })
}

</script>

<template>
  <div class="contact-detail-container">
    <div v-if="contact" class="contact-detail-card">
      <div v-if="!isEditing" class="view-mode">
        <div class="detail-header">
          <h1 class="contact-detail-name">{{ contact.name || 'Unnamed Contact' }}</h1>
          <button @click="startEditing" class="edit-button">Edit</button>
        </div>

        <div class="detail-section">
          <div v-if="contact.company" class="detail-row">
            <span class="detail-label">Company:</span>
            <span class="detail-value">{{ contact.company }}</span>
          </div>
          
          <div v-if="contact.title" class="detail-row">
            <span class="detail-label">Title:</span>
            <span class="detail-value">{{ contact.title }}</span>
          </div>
          
          <div v-if="contact.meetingPlace" class="detail-row">
            <span class="detail-label">Meeting Place:</span>
            <span class="detail-value">{{ contact.meetingPlace }}</span>
          </div>
          
          <div v-if="contact.dateMet" class="detail-row">
            <span class="detail-label">Date Met:</span>
            <span class="detail-value">{{ contact.dateMet }}</span>
          </div>

          <!-- PHOTO -->
          <div v-if="contact.photoURL" class="detail-row photo-section">
            <span class="detail-label">Photo:</span>
            <div class="photo-container">
              <img :src="contact.photoURL" alt="Contact photo" class="contact-photo" />
            </div>
          </div>

          <!-- NEXT STEPS -->
          <div v-if="nextSteps" class="detail-row">
            <div v-for="step in nextSteps" :key="step.id">
              <label>
                <input type="checkbox" :checked="step.done" @change="toggleStepDone(step)" />
                <span class="detail-value" >{{ step.text }}</span>
              </label>
            </div>
          </div>

          <!-- NOTES -->
          <div v-if="notes" class="detail-row">
            <div v-for="note in notes" :key="note.id">
              <span class="detail-label">{{ note.day }}</span>
              <span class="detail-value">{{ note.text }}</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="router.push('/contacts')" class="back-button">Back to Contacts</button>
        </div>
      </div>

      <div v-else class="edit-mode">
        <h2 class="edit-title">Edit Contact</h2>
        
        <form @submit.prevent="saveChanges" class="edit-form">
          <div class="form-row">
            <div class="form-field">
              <label for="edit-name">Name</label>
              <input 
                id="edit-name"
                v-model="edited.name" 
                type="text" 
                class="form-input"
                required
              />
            </div>
            <div class="form-field">
              <label for="edit-company">Company</label>
              <input 
                id="edit-company"
                v-model="edited.company" 
                type="text" 
                class="form-input"
              />
            </div>
            <div class="form-field">
              <label for="edit-title">Title</label>
              <input 
                id="edit-title"
                v-model="edited.title" 
                type="text" 
                class="form-input"
              />
            </div>
          </div>

          <div class="form-field full-width">
            <label for="edit-meetingPlace">Meeting Place</label>
            <input 
              id="edit-meetingPlace"
              v-model="edited.meetingPlace" 
              type="text" 
              class="form-input"
            />
          </div>

          <div class="form-field full-width">
            <label for="edit-dateMet">Date Met</label>
            <input 
              id="edit-dateMet"
              v-model="edited.dateMet" 
              type="text" 
              class="form-input"
              placeholder="e.g. Nov 20, 2025"
            />
          </div>

          <div class="form-field full-width">
            <label>Notes</label>
            <div v-for="(note, i) in edited.notes" :key="note.id || i" class="dynamic-input">
              <input v-model="note.text" type="text" class="form-input" placeholder="Enter a note..." />
            </div>
            <button type="button" @click="edited.notes.push({ text: '' })">+ Add Note</button>
          </div>

          <div class="form-field full-width">
            <label>Next Steps</label>
            <div v-for="(step, i) in edited.nextSteps" :key="step.id || i" class="dynamic-input">
              <input v-model="step.text" type="text" class="form-input" placeholder="Enter next step..." />
              <label>
                <input type="checkbox" v-model="step.done" />
                Done
              </label>
            </div>
            <button type="button" @click="edited.nextSteps.push({ text: '', done: false })">+ Add Next Step</button>
          </div>

          <div class="form-field full-width">
            <label>Photo</label>
            <div class="photo-capture-section">
              <button 
                type="button" 
                @click="openCamera" 
                class="camera-button"
              >
                📷 Take New Photo
              </button>
              
              <div v-if="capturedPhoto" class="photo-preview-edit">
                <img :src="capturedPhotoURL" alt="Captured photo" class="captured-image-edit" />
                <p class="photo-status">✓ New photo captured (will replace existing on save)</p>
                <button type="button" @click="capturedPhoto = null; capturedPhotoURL = null" class="remove-photo-btn">✕ Remove</button>
              </div>

              <div v-else-if="edited.photoURL" class="current-photo-info">
                <p>Current photo will be kept unless you take a new one</p>
                <img :src="edited.photoURL" alt="Current photo" style="width: 100%; max-width: 400px; border-radius: 8px;" />
              </div>
            </div>
          </div>

          <!-- Camera Preview Modal -->
          <div v-if="showCamera" class="camera-modal">
            <div class="camera-container-edit">
              <video id="camera-preview-edit" class="camera-preview-edit" autoplay playsinline></video>
              <div class="camera-controls-edit">
                <button type="button" @click="capturePhoto" class="capture-button-edit">📷 Capture</button>
                <button type="button" @click="closeCamera" class="close-button-edit">✕ Close</button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="save-button">Save</button>
            <button type="button" @click="isEditing = false" class="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-else class="loading-state">
      <p>Loading contact...</p>
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
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.edit-button:hover {
  background-color: #357abd;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-label {
  font-weight: 500;
  color: #333;
  min-width: 150px;
}

.detail-value {
  color: #666;
  flex: 1;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
}

.section-content {
  color: #666;
  line-height: 1.6;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 0;
}

.action-buttons {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.back-button {
  padding: 0.75rem 1.5rem;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.edit-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
}

.edit-form {
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

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.save-button {
  padding: 0.875rem 2rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.save-button:hover {
  background-color: #357abd;
}

.cancel-button {
  padding: 0.875rem 2rem;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.photo-section {
  flex-direction: column;
  align-items: flex-start;
}

.photo-container {
  width: 100%;
  margin-top: 0.5rem;
}

.contact-photo {
  width: 100%;
  max-width: 600px;
  border-radius: 8px;
}

.photo-capture-section {
  margin-top: 0.5rem;
}

.camera-button {
  padding: 0.75rem 1.5rem;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.camera-button:hover {
  background-color: #047857;
}

.photo-preview-edit {
  margin-top: 1rem;
}

.captured-image-edit {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  display: block;
}

.photo-status {
  color: #059669;
  font-weight: 500;
  margin-top: 0.5rem;
}

.remove-photo-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.remove-photo-btn:hover {
  background-color: #b91c1c;
}

.current-photo-info {
  margin-top: 1rem;
}

.current-photo-info p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
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

.camera-container-edit {
  max-width: 640px;
  width: 90%;
}

.camera-preview-edit {
  width: 100%;
  border-radius: 12px;
  background-color: #000;
}

.camera-controls-edit {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
}

.capture-button-edit {
  padding: 1rem 2rem;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
}

.capture-button-edit:hover {
  background-color: #047857;
}

.close-button-edit {
  padding: 1rem 2rem;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
}

.close-button-edit:hover {
  background-color: #b91c1c;
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
    gap: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .detail-label {
    min-width: auto;
  }
}
</style>