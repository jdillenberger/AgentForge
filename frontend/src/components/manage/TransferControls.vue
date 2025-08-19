<template>
  <div v-if="availableNamespaces.length > 1" class="option-group access-group">
    <h5>🔑 Change Access</h5>
    <label for="moveToNamespace">Transfer to Permission Group:</label>
    <div class="transfer-controls">
      <select 
        id="moveToNamespace"
        :value="selectedMoveNamespace" 
        @change="$emit('update:selected-move-namespace', ($event.target as HTMLSelectElement).value)"
        class="form-select"
      >
        <option v-for="namespace in availableNamespaces" :key="namespace.id" :value="namespace.id">
          {{ namespace.name }} {{ namespace.isDefault ? '(default)' : '' }} {{ namespace.isUserNamespace ? '(private)' : '' }}
        </option>
      </select>
      <button 
        @click="$emit('transfer-file')" 
        :disabled="!canMoveFile"
        class="btn btn-primary transfer-btn"
      >
        Transfer Agent
      </button>
    </div>
    <div v-if="selectedMoveNamespace !== getCurrentNamespace(selectedFile)" class="transfer-info">
      <p>This will move the agent to the <strong>{{ getNamespaceById(selectedMoveNamespace)?.name }}</strong> permission group.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileInfo, NamespaceInfo } from '../../services/api'

const props = defineProps<{
  selectedFile: FileInfo | null
  availableNamespaces: NamespaceInfo[]
  selectedMoveNamespace: string
  canMoveFile: boolean
}>()

defineEmits<{
  'update:selected-move-namespace': [namespaceId: string]
  'transfer-file': []
}>()

// Helper functions
const getNamespaceFromPath = (path: string): string => {
  const parts = path.split('/')
  return parts.length > 1 ? parts[0] : 'default'
}

const getCurrentNamespace = (file: FileInfo | null): string => {
  if (!file) return ''
  return getNamespaceFromPath(file.path)
}

const getNamespaceById = (id: string): NamespaceInfo | undefined => {
  return props.availableNamespaces.find(ns => ns.id === id)
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

.option-group label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-800);
  font-size: var(--font-size-sm);
}

.transfer-controls {
  display: flex;
  gap: var(--spacing-3);
  align-items: center;
  margin-bottom: var(--spacing-2);
}

.form-select {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-white);
  transition: border-color var(--transition-normal);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.transfer-btn {
  flex-shrink: 0;
  min-width: 120px;
}

.transfer-info {
  padding: var(--spacing-2);
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.transfer-info p {
  margin: 0;
  color: var(--color-primary-dark);
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

.btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .transfer-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .transfer-btn {
    min-width: auto;
  }
}
</style>