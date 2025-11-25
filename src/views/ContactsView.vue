<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCollection, useCurrentUser } from 'vuefire'
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore'
import {db} from '../firebase_conf'

const router = useRouter()
const user = useCurrentUser()

// Contacts
const userContactsRef = computed(() => {
  if (!user.value) return null
  return collection(db, 'Users', user.value.uid, 'Contacts')
})

const contacts = useCollection(computed(() => {
  if (!userContactsRef.value) return null
  return query(userContactsRef.value, orderBy('createdAt', 'desc'))
}))

// Goals
const userGoals = computed(() => {
  if (!user.value) return null
  return collection(db, 'Users', user.value.uid, 'Goals')
})

const goals = useCollection(computed(() => {
  if (!userGoals.value) return null
  return query(userGoals.value, orderBy('createdAt', 'desc'))
}))

const newGoalText = ref('')

// Add goal
const addGoal = async () => {
  if (!user.value || !newGoalText.value.trim()) return
  
  await addDoc(userGoals.value, {
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
  <div class="contacts-container">
    <!-- Goals Section: Display and manage user's goals -->
    <div class="goals-section">
      <h2 class="section-title">Goals</h2>
      
      <!-- Show goals if any exist -->
      <div v-if="goals && goals.length > 0">
        <!-- List of all goals -->
        <div class="goals-list">
          <!-- Individual goal item with checkbox, text, and delete button -->
          <div 
            v-for="goal in goals" 
            :key="goal.id" 
            class="goal-item"
            :class="{ 'completed': goal.completed }"
          >
            <!-- Checkbox to mark goal as complete/incomplete -->
            <input 
              type="checkbox" 
              :checked="goal.completed" 
              @change="toggleGoalComplete(goal)"
              class="goal-checkbox"
            />
            <!-- Goal text -->
            <span class="goal-text">{{ goal.text }}</span>
            <!-- Delete button with minus icon -->
            <button @click="deleteGoal(goal.id)" class="delete-btn">
              <span class="delete-icon">−</span>
            </button>
          </div>
        </div>
        
        <!-- Progress bar showing completion percentage -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-percentage">{{ progressPercentage }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
        </div>
      </div>
      
      <!-- Form to add a new goal -->
      <form @submit.prevent="addGoal" class="add-goal-form">
        <input 
          v-model="newGoalText"
          type="text" 
          placeholder="Add a new goal..."
          class="goal-input"
        />
        <button type="submit" class="add-btn">+</button>
      </form>
    </div>

    <h1 class="contacts-title">Your Contacts</h1>

    <!-- Empty state when no contacts exist -->
    <div v-if="!contacts || contacts.length === 0" class="empty-state">
      <p>No contacts yet. <router-link to="/add">Add your first contact</router-link></p>
    </div>

    <!-- List of contacts -->
    <div v-else class="contacts-list">
      <!-- Individual contact card -->
      <div 
        v-for="c in contacts" 
        :key="c.id" 
        class="contact-card"
      >
        <div class="contact-header">
          <router-link :to="`/contact/${c.id}`" class="contact-name">
            {{ c.name || 'Unnamed Contact' }}
          </router-link>
        </div>
        
        <!-- Contact details -->
        <div class="contact-details">
          <div v-if="c.company" class="contact-detail-item">
            <span class="detail-label">Company:</span>
            <span class="detail-value">{{ c.company }}</span>
          </div>
          
          <div v-if="c.title" class="contact-detail-item">
            <span class="detail-label">Title:</span>
            <span class="detail-value">{{ c.title }}</span>
          </div>
          
          <div v-if="c.meetingPlace" class="contact-detail-item">
            <span class="detail-label">Meeting Place:</span>
            <span class="detail-value">{{ c.meetingPlace }}</span>
          </div>
          
          <div v-if="c.dateMet" class="contact-detail-item">
            <span class="detail-label">Date Met:</span>
            <span class="detail-value">{{ c.dateMet }}</span>
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
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.goal-item {
  background-color: white;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  border: 1px solid #d1d5db;
  position: relative;
}

.goal-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  accent-color: #6366f1;
  flex-shrink: 0;
}

.goal-text {
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 400;
  flex: 1;
}

.delete-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background-color: #dc2626;
}

.delete-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.add-goal-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.goal-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
}

.goal-input:focus {
  outline: none;
  border-color: #6366f1;
}

.add-btn {
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.add-btn:hover {
  background-color: #4f46e5;
}

.progress-section {
  margin-top: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
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
  color: #6366f1;
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
  background-color: #6366f1;
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
  color: #4a90e2;
  text-decoration: none;
}

.empty-state a:hover {
  text-decoration: underline;
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-card {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.contact-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.contact-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.contact-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4a90e2;
  text-decoration: none;
}

.contact-name:hover {
  color: #357abd;
  text-decoration: underline;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-detail-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  line-height: 1.6;
}

.detail-label {
  font-weight: 500;
  color: #333;
  min-width: 120px;
}

.detail-value {
  color: #666;
  flex: 1;
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
  
  .goal-text {
    font-size: 1rem;
  }
  
  .contact-card {
    padding: 1rem;
  }
  
  .contact-name {
    font-size: 1.25rem;
  }
  
  .detail-label {
    min-width: 100px;
  }
}
</style>
