<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCollection, useCurrentUser } from 'vuefire'
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db, storage } from '../firebase_conf'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import { getToken } from 'firebase/messaging'
import { messaging } from '../firebase_conf'

const router = useRouter()
const route = useRoute()
const user = useCurrentUser()

// Contacts
const userContactsRef = computed(() => {
  if (!user.value) return null
  return query(collection(db, 'Users', user.value.uid, 'Contacts'), orderBy('createdAt', 'desc'))
})

const contacts = useCollection(userContactsRef, { ssrKey: 'contacts' })

// Get search query from route
const searchQuery = computed(() => route.query.search || '')

// Filter contacts based on search query
const filteredContacts = computed(() => {
  if (!contacts.value || !searchQuery.value) {
    return contacts.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return contacts.value.filter(contact => {
    const name = (contact.name || '').toLowerCase()
    const company = (contact.company || '').toLowerCase()
    const title = (contact.title || '').toLowerCase()
    const meetingPlace = (contact.meetingPlace || '').toLowerCase()
    const dateMet = (contact.dateMet || '').toLowerCase()
    
    return name.includes(query) || 
           company.includes(query) || 
           title.includes(query) || 
           meetingPlace.includes(query) || 
           dateMet.includes(query)
  })
})

const deleteContact = async (contactId) => {
  if (!user.value) return

  const contactDoc = doc(
    db,
    'Users',
    user.value.uid,
    'Contacts',
    contactId
  )

  // Get the contact data to check if it has a photo
  const contactSnapshot = await getDoc(contactDoc)
  if (contactSnapshot.exists()) {
    const contactData = contactSnapshot.data()
    
    // Delete photo from Storage if it exists
    if (contactData.photoURL) {
      try {
        const photoRef = storageRef(storage, contactData.photoURL)
        await deleteObject(photoRef)
      } catch (error) {
        console.log('Could not delete photo:', error)
      }
    }
  }

  await deleteDoc(contactDoc)
}

// Goals
const userGoals = computed(() => {
  if (!user.value) return null
  return query(collection(db, 'Users', user.value.uid, 'Goals'), orderBy('createdAt', 'desc'))
})

const goals = useCollection(userGoals, { ssrKey: 'goals' })

const newGoalText = ref('')

// Add goal
const addGoal = async () => {
  if (!user.value || !newGoalText.value.trim()) return
  
  const goalsCollection = collection(db, 'Users', user.value.uid, 'Goals')
  await addDoc(goalsCollection, {
    text: newGoalText.value.trim(),
    completed: false,
    createdAt: new Date()
  })
  
  newGoalText.value = ''
}

// check goal
const toggleGoalComplete = async (goal) => {
  if (!user.value) return
  const goalDoc = doc(db, 'Users', user.value.uid, 'Goals', goal.id)
  await updateDoc(goalDoc, { 
    completed: !goal.completed 
  })
}

// Delete goal
const deleteGoal = async (goalId) => {
  if (!user.value) return
  const goalDoc = doc(db, 'Users', user.value.uid, 'Goals', goalId)
  await deleteDoc(goalDoc)
}

const progressPercentage = computed(() => {
  if (!goals.value || goals.value.length === 0) return 0
  const completedCount = goals.value.filter(g => g.completed).length
  return Math.round((completedCount / goals.value.length) * 100)
})

</script>

<template>
  <div class="pure-g contacts-container">
    <div class="pure-u-1">
      <!-- Goals Section: Display and manage user's goals -->
      <div class="pure-g goals-section">
        <div class="pure-u-1">
          <h2 class="section-title">Goals</h2>
          
          <!-- Show goals if any exist -->
          <div v-if="goals && goals.length > 0">
            <!-- List of all goals -->
            <div class="goals-list">
              <!-- Individual goal item with checkbox, text, and delete button -->
              <div 
                v-for="goal in goals" 
                :key="goal.id" 
                class="goal-item pure-g"
                :class="{ 'completed': goal.completed }"
              >
                <div class="pure-u-1-24">
                  <input 
                    type="checkbox" 
                    :checked="goal.completed" 
                    @change="toggleGoalComplete(goal)"
                    class="goal-checkbox"
                  />
                </div>
                <div class="pure-u-21-24">
                  <span class="goal-text">{{ goal.text }}</span>
                </div>
                <div class="pure-u-2-24">
                  <button @click="deleteGoal(goal.id)" class="pure-button delete-btn">
                    <span class="delete-icon">-</span>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Progress bar showing completion percentage -->
            <div class="progress-section">
              <div class="pure-g progress-header">
                <div class="pure-u-1-2">
                  <span class="progress-label">Progress</span>
                </div>
                <div class="pure-u-1-2" style="text-align: right;">
                  <span class="progress-percentage">{{ progressPercentage }}%</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
            </div>
          </div>
          
          <!-- Form to add a new goal -->
          <form @submit.prevent="addGoal" class="pure-form pure-form-inline add-goal-form">
            <input 
              v-model="newGoalText"
              type="text" 
              placeholder="Add a new goal..."
              class="pure-input-1 goal-input"
            />
            <button type="submit" class="pure-button pure-button-primary add-btn">+</button>
          </form>
        </div>
      </div>

    <h1 class="contacts-title">Your Contacts</h1>

      <!-- Empty state when no contacts exist -->
      <div v-if="!filteredContacts || filteredContacts.length === 0" class="empty-state">
        <p v-if="searchQuery">No contacts found matching "{{ searchQuery }}". <router-link to="/add">Add a new contact</router-link></p>
        <p v-else>No contacts yet. <router-link to="/add">Add your first contact</router-link></p>
      </div>

      <!-- List of contacts -->
      <div v-else class="pure-g contacts-list">
        <!-- Individual contact card -->
        <div 
          v-for="c in filteredContacts" 
          :key="c.id" 
          class="pure-u-1 contact-card"
        >
        <img
          v-if="c.businessCardUrl"
          :src="c.businessCardUrl"
          alt="Business card"
          style="
            width: 100px;
            height: 100px;
            max-width: 100px;
            max-height: 100px;
            object-fit: cover;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            display: block;
          "
        />


          <div class="contact-header">
            <router-link :to="`/contact/${c.id}`" class="contact-name">
              {{ c.name || 'Unnamed Contact' }}
            </router-link>

            <button
              class="pure-button delete-btn"
              @click="deleteContact(c.id)"
            >
              -
            </button>
          </div>
          
          <!-- Contact details -->
          <div class="contact-details">
            <div v-if="c.company" class="pure-g contact-detail-item">
              <div class="pure-u-1-4">
                <span class="detail-label">Company:</span>
              </div>
              <div class="pure-u-3-4">
                <span class="detail-value">{{ c.company }}</span>
              </div>
            </div>
            
            <div v-if="c.title" class="pure-g contact-detail-item">
              <div class="pure-u-1-4">
                <span class="detail-label">Title:</span>
              </div>
              <div class="pure-u-3-4">
                <span class="detail-value">{{ c.title }}</span>
              </div>
            </div>
            
            <div v-if="c.meetingPlace" class="pure-g contact-detail-item">
              <div class="pure-u-1-4">
                <span class="detail-label">Meeting Place:</span>
              </div>
              <div class="pure-u-3-4">
                <span class="detail-value">{{ c.meetingPlace }}</span>
              </div>
            </div>
            
            <div v-if="c.dateMet" class="pure-g contact-detail-item">
              <div class="pure-u-1-4">
                <span class="detail-label">Date Met:</span>
              </div>
              <div class="pure-u-3-4">
                <span class="detail-value">{{ c.dateMet }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contacts-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fafafa;
  min-height: calc(100vh - 100px);
}

.goals-section {
  background-color: #e8e8e8;
  padding: 2rem;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
}

.goals-list {
  margin-bottom: 1.5rem;
}

.goal-item {
  background-color: white;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid #d1d5db;
  align-items: center;
}

.goal-item.completed {
  opacity: 0.6;
}

.goal-item.completed .goal-text {
  text-decoration: line-through;
}

.goal-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.goal-text {
  color: #1a1a1a;
  font-size: 1rem;
  padding: 0.5rem;
}

.delete-btn {
  background-color: #ef4444;
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  padding: 0;
}

.delete-btn:hover {
  background-color: #dc2626;
}

.delete-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.add-goal-form {
  margin-top: 1rem;
}

.goal-input {
  margin-right: 0.5rem;
}

.add-btn {
  width: 48px;
  height: 48px;
  font-size: 2rem;
  padding: 0;
}

.progress-section {
  margin-top: 1.5rem;
}

.progress-header {
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
}

.progress-percentage {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0078e7;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #d1d5db;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #0078e7;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.contacts-title {
  font-size: 2rem;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state a {
  color: #0078e7;
  text-decoration: none;
}

.empty-state a:hover {
  text-decoration: underline;
}

.contacts-list {
  margin-top: 1.5rem;
}

.contact-card {
  background-color: white;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.contact-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0078e7;
  text-decoration: none;
}

.contact-name:hover {
  color: #005aad;
  text-decoration: underline;
}

.contact-details {
  margin-top: 0.75rem;
}

.contact-detail-item {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.detail-label {
  font-weight: 500;
  color: #333;
}

.detail-value {
  color: #666;
}

@media (max-width: 768px) {
  .contacts-container {
    padding: 1rem;
  }
  
  .goals-section {
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .contact-card {
    padding: 1rem;
  }
  
  .contact-name {
    font-size: 1.25rem;
  }
.contact-image {
  display: block;
  width: 64px !important;
  height: 64px !important;
  max-width: 64px !important;
  max-height: 64px !important;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.75rem;
}




}
</style>
