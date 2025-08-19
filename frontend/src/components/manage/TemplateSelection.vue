<template>
  <div class="option-group template-group">
    <h5>
      <Icon name="file-text" size="sm" aria-label="Templates" />
      Apply Template
    </h5>
    
    <div v-if="!currentSchemaType" class="no-schema-message">
      <Icon name="info" size="sm" />
      <span>Select a file with a valid schema to see available templates.</span>
    </div>
    
    <div v-else-if="loading" class="loading-state">
      <Icon name="spinner" size="sm" class="loading-spinner" />
      <span>Loading templates...</span>
    </div>
    
    <div v-else-if="error" class="error-state">
      <Icon name="warning" size="sm" />
      <span>{{ error }}</span>
      <button @click="loadTemplates" class="btn btn-link retry-btn">
        <Icon name="refresh" size="xs" />
        Retry
      </button>
    </div>
    
    <div v-else>
      <div v-if="templates.length === 0" class="no-templates">
        <Icon name="info" size="sm" />
        <span>No templates available for {{ currentSchemaType }} schema.</span>
      </div>
      
      <div v-else class="template-content">
        <label for="template-select">Choose a template:</label>
        <select 
          id="template-select" 
          v-model="selectedTemplateId" 
          class="template-select"
          @change="onTemplateChange"
        >
          <option value="">Select a template...</option>
          <option 
            v-for="template in templates" 
            :key="template.id" 
            :value="template.id"
          >
            {{ template.name }}
          </option>
        </select>
        
        <div v-if="selectedTemplate" class="template-preview">
          <div class="template-info">
            <h6>{{ selectedTemplate.name }}</h6>
            <p class="template-description">{{ selectedTemplate.description }}</p>
          </div>
          
          <div class="template-actions">
            <button 
              @click="applyTemplate" 
              class="btn btn-primary"
              :disabled="applying"
            >
              <Icon v-if="applying" name="spinner" size="sm" class="loading-spinner" />
              <Icon v-else name="check" size="sm" />
              {{ applying ? 'Applying...' : 'Apply Template' }}
            </button>
          </div>
        </div>
        
        <div v-if="applied" class="success-message">
          <Icon name="check" size="sm" />
          <span>Template applied! Review the changes in the Configure and Instruct tabs.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Icon from '../ui/Icon.vue'
import { ApiService, type TemplateInfo, type FileInfo } from '../../services/api'

const props = defineProps<{
  selectedFile: FileInfo | null
}>()

const emit = defineEmits<{
  'apply-template': [template: TemplateInfo]
}>()

// Reactive state
const templates = ref<TemplateInfo[]>([])
const selectedTemplateId = ref<string>('')
const loading = ref(false)
const applying = ref(false)
const error = ref<string>('')
const applied = ref(false)

// Computed properties
const currentSchemaType = computed(() => props.selectedFile?.schemaType || null)

const selectedTemplate = computed(() => {
  if (!selectedTemplateId.value) return null
  return templates.value.find(t => t.id === selectedTemplateId.value) || null
})

// Methods
async function loadTemplates() {
  if (!currentSchemaType.value) {
    templates.value = []
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    templates.value = await ApiService.getTemplates(currentSchemaType.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load templates'
    templates.value = []
  } finally {
    loading.value = false
  }
}

function onTemplateChange() {
  applied.value = false
}

async function applyTemplate() {
  if (!selectedTemplate.value) return
  
  applying.value = true
  applied.value = false
  
  try {
    // Emit the template to parent component for application
    emit('apply-template', selectedTemplate.value)
    applied.value = true
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      applied.value = false
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to apply template'
  } finally {
    applying.value = false
  }
}

// Watch for schema type changes
watch(currentSchemaType, () => {
  selectedTemplateId.value = ''
  applied.value = false
  loadTemplates()
}, { immediate: true })

// Load templates on mount
onMounted(() => {
  loadTemplates()
})
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

.template-group h5 {
  color: #0e6b7a;
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

.no-schema-message,
.loading-state,
.error-state,
.no-templates {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

.error-state {
  background: var(--color-danger-light);
  border-color: var(--color-danger);
  color: var(--color-danger-dark);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.template-content label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-800);
  font-size: var(--font-size-sm);
}

.template-select {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-white);
  margin-bottom: var(--spacing-4);
  transition: border-color var(--transition-normal);
}

.template-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.template-preview {
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.template-info {
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
}

.template-info h6 {
  margin: 0 0 var(--spacing-1) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
}

.template-description {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
  line-height: 1.4;
}

.template-actions {
  padding: var(--spacing-3);
  display: flex;
  gap: var(--spacing-2);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  min-height: 2.25rem;
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

.btn-secondary {
  background: var(--color-white);
  border-color: var(--color-gray-300);
  color: var(--color-gray-700);
  box-shadow: var(--shadow-sm);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-link {
  background: transparent;
  border: none;
  color: var(--color-primary);
  padding: var(--spacing-1);
  font-size: var(--font-size-xs);
  text-decoration: underline;
}

.btn-link:hover:not(:disabled) {
  color: var(--color-primary-hover);
}

.retry-btn {
  margin-left: var(--spacing-2);
}

.success-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--color-success-light);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-success-dark);
  margin-top: var(--spacing-3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>