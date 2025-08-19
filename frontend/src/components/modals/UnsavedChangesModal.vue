<template>
  <div v-if="show" class="modal-overlay" @click="$emit('cancel')">
    <div class="modal-content unsaved-changes-modal" @click.stop>
      <div class="modal-header">
        <h2>
          <Icon name="warning" size="sm" aria-label="Warning" />
          Unsaved Changes
        </h2>
        <button @click="$emit('cancel')" class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <p>You have unsaved changes in <strong>{{ fileName }}</strong>.</p>
        <p>What would you like to do?</p>
      </div>
      <div class="modal-footer unsaved-changes-actions">
        <button @click="$emit('save-and-switch')" class="btn btn-primary">
          <Icon name="save" size="xs" aria-label="Save" />
          Save & Switch
        </button>
        <button @click="$emit('discard-and-switch')" class="btn btn-warning">
          <Icon name="trash" size="xs" aria-label="Delete" />
          Discard Changes
        </button>
        <button @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue'

defineProps<{
  show: boolean
  fileName: string
}>()

defineEmits<{
  'save-and-switch': []
  'discard-and-switch': []
  'cancel': []
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.unsaved-changes-modal {
  max-width: 550px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0 0 12px 0;
  color: #374151;
  line-height: 1.5;
}

.modal-body p:last-child {
  margin-bottom: 0;
}

.modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #e5e7eb;
}

.unsaved-changes-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-icon {
  font-size: 16px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-warning {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn-warning:hover {
  background: #d97706;
  border-color: #d97706;
}

.btn-secondary {
  background: #f9fafb;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

@media (max-width: 768px) {
  .unsaved-changes-actions {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .modal-header {
    padding: 16px 20px 12px;
  }
  
  .modal-body {
    padding: 16px 20px;
  }
  
  .modal-footer {
    padding: 12px 20px 16px;
  }
}
</style>