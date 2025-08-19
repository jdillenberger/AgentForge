<template>
  <div class="agent-file-header">
    <div class="file-info-section">
      <div class="file-title-row">
        <span 
          class="file-namespace-badge" 
          :class="`namespace-${namespaceType}`" 
          :title="namespaceTooltip"
        >
          <Icon :name="namespaceIcon" size="sm" />
        </span>
        <h2>
          {{ agentFile.displayName }}
        </h2>
      </div>
      <div class="file-metadata">
        <span v-if="agentFile.schemaType" class="badge badge-primary">
          {{ agentFile.schemaType }}
        </span>
      </div>
    </div>
    <div class="header-actions">
      <button 
        @click="$emit('help')" 
        class="btn btn-secondary help-btn" 
        title="Help & Documentation"
      >
        <Icon name="help-circle" size="sm" aria-label="Help" />
      </button>
      <button 
        @click="$emit('save')" 
        class="btn save-button" 
        :class="saveButtonClasses"
        :disabled="saving || !hasUnsavedChanges"
      >
        <Icon :name="saveIconName" size="sm" class="save-icon" />
        {{ saveText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../ui/Icon.vue'
import type { FileInfo, NamespaceInfo } from '../../services/api'

const props = defineProps<{
  agentFile: FileInfo
  hasUnsavedChanges: boolean
  saving: boolean
  saved: boolean
  availableNamespaces: NamespaceInfo[]
}>()

defineEmits<{
  save: []
  help: []
}>()

// Helper functions
const getNamespaceFromPath = (filePath: string): string => {
  const pathParts = filePath.split('/')
  return pathParts.length > 1 ? pathParts[0] : 'shared'
}

const getNamespaceIcon = (file: FileInfo): string => {
  const namespace = getNamespaceFromPath(file.path)
  const namespaceInfo = props.availableNamespaces.find(ns => ns.id === namespace)
  
  if (!namespaceInfo) return 'info' // Default access icon
  
  if (namespaceInfo.isUserNamespace) return 'info' // User-only file
  if (namespace === 'shared') return 'globe' // Public/shared file
  return 'info' // Group-shared file
}

const getNamespaceTooltip = (file: FileInfo): string => {
  const namespace = getNamespaceFromPath(file.path)
  const namespaceInfo = props.availableNamespaces.find(ns => ns.id === namespace)
  
  if (!namespaceInfo) return `Namespace: ${namespace}`
  
  if (namespaceInfo.isUserNamespace) return 'Private access'
  if (namespace === 'shared') return 'Public access'
  return `Team access (${namespace})`
}

const getNamespaceType = (file: FileInfo): string => {
  const namespace = getNamespaceFromPath(file.path)
  if (namespace === 'shared') return 'public'
  const namespaceInfo = props.availableNamespaces.find(ns => ns.id === namespace)
  if (namespaceInfo?.isUserNamespace) return 'private'
  return 'group'
}

// Computed properties
const namespaceIcon = computed(() => getNamespaceIcon(props.agentFile))
const namespaceTooltip = computed(() => getNamespaceTooltip(props.agentFile))
const namespaceType = computed(() => getNamespaceType(props.agentFile))

const saveButtonClasses = computed(() => ({
  'btn-primary': props.hasUnsavedChanges,
  'btn-warning': props.saving,
  'btn-success': !props.hasUnsavedChanges && !props.saving,
  'save-pulse': props.hasUnsavedChanges
}))

const saveIconName = computed(() => {
  if (props.saving) return 'loading'
  if (props.hasUnsavedChanges) return 'save'
  return 'success'
})

const saveText = computed(() => {
  if (props.saving) return 'Saving...'
  if (props.hasUnsavedChanges) return 'Save Changes'
  return 'Saved'
})
</script>

<style scoped>
.agent-file-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-4);
  padding-bottom: 0;
  background: linear-gradient(135deg, var(--color-white) 0%, #f8fafc 100%);
  margin-bottom: var(--spacing-4);
  gap: var(--spacing-4);
  flex-shrink: 0;
  position: relative;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: slideInFromTop 0.4s ease-out;
  transition: all var(--transition-normal);
}

.agent-file-header::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-gray-200) 50%, transparent 100%);
}

.file-info-section {
  flex: 1;
  min-width: 0;
}

.file-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.file-namespace-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  transition: all var(--transition-normal);
  cursor: help;
  animation: fadeInScale 0.5s ease-out 0.2s both;
  position: relative;
  overflow: hidden;
}

.file-namespace-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.file-namespace-badge:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.file-namespace-badge:hover::before {
  opacity: 1;
}

.file-namespace-badge.namespace-public {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.file-namespace-badge.namespace-private {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.file-namespace-badge.namespace-group {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.file-title-row h2 {
  margin: 0;
  color: var(--color-gray-900);
  font-family: var(--font-display);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-display-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  animation: slideInFromLeft 0.5s ease-out 0.1s both;
  transition: all var(--transition-normal);
}

.file-title-row h2:hover {
  transform: translateX(2px);
  color: #1e40af;
}

.file-metadata {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  flex-shrink: 0;
  animation: slideInFromRight 0.5s ease-out 0.3s both;
}

.help-btn {
  animation: fadeInScale 0.4s ease-out 0.4s both;
  transition: all var(--transition-normal);
}

.help-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.save-button {
  min-width: 120px;
  animation: fadeInScale 0.4s ease-out 0.5s both;
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.save-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s ease;
}

.save-button:hover::before {
  left: 100%;
}

.save-button.btn-warning {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: var(--color-gray-900);
}

.save-button.btn-warning:hover:not(:disabled) {
  background: var(--color-warning-hover);
  border-color: var(--color-warning-hover);
}

.save-pulse {
  animation: save-pulse 3s ease-in-out infinite;
}

@keyframes save-pulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  50% { 
    transform: scale(1.01);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
  }
}

.help-btn {
  margin-right: var(--spacing-3);
}


.unsaved-indicator {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  margin-left: var(--spacing-2);
  font-weight: var(--font-weight-bold);
}

.badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-primary {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .agent-file-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
    padding: 0.75rem;
  }
  
  .file-title-row {
    justify-content: center;
    text-align: center;
  }
  
  .file-metadata {
    justify-content: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .file-namespace-badge {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.9rem;
  }
  
  .file-title-row h2 {
    font-size: var(--font-size-lg);
  }
  
  .save-button {
    min-width: 100px;
    padding: 0.5rem 0.75rem;
    font-size: var(--font-size-xs);
  }
}

/* Component animations */
@keyframes slideInFromTop {
  from { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slideInFromLeft {
  from { 
    opacity: 0; 
    transform: translateX(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes slideInFromRight {
  from { 
    opacity: 0; 
    transform: translateX(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes fadeInScale {
  from { 
    opacity: 0; 
    transform: scale(0.8); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}
</style>