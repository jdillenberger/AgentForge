<template>
  <div class="option-group namespace-group">
    <h5>
      <Icon name="info" size="sm" aria-label="Security" />
      Access Level
    </h5>
    <label>Permission Group:</label>
    <div class="namespace-display">
      <Icon :name="getNamespaceIcon(selectedFile)" size="sm" class="namespace-icon" />
      <span class="namespace-name">{{ getNamespaceName(selectedFile) }}</span>
      <span class="namespace-description">({{ getNamespaceDescription(selectedFile) }})</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue'
import type { FileInfo, NamespaceInfo } from '../../services/api'

const props = defineProps<{
  selectedFile: FileInfo | null
  availableNamespaces: NamespaceInfo[]
}>()

// Helper functions
const getNamespaceFromPath = (path: string): string => {
  const parts = path.split('/')
  return parts.length > 1 ? parts[0] : 'default'
}

const getNamespaceIcon = (file: FileInfo | null): string => {
  if (!file) return ''
  
  const namespace = getNamespaceFromPath(file.path)
  const namespaceInfo = props.availableNamespaces.find(ns => ns.id === namespace)
  
  if (!namespaceInfo) return 'info'
  
  if (namespaceInfo.isUserNamespace) return 'info'
  if (namespace === 'shared') return 'globe'
  return 'info'
}

const getNamespaceName = (file: FileInfo | null): string => {
  if (!file) return ''
  return getNamespaceFromPath(file.path)
}

const getNamespaceDescription = (file: FileInfo | null): string => {
  if (!file) return ''
  
  const namespace = getNamespaceFromPath(file.path)
  const namespaceInfo = props.availableNamespaces.find(ns => ns.id === namespace)
  
  if (!namespaceInfo) return namespace
  
  if (namespaceInfo.isUserNamespace) return 'Private'
  if (namespace === 'shared') return 'Public'
  return 'Team'
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

.namespace-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.namespace-icon {
  font-size: var(--font-size-lg);
}

.namespace-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
}

.namespace-description {
  color: var(--color-gray-600);
  font-style: italic;
}
</style>