<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content delete-modal" @click.stop>
      <div class="modal-header">
        <h3>Confirm Delete</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete <strong>{{ fileToDelete?.displayName }}</strong>?</p>
        <p class="delete-warning">This action cannot be undone.</p>
      </div>
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Cancel</button>
        <button @click="$emit('confirm')" class="btn btn-danger">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileInfo } from '../../services/api'

defineProps<{
  show: boolean
  fileToDelete: FileInfo | null
}>()

defineEmits<{
  'close': []
  'confirm': []
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
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.delete-modal {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 20px 24px;
}

.delete-warning {
  color: #dc2626;
  font-size: 0.9em;
  margin-top: 8px;
  font-style: italic;
}

.modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: 1px solid #dc2626;
}

.btn-danger:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}
</style>