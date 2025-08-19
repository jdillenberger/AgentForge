<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Create New File</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="form-field">
          <label for="fileName">File Name:</label>
          <input 
            id="fileName"
            v-model="fileName" 
            type="text" 
            placeholder="e.g., customer-service"
            class="form-input"
          />
        </div>
        
        <div class="form-field">
          <label for="schemaType">Schema Type:</label>
          <select 
            id="schemaType"
            v-model="selectedSchema" 
            class="form-select"
          >
            <option value="">Select a schema type</option>
            <option v-for="schema in availableSchemas" :key="schema.id" :value="schema.id">
              {{ schema.title }}
            </option>
          </select>
          <div v-if="selectedSchemaInfo" class="schema-description">
            {{ selectedSchemaInfo.description }}
          </div>
        </div>
        
        <div class="form-field" v-if="availableNamespaces.length > 1">
          <label for="namespace">Namespace:</label>
          <select 
            id="namespace"
            v-model="selectedNamespace" 
            class="form-select"
          >
            <option v-for="namespace in availableNamespaces" :key="namespace.id" :value="namespace.id">
              {{ namespace.name }} {{ namespace.isDefault ? '(default)' : '' }} {{ namespace.isUserNamespace ? '(personal)' : '' }}
            </option>
          </select>
          <div class="namespace-description">
            Files will be created in the {{ selectedNamespace }} folder
          </div>
        </div>
        
        <div class="form-field" v-if="selectedSchema">
          <label for="template">Template:</label>
          <select 
            id="template"
            v-model="selectedTemplate" 
            class="form-select"
          >
            <option value="default">Default</option>
            <option v-for="template in filteredTemplates" :key="template.id" :value="template.id">
              {{ template.name }}
            </option>
          </select>
          <div v-if="selectedTemplateInfo" class="template-description">
            {{ selectedTemplateInfo.description }}
          </div>
        </div>
        
        <div class="preview-filename" v-if="previewFilename">
          <strong>Filename:</strong> {{ previewFilename }}
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Cancel</button>
        <button 
          @click="createFile" 
          :disabled="!canCreate"
          class="btn btn-primary"
        >
          Create File
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { buildFilename } from '../../utils/filename-utils'
import { ApiService, type NamespaceInfo, type TemplateInfo, type SchemaInfo } from '../../services/api'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  create: [data: { filePath: string; frontmatter: any; content: string; namespace?: string }]
}>()

const fileName = ref('')
const selectedSchema = ref('')
const selectedNamespace = ref('')
const selectedTemplate = ref('')
const availableSchemas = ref<SchemaInfo[]>([])
const availableNamespaces = ref<NamespaceInfo[]>([])
const availableTemplates = ref<TemplateInfo[]>([])

const selectedSchemaInfo = computed(() => {
  return availableSchemas.value.find(s => s.id === selectedSchema.value)
})

const selectedTemplateInfo = computed(() => {
  if (selectedTemplate.value === 'default') {
    return { 
      id: 'default', 
      name: 'Default', 
      description: 'Start with basic structure and placeholder content',
      schemaType: selectedSchema.value,
      content: '',
      frontmatter: {}
    }
  }
  return availableTemplates.value.find(t => t.id === selectedTemplate.value)
})

const filteredTemplates = computed(() => {
  // Filter out any template with name "default" since we show it as the first option
  return availableTemplates.value.filter(template => template.name !== 'default')
})

const previewFilename = computed(() => {
  if (!fileName.value || !selectedSchema.value) return ''
  return buildFilename(fileName.value, selectedSchema.value)
})

const canCreate = computed(() => {
  return fileName.value.trim() && selectedSchema.value
})

// Load templates when schema changes
watch(selectedSchema, async (newSchema) => {
  if (newSchema) {
    selectedTemplate.value = 'default' // Always start with default
    await loadTemplates(newSchema)
  } else {
    availableTemplates.value = []
    selectedTemplate.value = ''
  }
})

const loadTemplates = async (schemaType: string) => {
  try {
    availableTemplates.value = await ApiService.getTemplates(schemaType)
  } catch (error) {
    console.error('Error loading templates:', error)
    availableTemplates.value = []
  }
}

onMounted(async () => {
  // Load schemas
  try {
    availableSchemas.value = await ApiService.getSchemas()
  } catch (error) {
    console.error('Error loading schemas:', error)
  }
  
  // Load namespaces
  try {
    availableNamespaces.value = await ApiService.getNamespaces()
    // Set default namespace
    if (availableNamespaces.value.length > 0) {
      const defaultNamespace = availableNamespaces.value.find(ns => ns.isDefault)
      selectedNamespace.value = defaultNamespace?.id || availableNamespaces.value[0].id
    }
  } catch (error) {
    console.error('Error loading namespaces:', error)
  }
})

const createFile = async () => {
  if (!canCreate.value) return
  
  const filePath = previewFilename.value
  let frontmatter = {}
  let content = `# ${fileName.value}\n\nYour content here...`
  
  // Apply template if selected
  if (selectedTemplate.value) {
    if (selectedTemplate.value === 'default') {
      // Check if there's an actual "default" template in the available templates
      const defaultTemplate = availableTemplates.value.find(t => t.name === 'default')
      if (defaultTemplate) {
        // Use the default template from the list with its full ID
        try {
          const template = await ApiService.getTemplate(defaultTemplate.id)
          frontmatter = { ...template.frontmatter }
          content = template.content
        } catch (error) {
          console.error('Error loading default template:', error)
          // Fall back to schema defaults
          if (selectedSchemaInfo.value) {
            frontmatter = generateDefaultFrontmatter(selectedSchemaInfo.value)
            content = `# ${fileName.value}\n\nYour content here...`
          }
        }
      } else {
        // No default template exists, use schema defaults
        if (selectedSchemaInfo.value) {
          frontmatter = generateDefaultFrontmatter(selectedSchemaInfo.value)
          content = `# ${fileName.value}\n\nYour content here...`
        }
      }
    } else {
      // Load other templates normally
      try {
        const template = await ApiService.getTemplate(selectedTemplate.value)
        frontmatter = { ...template.frontmatter }
        content = template.content
      } catch (error) {
        console.error('Error loading template:', error)
        // Fall back to schema defaults for other templates too
        if (selectedSchemaInfo.value) {
          frontmatter = generateDefaultFrontmatter(selectedSchemaInfo.value)
        }
      }
    }
  }
  
  const namespace = availableNamespaces.value.length > 1 ? selectedNamespace.value : undefined
  
  emit('create', { filePath, frontmatter, content, namespace })
  
  // Reset form
  fileName.value = ''
  selectedSchema.value = ''
  selectedTemplate.value = ''
  availableTemplates.value = []
  if (availableNamespaces.value.length > 0) {
    const defaultNamespace = availableNamespaces.value.find(ns => ns.isDefault)
    selectedNamespace.value = defaultNamespace?.id || availableNamespaces.value[0].id
  }
}

const generateDefaultFrontmatter = (schema: SchemaInfo): any => {
  const frontmatter: any = {}
  
  // Generate default values based on schema properties
  if (schema.schema && schema.schema.properties) {
    Object.entries(schema.schema.properties).forEach(([key, property]: [string, any]) => {
      if (property.default !== undefined) {
        frontmatter[key] = property.default
      } else {
        // Set reasonable defaults based on type
        switch (property.type) {
          case 'string':
            frontmatter[key] = property.enum ? property.enum[0] : ''
            break
          case 'boolean':
            frontmatter[key] = false
            break
          case 'number':
          case 'integer':
            frontmatter[key] = 0
            break
          case 'array':
            frontmatter[key] = []
            break
          case 'object':
            frontmatter[key] = {}
            break
        }
      }
    })
  }
  
  return frontmatter
}
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
  z-index: var(--z-modal);
}

.modal-content {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 90%;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6) var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-display-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--color-gray-600);
  padding: 0;
  line-height: 1;
  transition: color var(--transition-normal);
}

.close-btn:hover {
  color: var(--color-gray-800);
}

.modal-body {
  padding: var(--spacing-5) var(--spacing-6);
}

.form-field {
  margin-bottom: var(--spacing-5);
}

.form-field label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
}

/* Form inputs already use base .form-input class from design tokens */
.form-select {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
  background: var(--color-white);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.schema-description, .namespace-description, .template-description {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
  font-style: italic;
}

.preview-filename {
  padding: var(--spacing-3);
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  font-family: var(--font-code);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

.modal-footer {
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-5);
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

/* Buttons now use base .btn classes from design tokens */
</style>