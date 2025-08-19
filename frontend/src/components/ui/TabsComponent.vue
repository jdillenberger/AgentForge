<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <div class="tabs-nav">
        <button 
          v-for="tab in tabs"
          :key="tab.id"
          @click="$emit('update:active-tab', tab.id)"
          :class="{ active: activeTab === tab.id }"
          class="tab-button"
        >
          <Icon :name="tab.icon" size="sm" class="tab-icon" />
          <span class="tab-text">{{ tab.label }}</span>
        </button>
      </div>
    </div>
    
    <div class="tabs-content">
      <slot :name="activeTab" :active-tab="activeTab"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'

export interface TabDefinition {
  id: string
  label: string
  icon: string
}

defineProps<{
  tabs: TabDefinition[]
  activeTab: string
}>()

defineEmits<{
  'update:active-tab': [tabId: string]
}>()
</script>

<style scoped>
.tabs-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

.tabs-nav {
  display: flex;
  padding: 0 var(--spacing-4);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-600);
  border-bottom: 2px solid transparent;
  transition: all var(--transition-normal);
  position: relative;
}

.tab-button:hover {
  color: var(--color-gray-900);
  background: var(--color-gray-100);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background: var(--color-white);
}

.tab-icon {
  font-size: var(--font-size-base);
}

.tab-text {
  white-space: nowrap;
}

.tabs-content {
  flex: 1;
  overflow: hidden;
  background: var(--color-white);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tabs-nav {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .tabs-nav::-webkit-scrollbar {
    display: none;
  }
  
  .tab-button {
    padding: var(--spacing-2) var(--spacing-3);
    flex-shrink: 0;
  }
  
  .tab-text {
    display: none;
  }
  
  .tab-icon {
    font-size: var(--font-size-lg);
  }
}
</style>