<template>
  <div class="editor-sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title-row">
        <h3>AI Agents</h3>
        <div class="header-actions">
          <button @click="showSidebarOptions = !showSidebarOptions" class="options-btn" title="View options">
            <Icon name="settings" size="sm" aria-label="Options" />
          </button>
          <button @click="$emit('create-agent')" class="create-btn" title="Create new agent">+</button>
        </div>
      </div>
      
      <!-- Search Bar -->
      <div class="search-container">
        <div class="search-input-wrapper">
          <Icon name="search" size="sm" class="search-icon" aria-label="Search" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search agents..."
            class="search-input"
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="clear-search"
            title="Clear search"
          >
            <Icon name="clear" size="xs" aria-label="Clear search" />
          </button>
        </div>
      </div>
      
      <!-- Options Panel -->
      <div v-if="showSidebarOptions" class="sidebar-options">
        <div class="sidebar-option-group">
          <label class="sidebar-option-label">Sort by:</label>
          <select v-model="sortBy" class="sidebar-option-select">
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="date">Date</option>
          </select>
        </div>
        <div class="sidebar-option-group">
          <label class="sidebar-option-label">Group by:</label>
          <select v-model="groupBy" class="sidebar-option-select">
            <option value="none">None</option>
            <option value="namespace">Namespace</option>
            <option value="type">Schema Type</option>
          </select>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="sidebar-loading">
      <div class="loading-skeleton">
        <div class="skeleton-card" v-for="i in 3" :key="i">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-subtitle"></div>
          </div>
        </div>
      </div>
      <div class="loading-text">
        <div class="loading-spinner"></div>
        <span>Loading your agents...</span>
      </div>
    </div>
    <div v-else-if="error" class="sidebar-error">
      <div class="error-content">
        <div class="error-icon">
          <Icon name="warning" size="xl" aria-label="Error" />
        </div>
        <div class="error-details">
          <h4>Oops! Something went wrong</h4>
          <p>{{ error }}</p>
          <button @click="$emit('retry')" class="retry-btn">
            <Icon name="refresh" size="sm" aria-label="Retry" />
            Try Again
          </button>
        </div>
      </div>
    </div>
    <div v-else-if="filteredFiles.length === 0" class="no-files">
      <div class="empty-state">
        <div class="empty-illustration">
          <Icon v-if="hasAgents" name="robot" size="2xl" class="empty-robot" aria-label="Robot" />
          <div v-if="hasAgents" class="empty-sparkles">
            <div class="sparkle sparkle-1">✨</div>
            <div class="sparkle sparkle-2">⭐</div>
            <div class="sparkle sparkle-3">💫</div>
          </div>
        </div>
        <div class="empty-content">
          <h3>{{ searchQuery ? 'No matches found' : 'Ready to create your first AI agent?' }}</h3>
          <p>{{ searchQuery ? 'Try adjusting your search terms or clear the search to see all agents.' : 'Get started by creating your first AI agent configuration.' }}</p>
          <div class="empty-actions">
            <button v-if="searchQuery" @click="searchQuery = ''" class="btn btn-secondary">
              <Icon name="clear" size="sm" aria-label="Clear search" />
              Clear Search
            </button>
            <button @click="$emit('create-agent')" class="btn btn-primary">
              <Icon name="create" size="sm" aria-label="Create agent" />
              Create Agent
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="file-groups">
      <div 
        v-for="(groupFiles, groupName) in groupedFiles" 
        :key="groupName"
        class="file-group"
      >
        <div v-if="groupBy !== 'none'" class="group-header">
          <Icon :name="getGroupIcon(groupName)" size="sm" class="group-icon" />
          <span class="group-name">{{ groupName }}</span>
          <span class="group-count">{{ groupFiles.length }}</span>
        </div>
        
        <div class="file-cards">
          <div 
            v-for="file in groupFiles" 
            :key="file.path"
            :class="{ 
              active: selectedFile?.path === file.path,
              'has-unsaved-changes': selectedFile?.path === file.path && hasUnsavedChanges
            }"
            class="file-card"
            @click="$emit('select-file', file)"
          >
            <div class="file-card-header">
              <div class="file-actions">
                <button 
                  v-if="!file.isValidFormat" 
                  class="warning-btn" 
                  title="Filename doesn't follow name.schemaType.md format"
                >
                  <Icon name="warning" size="xs" aria-label="Invalid format" />
                </button>
              </div>
            </div>
            
            <div class="file-card-content">
              <div class="file-name-row">
                <span class="namespace-icon" :title="getNamespaceTooltip(file)">
                  <Icon :name="getNamespaceIcon(file)" size="xs" :aria-label="getNamespaceTooltip(file)" />
                </span>
                <div class="file-name" :title="file.displayName">{{ file.displayName }}</div>
              </div>
              <div class="file-meta">
                <span v-if="file.schemaType" class="schema-badge" :class="`schema-${file.schemaType}`">
                  {{ file.schemaType }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from '../ui/Icon.vue'
import type { FileInfo, NamespaceInfo } from '../../services/api'

const props = defineProps<{
  files: FileInfo[]
  selectedFile: FileInfo | null
  hasUnsavedChanges: boolean
  loading: boolean
  error: string | null
  availableNamespaces: NamespaceInfo[]
}>()

defineEmits<{
  'create-agent': []
  'select-file': [file: FileInfo]
  'retry': []
  'clear-search': []
}>()

// Local state
const searchQuery = ref('')
const sortBy = ref<'name' | 'date' | 'type'>('name')
const groupBy = ref<'none' | 'namespace' | 'type'>('namespace')
const showSidebarOptions = ref(false)
const hasAgents = computed(() => props.files.length > 0)

// Computed properties
const filteredFiles = computed(() => {
  let filtered = props.files

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(file => 
      file.displayName.toLowerCase().includes(query) ||
      (file.schemaType && file.schemaType.toLowerCase().includes(query))
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.displayName.localeCompare(b.displayName)
      case 'date':
        // For now, sort by name as we don't have date info
        return a.displayName.localeCompare(b.displayName)
      case 'type':
        const aType = a.schemaType || 'zzz'
        const bType = b.schemaType || 'zzz'
        return aType.localeCompare(bType)
      default:
        return 0
    }
  })

  return filtered
})

const groupedFiles = computed(() => {
  if (groupBy.value === 'none') {
    return { 'All Files': filteredFiles.value }
  }

  const grouped: Record<string, typeof filteredFiles.value> = {}
  
  filteredFiles.value.forEach(file => {
    let key: string
    
    if (groupBy.value === 'namespace') {
      const namespace = getNamespaceFromPath(file.path)
      const namespaceInfo = props.availableNamespaces.find(ns => ns.id === namespace)
      key = namespaceInfo?.name || namespace || 'Default'
    } else if (groupBy.value === 'type') {
      key = file.schemaType || 'No Schema'
    } else {
      key = 'All Files'
    }
    
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(file)
  })
  
  return grouped
})

// Helper functions
const getNamespaceFromPath = (path: string): string => {
  const parts = path.split('/')
  return parts.length > 1 ? parts[0] : 'default'
}

const getNamespaceIcon = (file: FileInfo | null): string => {
  if (!file) return ''
  
  const namespace = getNamespaceFromPath(file.path)
  
  // Determine if it's a user namespace, group namespace, or shared
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

const getGroupIcon = (groupName: string): string => {
  // For namespace groups
  if (groupBy.value === 'namespace') {
    const namespace = props.availableNamespaces.find(ns => ns.name === groupName)
    if (namespace?.isUserNamespace) return 'info'
    if (groupName === 'shared') return 'globe'
    return 'info'
  }
  
  // For schema type groups
  if (groupBy.value === 'type') {
    if (groupName === 'No Schema') return 'document'
    return 'namespace'
  }
  
  return 'info'
}
</script>

<style scoped>
.editor-sidebar {
  width: 100%;
  background: var(--color-gray-50);
  border-right: 1px solid var(--color-gray-200);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-white);
  flex-shrink: 0;
}

.sidebar-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.sidebar-header h3 {
  margin: 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.header-actions {
  display: flex;
  gap: var(--spacing-2);
}

.options-btn {
  padding: var(--spacing-2);
  background: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-normal);
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.options-btn:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
}

.create-btn {
  padding: var(--spacing-2);
  background: var(--color-primary);
  color: var(--color-white);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  transition: all var(--transition-normal);
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.create-btn:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.search-container {
  margin-bottom: var(--spacing-3);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--spacing-3);
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-4) var(--spacing-2) var(--spacing-8);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-white);
  transition: border-color var(--transition-normal);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.clear-search {
  position: absolute;
  right: var(--spacing-2);
  background: none;
  border: none;
  color: var(--color-gray-500);
  cursor: pointer;
  padding: var(--spacing-1);
  font-size: var(--font-size-sm);
  line-height: 1;
}

.clear-search:hover {
  color: var(--color-gray-700);
}

.sidebar-options {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-3);
  margin-top: var(--spacing-2);
}

.sidebar-option-group {
  margin-bottom: var(--spacing-2);
}

.sidebar-option-group:last-child {
  margin-bottom: 0;
}

.sidebar-option-label {
  display: block;
  margin-bottom: var(--spacing-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sidebar-option-select {
  width: 100%;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--color-white);
}

.sidebar-loading {
  padding: var(--spacing-4);
  animation: fadeIn 0.3s ease-in-out;
}

.loading-skeleton {
  margin-bottom: var(--spacing-4);
}

.skeleton-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  margin-bottom: var(--spacing-2);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.skeleton-line {
  height: 12px;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title {
  width: 70%;
}

.skeleton-subtitle {
  width: 45%;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-gray-300);
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInFromLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes errorPulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes robotBlink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0.6; }
}

@keyframes sparkle {
  0%, 100% { 
    opacity: 0;
    transform: scale(0.8) rotate(0deg);
  }
  50% { 
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

.sidebar-error {
  padding: var(--spacing-4);
  animation: slideInFromLeft 0.4s ease-out;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-3);
  max-width: 280px;
  margin: 0 auto;
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fca5a5;
  color: #dc2626;
  animation: errorPulse 2s infinite;
}

.error-details h4 {
  margin: 0 0 var(--spacing-2) 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-display);
}

.error-details p {
  margin: 0 0 var(--spacing-3) 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.retry-btn:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-8);
  max-width: 320px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out;
}

.empty-illustration {
  position: relative;
  margin-bottom: var(--spacing-4);
  animation: float 3s ease-in-out infinite;
}

.empty-robot {
  color: #6b7280;
  animation: robotBlink 4s infinite;
}

.empty-sparkles {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: var(--font-size-lg);
  animation: sparkle 2s infinite;
}

.sparkle-1 {
  top: 10%;
  left: 15%;
  animation-delay: 0s;
}

.sparkle-2 {
  top: 20%;
  right: 10%;
  animation-delay: 0.7s;
}

.sparkle-3 {
  bottom: 15%;
  left: 20%;
  animation-delay: 1.4s;
}

.empty-content h3 {
  margin: 0 0 var(--spacing-2) 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-display);
}

.empty-content p {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-content);
}

.empty-actions {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: var(--color-white);
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--color-white);
  color: var(--color-gray-700);
  border-color: var(--color-gray-300);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.file-groups {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-2);
}

.file-group {
  margin-bottom: var(--spacing-3);
}

.group-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  margin-bottom: var(--spacing-2);
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
}

.group-icon {
  font-size: var(--font-size-base);
}

.group-name {
  flex: 1;
}

.group-count {
  background: var(--color-gray-200);
  color: var(--color-gray-600);
  padding: 2px var(--spacing-1);
  border-radius: var(--radius-xl);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  min-width: 20px;
  text-align: center;
}

.file-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.file-card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.file-card:hover {
  border-color: var(--color-gray-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.file-card.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f8faff 0%, #eff6ff 100%);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.file-card.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
}

.file-card.has-unsaved-changes {
  /* border-left: 4px solid #f59e0b; */
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.file-card.has-unsaved-changes::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--color-white);
}

.file-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-2);
}

.file-status-indicators {
  display: flex;
  gap: var(--spacing-1);
}

.unsaved-dot {
  color: var(--color-warning);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.file-actions {
  display: flex;
  gap: var(--spacing-1);
}

.warning-btn {
  background: none;
  border: none;
  cursor: default;
  font-size: var(--font-size-xs);
  color: var(--color-warning);
}

.file-card-content {
  flex: 1;
}

.file-name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.namespace-icon {
  font-size: var(--font-size-sm);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  background: var(--color-gray-100);
  color: var(--color-gray-600);
  transition: all var(--transition-normal);
}

.file-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-900);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.schema-badge {
  font-size: var(--font-size-xs);
  padding: 4px var(--spacing-2);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  text-transform: lowercase;
  letter-spacing: 0.025em;
  border: 1px solid;
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border-color: var(--color-gray-300);
}

.schema-chatbot {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  border-color: #93c5fd;
}

.schema-assistant {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #166534;
  border-color: #86efac;
}

.schema-agent {
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  color: #a16207;
  border-color: #fde047;
}

/* Tablet and medium screen responsiveness */
@media (max-width: 900px) and (min-width: 769px) {
  .file-groups {
    padding: var(--spacing-1);
  }
  
  .file-card {
    padding: var(--spacing-2);
  }
  
  .file-name {
    font-size: var(--font-size-xs);
  }
  
  .group-header {
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-xs);
  }
  
  .schema-badge {
    font-size: 10px;
    padding: 1px 4px;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .editor-sidebar {
    width: 100%;
    height: 40vh;
    border-right: none;
    border-bottom: 1px solid var(--color-gray-200);
  }
  
  .sidebar-title-row {
    flex-direction: column;
    gap: var(--spacing-2);
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .file-groups {
    padding: var(--spacing-1);
  }
  
  .file-card {
    padding: var(--spacing-2);
  }
  
  .group-header {
    padding: var(--spacing-1) var(--spacing-2);
  }
}
</style>