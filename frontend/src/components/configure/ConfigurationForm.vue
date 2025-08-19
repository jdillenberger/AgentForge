<template>
  <div class="frontmatter-content">
    <FormKit
      v-if="formSchema.length > 0"
      type="form"
      :key="`schema-form-${formKey}`"
      :value="frontmatterData"
      @input="$emit('update:frontmatter', $event || {})"
      :actions="false"
    >
      <FormKitSchema :schema="formSchema" />
    </FormKit>
    
    <!-- Fallback to dynamic form if no schema -->
    <FormKit
      v-else
      type="form"
      :key="`dynamic-form-${formKey}`"
      :value="frontmatterData"
      @input="$emit('update:frontmatter', $event || {})"
      :actions="false"
    >
      <div v-for="(value, key) in frontmatterData" :key="key" class="form-field enhanced-field">
        <div class="field-header">
          <div class="field-info">
            <span class="field-label">{{ key }}</span>
            <span class="field-type-badge" :class="`type-${getFieldType(value)}`">
              {{ getFieldTypeLabel(getFieldType(value)) }}
            </span>
          </div>
        </div>
        <FormKit
          :type="getFieldType(value) as any"
          :name="String(key)"
          label=""
          :value="value"
        />
      </div>
    </FormKit>
  </div>
</template>

<script setup lang="ts">
import { FormKitSchema } from '@formkit/vue'

defineProps<{
  formSchema: any[]
  frontmatterData: Record<string, any>
  formKey: number
}>()

defineEmits<{
  'update:frontmatter': [data: Record<string, any>]
}>()

// Helper functions for dynamic form field types
const getFieldType = (value: any): 'text' | 'number' | 'checkbox' | 'textarea' => {
  if (typeof value === 'boolean') return 'checkbox'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'textarea'
  if (typeof value === 'object') return 'textarea'
  return 'text'
}

const getFieldTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    'text': 'Text',
    'number': 'Number',
    'checkbox': 'Boolean',
    'textarea': 'Multi-line',
    'email': 'Email',
    'url': 'URL',
    'date': 'Date'
  }
  return typeLabels[type] || 'Text'
}
</script>

<style scoped>
.frontmatter-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
}

.enhanced-field {
  margin-bottom: var(--spacing-5);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  padding: var(--spacing-4);
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  transition: all var(--transition-normal);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  position: relative;
  overflow: hidden;
  animation: slideInFromBottom 0.4s ease-out;
  animation-fill-mode: both;
}

.enhanced-field::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 100%);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.enhanced-field:hover {
  border-color: var(--color-gray-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.enhanced-field:hover::before {
  opacity: 1;
}

.enhanced-field:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.enhanced-field:focus-within::before {
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  opacity: 1;
}

.field-header {
  margin-bottom: var(--spacing-3);
  padding-bottom: var(--spacing-2);
  border-bottom: 1px solid var(--color-gray-100);
}

.field-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.field-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  font-size: var(--font-size-base);
  font-family: var(--font-display);
  text-transform: capitalize;
  transition: all var(--transition-normal);
  animation: slideInFromLeft 0.3s ease-out 0.1s both;
}

.enhanced-field:hover .field-label {
  color: #1e40af;
  transform: translateX(2px);
}

.field-type-badge {
  font-size: var(--font-size-xs);
  padding: 4px var(--spacing-2);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid;
  font-family: var(--font-code);
  transition: all var(--transition-normal);
  cursor: default;
  animation: fadeInScale 0.3s ease-out 0.2s both;
  position: relative;
  overflow: hidden;
}

.field-type-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.3s ease;
}

.field-type-badge:hover {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.field-type-badge:hover::before {
  left: 100%;
}

.type-text {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #475569;
  border-color: #cbd5e1;
}

.type-textarea {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  border-color: #93c5fd;
}

.type-number {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #166534;
  border-color: #86efac;
}

.type-checkbox {
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  color: #a16207;
  border-color: #fde047;
}

/* FormKit Styling */
.frontmatter-content :deep(.formkit-outer) {
  margin-bottom: var(--spacing-4);
  margin-right: var(--spacing-1);
  margin-left: 1px;
}

.frontmatter-content :deep(.formkit-wrapper) {
  max-width: none;
}

.frontmatter-content :deep(.formkit-inner) {
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  margin-right: var(--spacing-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.frontmatter-content :deep(.formkit-inner:focus-within) {
  border-color: #3b82f6;
  background: var(--color-white);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

/* Enhanced field FormKit styling */
.enhanced-field :deep(.formkit-inner) {
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-right: 0;
  transition: all var(--transition-normal);
}

.enhanced-field :deep(.formkit-inner:focus-within) {
  border-color: #3b82f6;
  background: var(--color-white);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.frontmatter-content :deep(.formkit-input) {
  border: none;
  box-shadow: none;
  padding: var(--spacing-3);
}

.frontmatter-content :deep(.formkit-input:focus) {
  outline: none;
  box-shadow: none;
  border: none;
}

/* Specific styling for checkbox fields */
.frontmatter-content :deep(.formkit-outer[data-type="checkbox"]) {
  margin-bottom: var(--spacing-4);
  margin-right: var(--spacing-2);
}

.frontmatter-content :deep(.formkit-outer[data-type="checkbox"] .formkit-inner) {
  box-shadow: none;
  border: none;
  border-radius: 0;
  padding: var(--spacing-2);
  background: transparent;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-right: var(--spacing-2);
}

.frontmatter-content :deep(.formkit-outer[data-type="checkbox"] .formkit-inner:focus-within) {
  box-shadow: none;
  border: none;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .frontmatter-content {
    padding: var(--spacing-3);
  }
  
  .enhanced-field {
    padding: var(--spacing-2);
  }
  
  .field-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
  }
}

/* Form animations */
@keyframes slideInFromBottom {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slideInFromLeft {
  from { 
    opacity: 0; 
    transform: translateX(-15px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes fadeInScale {
  from { 
    opacity: 0; 
    transform: scale(0.9); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}
</style>