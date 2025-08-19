<template>
  <div class="configure-header">
    <div class="configure-info">
      <div v-if="detectedSchema" class="schema-info modern-schema-card">
        <div class="schema-header">
          <div class="schema-icon"><Icon name="robot" size="2xl" /></div>
          <div class="schema-details">
            <h4>{{ detectedSchema.title || 'Agent Configuration Schema' }}</h4>
            <p class="schema-description">{{ detectedSchema.description || 'This agent type has structured configuration options' }}</p>
          </div>
        </div>
      </div>
      <div v-else class="no-schema-info">
        <div class="no-schema-header">
          <div class="no-schema-icon">
            <Icon name="settings" size="lg" aria-label="Configuration" />
          </div>
          <div class="no-schema-details">
            <h4>Dynamic Configuration</h4>
            <p class="no-schema-description">Configuration form generated from existing agent settings</p>
          </div>
          <div class="no-schema-badge">
            <span class="badge badge-info">Dynamic</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue'
import type { JsonSchema } from '../../services/schema'

defineProps<{
  detectedSchema: JsonSchema | null
}>()
</script>

<style scoped>
.configure-header {
  flex-shrink: 0;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

.configure-info {
  margin-top: var(--spacing-2);
}

.modern-schema-card,
.no-schema-info {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  padding: var(--spacing-5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.modern-schema-card::before,
.no-schema-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #7c3aed 100%);
}

.schema-header,
.no-schema-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
}

.schema-icon,
.no-schema-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #93c5fd;
  border-radius: var(--radius-xl);
  color: #1e40af;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.schema-details,
.no-schema-details {
  flex: 1;
  padding-left: var(--spacing-2);
}

.schema-details h4,
.no-schema-details h4 {
  margin: 0 0 var(--spacing-2) 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-display);
}

.schema-description,
.no-schema-description {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-content);
}

.no-schema-badge {
  flex-shrink: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-xl);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid;
  font-family: var(--font-code);
}

.badge-info {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  color: #a16207;
  border-color: #fbbf24;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .schema-header,
  .no-schema-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-2);
  }
  
  .schema-icon,
  .no-schema-icon {
    align-self: center;
  }
}
</style>