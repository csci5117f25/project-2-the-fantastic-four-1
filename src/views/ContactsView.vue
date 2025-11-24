<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCollection, useCurrentUser } from 'vuefire'
import { collection, query, orderBy } from 'firebase/firestore'
import {db} from '../firebase_conf'

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

</script>

<template>
  <div class="contacts-container">
    <h1 class="contacts-title">Your Contacts</h1>

    <div v-if="!contacts || contacts.length === 0" class="empty-state">
      <p>No contacts yet. <router-link to="/add">Add your first contact</router-link></p>
    </div>

    <div v-else class="contacts-list">
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
          
          <div v-if="c.notes" class="contact-detail-item">
            <span class="detail-label">Notes:</span>
            <span class="detail-value">{{ c.notes }}</span>
          </div>
          
          <div v-if="c.nextSteps" class="contact-detail-item">
            <span class="detail-label">Next Steps:</span>
            <span class="detail-value">{{ c.nextSteps }}</span>
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
