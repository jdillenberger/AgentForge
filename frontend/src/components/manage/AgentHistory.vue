<template>
  <div class="option-group history-group">
    <h5>
      <Icon name="history" size="sm" aria-label="History" />
      Agent History
    </h5>
    <div v-if="loadingHistory" class="loading-history">Loading agent history...</div>
    <div v-else-if="historyError" class="error-history">{{ historyError }}</div>
    <div v-else-if="fileHistory.length === 0" class="no-history">No history available</div>
    <div v-else class="history-list">
      <div 
        v-for="entry in fileHistory" 
        :key="entry.sha" 
        class="history-entry"
      >
        <div class="history-header">
          <span class="commit-sha">{{ entry.commit }}</span>
          <span class="commit-date">{{ formatDate(entry.author.date) }}</span>
        </div>
        <div class="commit-message">{{ entry.message }}</div>
        <div class="commit-author">by {{ entry.author.name }}</div>
        <div class="history-actions">
          <button 
            @click="$emit('load-version', entry.sha)" 
            class="btn btn-sm btn-outline"
            :disabled="entry.sha === currentSha"
          >
            {{ entry.sha === currentSha ? 'Current Version' : 'Load This Version' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue'
import type { FileHistoryEntry } from '../../services/api'

defineProps<{
  loadingHistory: boolean
  historyError: string | null
  fileHistory: FileHistoryEntry[]
  currentSha: string | null
}>()

defineEmits<{
  'load-version': [sha: string]
}>()

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.option-group {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.option-group h5 {
  margin: 0 0 var(--spacing-3) 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.loading-history,
.error-history,
.no-history {
  padding: var(--spacing-4);
  text-align: center;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
}

.error-history {
  color: var(--color-danger);
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
}

.history-entry {
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-white);
  transition: background-color var(--transition-normal);
}

.history-entry:last-child {
  border-bottom: none;
}

.history-entry:hover {
  background: var(--color-gray-50);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-1);
}

.commit-sha {
  font-family: var(--font-code);
  font-size: var(--font-size-xs);
  background: var(--color-gray-100);
  padding: 2px var(--spacing-1);
  border-radius: var(--radius-sm);
  color: var(--color-gray-700);
}

.commit-date {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.commit-message {
  font-size: var(--font-size-sm);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-1);
  line-height: var(--line-height-normal);
}

.commit-author {
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-2);
}

.history-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-3);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  min-height: 2rem;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  min-height: 1.75rem;
}

.btn-outline {
  background: var(--color-white);
  border-color: var(--color-gray-300);
  color: var(--color-gray-700);
}

.btn-outline:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
  transform: translateY(-1px);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
  }
  
  .commit-date {
    order: -1;
  }
  
  .history-actions {
    justify-content: center;
    margin-top: var(--spacing-2);
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>