<template>
  <div class="option-group danger-zone">
    <h5>
      <Icon name="warning" size="sm" aria-label="Warning" />
      Danger Zone
    </h5>
    <button @click="$emit('delete-agent')" class="btn btn-danger">
      <Icon name="trash" size="sm" aria-label="Delete" />
      Delete Agent
    </button>
    <p class="danger-warning">This action cannot be undone.</p>
  </div>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue'

defineEmits<{
  'delete-agent': []
}>()
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

.danger-zone {
  border-color: var(--color-danger);
  background: var(--color-danger-light);
}

.danger-zone h5 {
  margin: 0 0 var(--spacing-3) 0;
  color: var(--color-danger-dark);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.danger-warning {
  margin: var(--spacing-2) 0 0 0;
  color: var(--color-danger-dark);
  font-size: var(--font-size-sm);
  font-style: italic;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  min-height: 2.5rem;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-hover);
  border-color: var(--color-danger-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
</style>