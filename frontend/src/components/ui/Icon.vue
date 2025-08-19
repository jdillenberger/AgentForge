<template>
  <span 
    v-if="isRobotIcon" 
    class="icon-emoji"
    :class="[size && `icon-${size}`, className]"
    role="img"
    :aria-label="ariaLabel || 'Robot'"
  >
    🤖
  </span>
  <i 
    v-else
    :class="[iconClasses, size && `icon-${size}`, className]"
    :aria-hidden="!ariaLabel"
    :aria-label="ariaLabel"
    :title="title"
  ></i>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Icon name - use 'robot' for the special emoji, or Font Awesome icon names */
  name: string
  /** Size variant */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  /** Icon style for Font Awesome (solid, regular, light, brands) */
  style?: 'solid' | 'regular' | 'light' | 'brands'
  /** Additional CSS classes */
  className?: string
  /** Accessible label for screen readers */
  ariaLabel?: string
  /** Tooltip text */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  style: 'solid',
  size: 'base'
})

// Special case for robot emoji to preserve brand identity
const isRobotIcon = computed(() => props.name === 'robot-emoji')

// Font Awesome icon mapping
const iconMapping: Record<string, string> = {
  // Editor modes
  'edit': 'pen',
  'preview': 'eye',
  'split': 'columns',
  
  // Settings and configuration
  'settings': 'cog',
  'configure': 'wrench',
  'manage': 'sliders-h',
  'options': 'ellipsis-v',
  
  // Markdown toolbar
  'bold': 'bold',
  'italic': 'italic',
  'strikethrough': 'strikethrough',
  'code': 'code',
  'list': 'list-ul',
  'list-ordered': 'list-ol',
  'link': 'link',
  'image': 'image',
  'quote': 'quote-left',
  'code-block': 'file-code',
  'task': 'check-square',
  
  // Navigation and actions
  'save': 'save',
  'help': 'question-circle',
  'close': 'times',
  'search': 'search',
  'clear': 'times-circle',
  'create': 'plus',
  'delete': 'trash-alt',
  'history': 'history',
  'transfer': 'exchange-alt',
  
  // Editor controls
  'line-numbers': 'sort-numeric-up',
  'minimap': 'map',
  'word-wrap': 'text-width',
  
  // File types and content
  'document': 'file-alt',
  'schema': 'sitemap',
  'namespace': 'folder',
  
  // Form fields
  'text': 'font',
  'number': 'hashtag',
  'checkbox': 'check-square',
  'textarea': 'align-left',
  'email': 'at',
  'url': 'link',
  'date': 'calendar-alt',
  
  // Status and feedback
  'loading': 'spinner',
  'error': 'exclamation-triangle',
  'success': 'check-circle',
  'warning': 'exclamation-triangle',
  'info': 'info-circle',
  
  // Additional icons for migration
  'scroll': 'scroll',
  'help-circle': 'question-circle',
  'globe': 'globe',
  'wrench': 'wrench',
  'edit-alt': 'edit',
  'cog': 'cog',
  'trash': 'trash-alt',
  'sun': 'sun',
  'moon': 'moon',
  'robot': 'robot',
  'numbers': 'sort-numeric-up',
  'hash': 'hashtag'
}

// Style prefix mapping
const stylePrefix: Record<string, string> = {
  'solid': 'fas',
  'regular': 'far', 
  'light': 'fal',
  'brands': 'fab'
}

const iconClasses = computed(() => {
  if (isRobotIcon.value) return ''
  
  const iconName = iconMapping[props.name] || props.name
  const prefix = stylePrefix[props.style]
  
  return `${prefix} fa-${iconName}`
})
</script>

<style scoped>
.icon-emoji {
  display: inline-block;
  font-style: normal;
  line-height: 1;
}

/* Size variants */
.icon-xs {
  font-size: 0.75rem; /* 12px */
}

.icon-sm {
  font-size: 0.875rem; /* 14px */
}

.icon-base {
  font-size: 1rem; /* 16px */
}

.icon-lg {
  font-size: 1.125rem; /* 18px */
}

.icon-xl {
  font-size: 1.25rem; /* 20px */
}

.icon-2xl {
  font-size: 1.5rem; /* 24px */
}

/* Ensure icons align well with text */
i[class*="fa-"] {
  vertical-align: middle;
  line-height: 1;
}
</style>