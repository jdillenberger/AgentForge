<template>
  <div class="editor-container">
    <AgentSidebar 
      :files="files"
      :selected-file="selectedFile"
      :has-unsaved-changes="hasUnsavedChanges"
      :loading="loading"
      :error="error"
      :available-namespaces="availableNamespaces"
      @create-agent="showCreateModal = true"
      @select-file="selectFile"
    />

    <div class="editor-main" v-if="selectedFile">
      <AgentFileHeader 
        :agent-file="selectedFile"
        :has-unsaved-changes="hasUnsavedChanges"
        :saving="saving"
        :saved="!hasUnsavedChanges && !saving"
        :available-namespaces="availableNamespaces"
        @save="saveFile"
        @help="showHelpModal = true"
      />
        
        <div v-if="fileLoading" class="loading">Loading file...</div>
        <div v-else-if="fileError" class="error">{{ fileError }}</div>
        
        <TabsComponent 
          v-else
          :tabs="tabDefinitions"
          :active-tab="activeTab"
          @update:active-tab="activeTab = $event as 'frontmatter' | 'markdown' | 'options'"
        >
          <template #frontmatter>
            <div class="configure-editor">
              <AgentHeader 
                :detected-schema="detectedSchema"
              />
              
              <ConfigurationForm 
                :form-schema="formSchema"
                :frontmatter-data="fileContent?.frontmatter || {}"
                :form-key="formKey"
                @update:frontmatter="currentFormData = $event"
              />
            </div>
          </template>

          <template #options>
            <div class="manage-editor">
              <div class="manage-section">
                <AccessLevelDisplay 
                  :selected-file="selectedFile"
                  :available-namespaces="availableNamespaces"
                />
                
                <TemplateSelection 
                  :selected-file="selectedFile"
                  @apply-template="handleApplyTemplate"
                />
                
                <TransferControls 
                  :selected-file="selectedFile"
                  :available-namespaces="availableNamespaces"
                  :selected-move-namespace="selectedMoveNamespace"
                  :can-move-file="!!canMoveFile"
                  @update:selected-move-namespace="selectedMoveNamespace = $event"
                  @transfer-file="handleMoveFile"
                />
                
                <AgentHistory 
                  :loading-history="loadingHistory"
                  :history-error="historyError"
                  :file-history="fileHistory"
                  :current-sha="fileContent?.sha || null"
                  @load-version="handleLoadVersion"
                />
                
                <DangerZone 
                  @delete-agent="confirmDelete(selectedFile)"
                />
              </div>
            </div>
          </template>

          <template #markdown>
            <MonacoMarkdownEditor 
              :content="markdownContent"
              :editor-mode="editorMode"
              :show-line-numbers="showLineNumbers"
              :is-mobile="isMobile"
              @update:content="markdownContent = $event; onMarkdownChange()"
              @update:editor-mode="editorMode = $event"
              @toggle-line-numbers="showLineNumbers = !showLineNumbers"
              @sync-scroll="syncScroll"
            />
          </template>
        </TabsComponent>

      <div v-if="saving" class="saving-indicator">Saving...</div>
      <div v-if="saved" class="saved-indicator">Saved!</div>
    </div>

    <NoAgentSelected 
      v-else 
      :has-agents="files.length > 0"
      :loading="loading"
      @create-agent="showCreateModal = true"
    />
    
    <!-- Create File Modal -->
    <CreateFileModal 
      :show="showCreateModal"
      @close="showCreateModal = false"
      @create="handleCreateFile"
    />
    
    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationModal 
      :show="showDeleteModal"
      :file-to-delete="fileToDelete"
      @close="showDeleteModal = false"
      @confirm="handleDeleteFile"
    />
  </div>
  
  <!-- Help Modal -->
  <HelpModal 
    :show="showHelpModal"
    @close="showHelpModal = false"
  />
  
  <!-- Unsaved Changes Warning Modal -->
  <UnsavedChangesModal 
    :show="showUnsavedChangesModal"
    :file-name="selectedFile?.displayName || ''"
    @save-and-switch="handleSaveAndSwitch"
    @discard-and-switch="handleDiscardAndSwitch"
    @cancel="handleCancelSwitch"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ApiService, type FileInfo, type FileContent, type NamespaceInfo, type FileHistoryEntry, type TemplateInfo } from '../../services/api'
import { SchemaService, type JsonSchema } from '../../services/schema'
import CreateFileModal from '../modals/CreateFileModal.vue'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal.vue'
import HelpModal from '../modals/HelpModal.vue'
import UnsavedChangesModal from '../modals/UnsavedChangesModal.vue'
import AgentSidebar from './AgentSidebar.vue'
import AgentFileHeader from './AgentFileHeader.vue'
import NoAgentSelected from './NoAgentSelected.vue'
import AccessLevelDisplay from '../manage/AccessLevelDisplay.vue'
import TransferControls from '../manage/TransferControls.vue'
import AgentHistory from '../manage/AgentHistory.vue'
import DangerZone from '../manage/DangerZone.vue'
import TemplateSelection from '../manage/TemplateSelection.vue'
import MonacoMarkdownEditor from './MonacoMarkdownEditor.vue'
import AgentHeader from '../configure/AgentHeader.vue'
import ConfigurationForm from '../configure/ConfigurationForm.vue'
import TabsComponent, { type TabDefinition } from '../ui/TabsComponent.vue'

const router = useRouter()
const route = useRoute()

const files = ref<FileInfo[]>([])
const selectedFile = ref<FileInfo | null>(null)
const fileContent = ref<FileContent | null>(null)
const activeTab = ref<'frontmatter' | 'markdown' | 'options'>('frontmatter')

// Tab definitions for TabsComponent
const tabDefinitions: TabDefinition[] = [
  { id: 'frontmatter', label: 'Configure', icon: 'configure' },
  { id: 'markdown', label: 'Instruct', icon: 'edit' },
  { id: 'options', label: 'Manage', icon: 'settings' }
]
const availableNamespaces = ref<NamespaceInfo[]>([])
const selectedMoveNamespace = ref('')
const fileHistory = ref<FileHistoryEntry[]>([])
const loadingHistory = ref(false)
const historyError = ref('')
const markdownContent = ref('')
const originalMarkdownContent = ref('')
const originalFrontmatter = ref<any>({})
const currentFormData = ref<any>({}) // Track current form state
const formKey = ref(0) // Force re-render of FormKit forms
const showPreview = ref(false)
const editorMode = ref<'edit' | 'preview' | 'split'>('edit')
// Initialize line numbers based on screen size
const showLineNumbers = ref(window.innerWidth > 768)

// Mobile detection reactive property
const isMobile = ref(window.innerWidth <= 768)

// File sidebar state

const loading = ref(false)
const error = ref('')
const fileLoading = ref(false)
const fileError = ref('')
const saving = ref(false)
const saved = ref(false)
const detectedSchema = ref<JsonSchema | null>(null)
const formSchema = ref<any[]>([])

// Modal states
const showCreateModal = ref(false)
const showHelpModal = ref(false)
const showDeleteModal = ref(false)
const fileToDelete = ref<FileInfo | null>(null)
const showUnsavedChangesModal = ref(false)
const pendingFileSelection = ref<FileInfo | null>(null)

// Computed properties
const canMoveFile = computed(() => {
  return selectedFile.value && selectedMoveNamespace.value && 
         getNamespaceFromPath(selectedFile.value.path) !== selectedMoveNamespace.value
})

const hasUnsavedChanges = computed(() => {
  if (!fileContent.value) return false
  
  // Check if markdown content has changed
  const contentChanged = markdownContent.value !== originalMarkdownContent.value
  
  // Check if frontmatter has changed - compare current form data with original
  const frontmatterChanged = JSON.stringify(currentFormData.value) !== 
                             JSON.stringify(originalFrontmatter.value)
  
  
  return contentChanged || frontmatterChanged
})

// Editor statistics
// File filtering and grouping

const syncScroll = () => {
  // Placeholder for scroll synchronization in split mode
  // Could be enhanced to sync editor and preview scroll positions
}

onMounted(async () => {
  // Load schemas first, then files and namespaces
  await SchemaService.loadSchemas()
  await loadFiles()
  await loadNamespaces()
  
  // Load from URL after files are loaded
  await loadFromURL()
  
  // Add window resize listener to adjust layout on screen size change
  const handleResize = () => {
    // Update mobile detection
    isMobile.value = window.innerWidth <= 768
    
    // Auto-disable line numbers on small screens for better mobile experience
    if (window.innerWidth <= 768 && showLineNumbers.value && editorMode.value === 'edit') {
      showLineNumbers.value = false
    }
    
    // On very small screens, switch from split to edit mode for better UX
    if (window.innerWidth <= 480 && editorMode.value === 'split') {
      editorMode.value = 'edit'
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  // Add keyboard shortcuts
  const handleKeydown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + / for help
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault()
      showHelpModal.value = !showHelpModal.value
    }
    // Escape to close help modal
    if (event.key === 'Escape' && showHelpModal.value) {
      showHelpModal.value = false
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Watch for route changes to load file from URL
watch(() => route.query, async () => {
  await loadFromURL()
}, { deep: true })

// Watch for activeTab changes to update URL
watch(activeTab, () => {
  updateURL()
})


const loadFiles = async () => {
  try {
    loading.value = true
    error.value = ''
    files.value = await ApiService.getFiles()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

const selectFile = async (file: FileInfo) => {
  // Don't switch if it's the same file
  if (selectedFile.value && selectedFile.value.path === file.path) {
    return
  }
  
  // Check for unsaved changes
  if (hasUnsavedChanges.value) {
    pendingFileSelection.value = file
    showUnsavedChangesModal.value = true
    return
  }
  
  // No unsaved changes, proceed with file selection
  await actuallySelectFile(file)
}

const actuallySelectFile = async (file: FileInfo) => {
  try {
    selectedFile.value = file
    fileLoading.value = true
    fileError.value = ''
    
    fileContent.value = await ApiService.getFile(file.path)
    markdownContent.value = fileContent.value.content
    
    // Store original values to track changes
    originalMarkdownContent.value = fileContent.value.content
    originalFrontmatter.value = JSON.parse(JSON.stringify(fileContent.value.frontmatter))
    currentFormData.value = JSON.parse(JSON.stringify(fileContent.value.frontmatter))
    
    // Detect and apply schema using filename schema type
    detectedSchema.value = await SchemaService.detectSchema(file.schemaType, fileContent.value.frontmatter)
    if (detectedSchema.value) {
      formSchema.value = SchemaService.generateFormKitSchema(detectedSchema.value, fileContent.value.frontmatter)
    } else {
      formSchema.value = []
    }
    
    // Force FormKit forms to re-render with new file data
    formKey.value += 1
    
    // Load file history
    await loadFileHistory()
    
    // Reset preview mode when switching files
    showPreview.value = false
    
    activeTab.value = 'frontmatter'
    
    // Update URL to reflect selected file
    updateURL()
  } catch (err) {
    fileError.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    fileLoading.value = false
  }
}

// Unsaved changes modal handlers
const handleSaveAndSwitch = async () => {
  if (!pendingFileSelection.value) return
  
  try {
    // Save current file first
    await saveFile()
    // Then switch to the pending file
    await actuallySelectFile(pendingFileSelection.value)
  } catch (err) {
    console.error('Error saving before switch:', err)
    // Show error but don't proceed with switch
    return
  } finally {
    showUnsavedChangesModal.value = false
    pendingFileSelection.value = null
  }
}

const handleDiscardAndSwitch = async () => {
  if (!pendingFileSelection.value) return
  
  // Switch to pending file without saving
  await actuallySelectFile(pendingFileSelection.value)
  showUnsavedChangesModal.value = false
  pendingFileSelection.value = null
}

const handleCancelSwitch = () => {
  // Just close the modal and stay on current file
  showUnsavedChangesModal.value = false
  pendingFileSelection.value = null
}


const saveFile = async () => {
  if (!selectedFile.value || !fileContent.value) return
  
  try {
    saving.value = true
    saved.value = false
    
    // Use current form data for frontmatter and markdown content from editor
    const response = await ApiService.updateFile(
      selectedFile.value.path,
      currentFormData.value,
      markdownContent.value,
      fileContent.value.sha
    )
    
    fileContent.value.sha = response.sha
    fileContent.value.frontmatter = currentFormData.value
    fileContent.value.content = markdownContent.value
    
    // Update original values to reflect current saved state
    originalFrontmatter.value = JSON.parse(JSON.stringify(currentFormData.value))
    originalMarkdownContent.value = markdownContent.value
    
    // Refresh file list to update any display name changes
    await loadFiles()
    
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (err) {
    fileError.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    saving.value = false
  }
}

const onMarkdownChange = () => {
  // Auto-save could be implemented here with debouncing
}


// File creation handler
const handleCreateFile = async (data: { filePath: string; frontmatter: any; content: string; namespace?: string }) => {
  try {
    saving.value = true
    showCreateModal.value = false
    
    await ApiService.createFile(data.filePath, data.frontmatter, data.content, data.namespace)
    
    // Reload file list
    await loadFiles()
    
    // Auto-select the newly created file - need to check for namespaced path
    let expectedPath = data.filePath
    if (data.namespace) {
      expectedPath = `${data.namespace}/${data.filePath}`
    }
    
    // The API always returns files with namespace prefix, so we need to check for that
    const newFile = files.value.find(f => 
      f.path === expectedPath || 
      f.path === data.filePath ||
      f.path.endsWith(`/${data.filePath}`) ||
      f.path === `shared/${data.filePath}` // Default namespace fallback
    )
    
    if (newFile) {
      await selectFile(newFile)
    }
    
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create file'
  } finally {
    saving.value = false
  }
}

// File deletion handlers
const confirmDelete = (file: FileInfo) => {
  fileToDelete.value = file
  showDeleteModal.value = true
}

const handleDeleteFile = async () => {
  if (!fileToDelete.value) return
  
  try {
    saving.value = true
    showDeleteModal.value = false
    
    await ApiService.deleteFile(fileToDelete.value.path, fileToDelete.value.sha)
    
    // Clear selected file if it was the deleted one
    if (selectedFile.value?.path === fileToDelete.value.path) {
      selectedFile.value = null
      fileContent.value = null
    }
    
    // Reload file list
    await loadFiles()
    
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete file'
  } finally {
    saving.value = false
    fileToDelete.value = null
  }
}

// Namespace-related functions
const loadNamespaces = async () => {
  try {
    availableNamespaces.value = await ApiService.getNamespaces()
  } catch (err) {
    console.error('Error loading namespaces:', err)
  }
}

const getNamespaceFromPath = (filePath: string): string => {
  const pathParts = filePath.split('/')
  return pathParts.length > 1 ? pathParts[0] : 'shared'
}



// File moving functionality
const handleMoveFile = async () => {
  if (!selectedFile.value || !selectedMoveNamespace.value) return
  
  try {
    saving.value = true
    
    await ApiService.moveFile(selectedFile.value.path, selectedMoveNamespace.value)
    
    // Update the selected file path with the new namespace
    const newPath = `${selectedMoveNamespace.value}/${selectedFile.value.name}`
    selectedFile.value.path = newPath
    
    // Reload files to reflect the change
    await loadFiles()
    
    // Find and select the moved file
    const movedFile = files.value.find(f => f.path === newPath)
    if (movedFile) {
      selectedFile.value = movedFile
    }
    
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to move file'
  } finally {
    saving.value = false
  }
}

// File history functionality
const loadFileHistory = async () => {
  if (!selectedFile.value) return
  
  try {
    loadingHistory.value = true
    historyError.value = ''
    fileHistory.value = await ApiService.getFileHistory(selectedFile.value.path)
  } catch (err) {
    historyError.value = err instanceof Error ? err.message : 'Failed to load file history'
    fileHistory.value = []
  } finally {
    loadingHistory.value = false
  }
}

const handleLoadVersion = async (commitSha: string) => {
  if (!selectedFile.value || !fileContent.value) return
  
  try {
    // Get the old version content
    const oldVersion = await ApiService.getFileVersion(selectedFile.value.path, commitSha)
    
    // Update both content and frontmatter
    markdownContent.value = oldVersion.content
    fileContent.value.frontmatter = oldVersion.frontmatter
    currentFormData.value = JSON.parse(JSON.stringify(oldVersion.frontmatter))
    
    // Regenerate the form schema with the new frontmatter if we have a detected schema
    if (detectedSchema.value) {
      formSchema.value = SchemaService.generateFormKitSchema(detectedSchema.value, oldVersion.frontmatter)
    }
    
    // Force FormKit forms to re-render with new values
    formKey.value += 1
    
    // Note: hasUnsavedChanges computed property will automatically detect the changes
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load file version'
  }
}

// Template handlers
const handleApplyTemplate = async (template: TemplateInfo) => {
  if (!selectedFile.value || !fileContent.value) return
  
  try {
    // Apply template content to markdown
    markdownContent.value = template.content
    
    // Apply template frontmatter, merging with current frontmatter
    const mergedFrontmatter = { ...fileContent.value.frontmatter, ...template.frontmatter }
    fileContent.value.frontmatter = mergedFrontmatter
    currentFormData.value = JSON.parse(JSON.stringify(mergedFrontmatter))
    
    // Regenerate the form schema with the new frontmatter if we have a detected schema
    if (detectedSchema.value) {
      formSchema.value = SchemaService.generateFormKitSchema(detectedSchema.value, mergedFrontmatter)
    }
    
    // Force FormKit forms to re-render with new values
    formKey.value += 1
    
    // Note: The template is applied but not automatically saved - user needs to save manually
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to apply template'
  }
}


// URL management functions
const updateURL = () => {
  if (!selectedFile.value) return
  
  const query: Record<string, string> = {
    file: encodeURIComponent(selectedFile.value.path),
    tab: activeTab.value
  }
  
  router.replace({ query })
}

const loadFromURL = async () => {
  const filePath = route.query.file as string
  const tab = route.query.tab as string
  
  if (filePath) {
    const decodedPath = decodeURIComponent(filePath)
    const file = files.value.find(f => f.path === decodedPath)
    if (file && (!selectedFile.value || selectedFile.value.path !== decodedPath)) {
      await selectFileFromURL(file)
    }
  }
  
  if (tab && ['frontmatter', 'markdown', 'options'].includes(tab)) {
    activeTab.value = tab as 'frontmatter' | 'markdown' | 'options'
  }
}

const selectFileFromURL = async (file: FileInfo) => {
  try {
    selectedFile.value = file
    fileLoading.value = true
    fileError.value = ''
    
    fileContent.value = await ApiService.getFile(file.path)
    markdownContent.value = fileContent.value.content
    
    // Store original values to track changes
    originalMarkdownContent.value = fileContent.value.content
    originalFrontmatter.value = JSON.parse(JSON.stringify(fileContent.value.frontmatter))
    currentFormData.value = JSON.parse(JSON.stringify(fileContent.value.frontmatter))
    
    // Detect and apply schema using filename schema type
    detectedSchema.value = await SchemaService.detectSchema(file.schemaType, fileContent.value.frontmatter)
    if (detectedSchema.value) {
      formSchema.value = SchemaService.generateFormKitSchema(detectedSchema.value, fileContent.value.frontmatter)
    } else {
      formSchema.value = []
    }
    
    // Force FormKit forms to re-render with new file data
    formKey.value += 1
    
    // Load file history
    await loadFileHistory()
    
    // Reset preview mode when switching files
    showPreview.value = false
  } catch (err) {
    fileError.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    fileLoading.value = false
  }
}
</script>

<style scoped>
/* Ensure scrollbars are visible */
* {
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

*::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.editor-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  min-height: 100vh;
  gap: 0;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}

@media (max-width: 1024px) and (min-width: 901px) {
  .editor-container {
    grid-template-columns: 280px 1fr;
    overflow-x: hidden;
  }
}

@media (max-width: 900px) and (min-width: 769px) {
  .editor-container {
    grid-template-columns: 250px 1fr;
    overflow-x: hidden;
  }
}

@media (max-width: 768px) {
  .editor-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow-x: hidden;
    width: 100%;
  }
}








.editor-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: white;
  overflow-x: hidden;
  max-width: 100%;
}

@media (max-width: 768px) {
  .editor-main {
    flex: 1;
    min-height: 0;
  }
}


.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: var(--font-size-base);
}

.action-button:hover {
  background: var(--color-gray-50);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}



.configure-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.configure-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .frontmatter-header {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    text-align: center;
  }
}






















.loading, .error {
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
}

.loading {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.error {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.saving-indicator, .saved-indicator {
  position: fixed;
  top: var(--spacing-5);
  right: var(--spacing-5);
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-bold);
  z-index: var(--z-fixed);
  box-shadow: var(--shadow-lg);
}

.saving-indicator {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.saved-indicator {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}




/* Options editor styles */
.manage-editor {
  max-width: 800px;
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  width: 100%;
}

@media (max-width: 1024px) and (min-width: 769px) {
  .manage-editor {
    max-width: 100%;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .manage-editor {
    padding: 1rem;
  }
}

.manage-section h4 {
  margin: 0 0 2rem 0;
  color: #212529;
  font-weight: 700;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.manage-section h4 {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.option-group {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.option-group:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.option-group h5 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Group-specific styling */
.namespace-group {
  border-left: 4px solid #007bff;
}

.access-group {
  border-left: 4px solid #28a745;
}

.template-group {
  border-left: 4px solid #17a2b8;
}

.history-group {
  border-left: 4px solid #6f42c1;
}

.option-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.95rem;
}

.namespace-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-weight: 500;
}

.namespace-name {
  font-weight: 600;
  color: #212529;
}

.namespace-description {
  color: #6c757d;
  font-style: italic;
  font-size: 0.9em;
}

.transfer-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.transfer-controls .form-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.transfer-btn {
  padding: 8px 16px;
  font-size: 14px;
  white-space: nowrap;
}

.transfer-btn:disabled {
  background: #e9ecef;
  border-color: #e9ecef;
  color: #adb5bd;
  cursor: not-allowed;
}

.danger-zone {
  border-color: #dc3545;
  background: #fff5f5;
  border-width: 2px;
}

.danger-zone:hover {
  border-color: #c82333;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
}

.danger-zone h5 {
  color: #dc3545;
}

.danger-warning {
  margin-top: 1rem;
  color: #721c24;
  font-size: 0.9rem;
  font-style: italic;
  background: rgba(220, 53, 69, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #dc3545;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.8em;
}

.btn-outline {
  background: transparent;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  color: #adb5bd;
  border-color: #dee2e6;
}



</style>