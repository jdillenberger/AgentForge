<template>
  <div class="instruct-editor">
    <div class="instruct-editor-header">
      <div class="editor-mode-selector">
        <button 
          @click="$emit('update:editor-mode', 'edit')" 
          :class="['mode-btn', { active: editorMode === 'edit' }]"
        >
          <Icon name="edit" size="sm" aria-label="Edit mode" />
          Edit
        </button>
        <button 
          @click="$emit('update:editor-mode', 'preview')" 
          :class="['mode-btn', { active: editorMode === 'preview' }]"
        >
          <Icon name="preview" size="sm" aria-label="Preview mode" />
          Preview
        </button>
        <button 
          @click="$emit('update:editor-mode', 'split')" 
          :class="['mode-btn', 'medium-hidden', { active: editorMode === 'split' }]"
        >
          <Icon name="split" size="sm" aria-label="Split mode" />
          Split
        </button>
      </div>
      
      <div class="editor-controls">
        <div class="editor-stats">
          <span class="stat-item">
            <span class="stat-label">Words:</span>
            <span class="stat-value">{{ wordCount }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">Characters:</span>
            <span class="stat-value">{{ charCount }}</span>
          </span>
          <span class="stat-item medium-hidden">
            <span class="stat-label">Lines:</span>
            <span class="stat-value">{{ lineCount }}</span>
          </span>
        </div>
        <div class="editor-options">
          <button @click="toggleLineNumbers" class="control-btn desktop-only" title="Toggle Line Numbers">
            <Icon name="line-numbers" size="xs" aria-label="Toggle line numbers" />
            Lines
          </button>
          <button @click="toggleMinimap" class="control-btn desktop-only medium-hidden" title="Toggle Minimap">
            <Icon name="minimap" size="xs" aria-label="Toggle minimap" />
            Map
          </button>
          <button @click="toggleWordWrap" class="control-btn desktop-only medium-hidden" title="Toggle Word Wrap">
            <Icon name="word-wrap" size="xs" aria-label="Toggle word wrap" />
            Wrap
          </button>
        </div>
      </div>
    </div>

    <div class="markdown-editor-toolbar">
      <div class="toolbar-group">
        <span class="toolbar-group-label">Format</span>
        <button @click="insertMarkdown('**', '**')" class="toolbar-btn" title="Bold (Ctrl+B)">
          <Icon name="bold" size="xs" aria-label="Bold" />
        </button>
        <button @click="insertMarkdown('*', '*')" class="toolbar-btn" title="Italic (Ctrl+I)">
          <Icon name="italic" size="xs" aria-label="Italic" />
        </button>
        <button @click="insertMarkdown('~~', '~~')" class="toolbar-btn" title="Strikethrough (Ctrl+Shift+S)">
          <Icon name="strikethrough" size="xs" aria-label="Strikethrough" />
        </button>
        <button @click="insertMarkdown('`', '`')" class="toolbar-btn" title="Inline Code (Ctrl+`)">
          <Icon name="code" size="xs" aria-label="Inline code" />
        </button>
      </div>
      
      <div class="toolbar-group">
        <span class="toolbar-group-label">Structure</span>
        <button @click="insertMarkdown('# ', '')" class="toolbar-btn" title="Heading 1 (Ctrl+1)">
          H1
        </button>
        <button @click="insertMarkdown('## ', '')" class="toolbar-btn" title="Heading 2 (Ctrl+2)">
          H2
        </button>
        <button @click="insertMarkdown('### ', '')" class="toolbar-btn" title="Heading 3 (Ctrl+3)">
          H3
        </button>
        <button @click="insertMarkdown('- ', '')" class="toolbar-btn" title="List Item (Ctrl+Shift+8)">
          <Icon name="list" size="xs" aria-label="Bulleted list" />
        </button>
      </div>
      
      <div class="toolbar-group">
        <span class="toolbar-group-label">Insert</span>
        <button @click="insertMarkdown('[', ']()', -1)" class="toolbar-btn" title="Link (Ctrl+K)">
          <Icon name="link" size="xs" aria-label="Link" />
        </button>
        <button @click="insertMarkdown('![]()', '', -3)" class="toolbar-btn" title="Image">
          <Icon name="image" size="xs" aria-label="Image" />
        </button>
        <button @click="insertCodeBlock()" class="toolbar-btn" title="Code Block (Ctrl+Shift+`)">
          <Icon name="code-block" size="xs" aria-label="Code block" />
        </button>
        <button @click="insertMarkdown('> ', '')" class="toolbar-btn" title="Quote (Ctrl+Shift+.)">
          <Icon name="quote" size="xs" aria-label="Quote" />
        </button>
      </div>
    </div>
    
    <div class="markdown-workspace" :class="`mode-${editorMode}`">
      <!-- Edit Mode -->
      <div v-if="editorMode === 'edit' || editorMode === 'split'" class="editor-panel">
        <div 
          ref="monacoContainer" 
          class="monaco-editor-container"
          :style="{ height: editorHeight }"
        ></div>
      </div>
      
      <!-- Preview Mode -->
      <div v-if="editorMode === 'preview' || editorMode === 'split'" class="preview-panel">
        <div class="preview-header">
          <span class="preview-title">
            <Icon name="preview" size="sm" aria-label="Preview" />
            Preview
          </span>
        </div>
        <div class="markdown-preview" v-html="markdownPreview"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'
import Icon from '../ui/Icon.vue'

// Props
const props = defineProps<{
  content: string
  editorMode: 'edit' | 'preview' | 'split'
  showLineNumbers: boolean
  isMobile: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:content': [value: string]
  'update:editor-mode': [mode: 'edit' | 'preview' | 'split']
  'toggle-line-numbers': []
  'sync-scroll': [event: Event]
}>()

// Refs
const monacoContainer = ref<HTMLDivElement>()
let monacoEditor: Monaco.editor.IStandaloneCodeEditor | null = null
let monaco: typeof Monaco | null = null

// Editor settings
const monacoLineNumbers = ref(props.showLineNumbers)
const minimapEnabled = ref(false) // Disabled by default for cleaner interface
const wordWrapEnabled = ref(true)
const editorHeight = ref('400px')

// Statistics
const wordCount = computed(() => {
  return props.content.trim() ? props.content.trim().split(/\s+/).length : 0
})

const charCount = computed(() => props.content.length)

const lineCount = computed(() => {
  return props.content ? props.content.split('\n').length : 1
})

// Markdown preview
const markdownPreview = computed(() => {
  if (!props.content.trim()) {
    return '<p class="empty-preview">Start writing to see preview...</p>'
  }
  
  let html = props.content
  
  // Split content by lines and process more systematically
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inCodeBlock = false
  let codeBlockContent = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Handle code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBlockContent = ''
        continue
      } else {
        inCodeBlock = false
        processedLines.push(`<pre><code>${codeBlockContent}</code></pre>`)
        continue
      }
    }
    
    if (inCodeBlock) {
      codeBlockContent += line + '\n'
      continue
    }
    
    // Headers
    if (line.match(/^### /)) {
      processedLines.push(line.replace(/^### (.*)$/, '<h3>$1</h3>'))
    } else if (line.match(/^## /)) {
      processedLines.push(line.replace(/^## (.*)$/, '<h2>$1</h2>'))
    } else if (line.match(/^# /)) {
      processedLines.push(line.replace(/^# (.*)$/, '<h1>$1</h1>'))
    }
    // Task lists
    else if (line.match(/^- \[ \] /)) {
      processedLines.push(line.replace(/^- \[ \] (.*)$/, '<div class="task-item"><input type="checkbox" disabled> $1</div>'))
    } else if (line.match(/^- \[x\] /)) {
      processedLines.push(line.replace(/^- \[x\] (.*)$/, '<div class="task-item"><input type="checkbox" disabled checked> $1</div>'))
    }
    // Regular lists
    else if (line.match(/^- /)) {
      processedLines.push(line.replace(/^- (.*)$/, '<li>$1</li>'))
    } else if (line.match(/^\d+\. /)) {
      processedLines.push(line.replace(/^\d+\. (.*)$/, '<li>$1</li>'))
    }
    // Blockquotes
    else if (line.match(/^> /)) {
      processedLines.push(line.replace(/^> (.*)$/, '<blockquote><p>$1</p></blockquote>'))
    }
    // Empty lines
    else if (line.trim() === '') {
      processedLines.push('')
    }
    // Regular paragraphs
    else {
      processedLines.push(`<p>${line}</p>`)
    }
  }
  
  // Join lines and wrap consecutive <li> elements in <ul>/<ol>
  html = processedLines.join('\n')
  
  // Group consecutive list items
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
    return `<ul>${match}</ul>`
  })
  
  // Remove empty paragraphs and fix formatting
  html = html
    .replace(/<p><\/p>/g, '')
    .replace(/\n+/g, '\n')
    
  // Apply text formatting
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="preview-image" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  
  return html
})

// Monaco Editor setup
const initializeMonaco = async () => {
  if (!monacoContainer.value) return

  try {
    monaco = await loader.init()
    
    // Configure Monaco for markdown
    monaco.languages.register({ id: 'markdown' })
    
    // Create editor
    monacoEditor = monaco.editor.create(monacoContainer.value, {
      value: props.content,
      language: 'markdown',
      theme: 'vs',
      automaticLayout: true,
      lineNumbers: monacoLineNumbers.value ? 'on' : 'off',
      minimap: {
        enabled: minimapEnabled.value
      },
      wordWrap: wordWrapEnabled.value ? 'on' : 'off',
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'var(--font-code)',
      padding: { top: 16, bottom: 16 },
      bracketPairColorization: {
        enabled: true
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
        insertMode: 'replace'
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      // Enhanced accessibility and markdown features
      accessibilitySupport: 'on',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      mouseWheelScrollSensitivity: 1,
      fastScrollSensitivity: 5,
      // Markdown-specific enhancements
      rulers: [], // No guide lines for cleaner interface
      renderWhitespace: 'boundary',
      renderLineHighlight: 'line',
      formatOnPaste: true,
      formatOnType: true,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      // Selection and find
      selectOnLineNumbers: true,
      selectionHighlight: true,
      occurrencesHighlight: 'singleFile',
      find: {
        addExtraSpaceOnTop: true,
        autoFindInSelection: 'multiline'
      }
    })

    // Listen for content changes
    monacoEditor.onDidChangeModelContent(() => {
      const value = monacoEditor?.getValue() || ''
      emit('update:content', value)
    })

    // Setup keyboard shortcuts
    setupKeyboardShortcuts()

    // Auto-resize editor based on content
    monacoEditor.onDidChangeModelContent(() => {
      nextTick(() => {
        updateEditorHeight()
      })
    })

    updateEditorHeight()

    // Set up resize observer for the container
    if (monacoContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        if (monacoEditor) {
          monacoEditor.layout()
        }
      })
      resizeObserver.observe(monacoContainer.value)
    }

  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
  }
}

const setupKeyboardShortcuts = () => {
  if (!monaco || !monacoEditor) return

  // Bold (Ctrl+B)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
    insertMarkdown('**', '**')
  })

  // Italic (Ctrl+I)  
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
    insertMarkdown('*', '*')
  })

  // Link (Ctrl+K)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
    insertMarkdown('[', ']()', -1)
  })

  // Strikethrough (Ctrl+Shift+S)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS, () => {
    insertMarkdown('~~', '~~')
  })

  // Code (Ctrl+`)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
    insertMarkdown('`', '`')
  })

  // Code block (Ctrl+Shift+`)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Backquote, () => {
    insertCodeBlock()
  })

  // Header 1 (Ctrl+1)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit1, () => {
    insertMarkdown('# ', '')
  })

  // Header 2 (Ctrl+2)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit2, () => {
    insertMarkdown('## ', '')
  })

  // Header 3 (Ctrl+3)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit3, () => {
    insertMarkdown('### ', '')
  })

  // Bulleted list (Ctrl+Shift+8)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit8, () => {
    insertMarkdown('- ', '')
  })

  // Quote (Ctrl+Shift+.)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Period, () => {
    insertMarkdown('> ', '')
  })

  // Toggle editor mode (Ctrl+Shift+P for preview)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
    const newMode = props.editorMode === 'preview' ? 'edit' : 'preview'
    emit('update:editor-mode', newMode)
  })

  // Focus search (Ctrl+F is already handled by Monaco)
  // Toggle line numbers (Ctrl+L)
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
    toggleLineNumbers()
  })
}

const updateEditorHeight = () => {
  if (!monacoEditor) return
  
  const contentHeight = Math.max(400, Math.min(800, lineCount.value * 20 + 32))
  editorHeight.value = `${contentHeight}px`
  
  nextTick(() => {
    monacoEditor?.layout()
  })
}

// Editor functions
const insertMarkdown = (before: string, after: string, cursorOffset: number = 0) => {
  if (!monacoEditor) return

  const selection = monacoEditor.getSelection()
  if (!selection) return

  const model = monacoEditor.getModel()
  if (!model) return

  const selectedText = model.getValueInRange(selection)
  const newText = before + selectedText + after

  monacoEditor.executeEdits('markdown-toolbar', [{
    range: selection,
    text: newText
  }])

  // Set cursor position
  const newPosition = {
    lineNumber: selection.endLineNumber,
    column: selection.endColumn + before.length + selectedText.length + after.length + cursorOffset
  }
  monacoEditor.setPosition(newPosition)
  monacoEditor.focus()
}

const insertCodeBlock = () => {
  insertMarkdown('```\n', '\n```', -4)
}

// Editor controls
const toggleLineNumbers = () => {
  monacoLineNumbers.value = !monacoLineNumbers.value
  monacoEditor?.updateOptions({
    lineNumbers: monacoLineNumbers.value ? 'on' : 'off'
  })
  emit('toggle-line-numbers')
}

const toggleMinimap = () => {
  minimapEnabled.value = !minimapEnabled.value
  monacoEditor?.updateOptions({
    minimap: { enabled: minimapEnabled.value }
  })
}

const toggleWordWrap = () => {
  wordWrapEnabled.value = !wordWrapEnabled.value
  monacoEditor?.updateOptions({
    wordWrap: wordWrapEnabled.value ? 'on' : 'off'
  })
}

// Watch for external content changes
watch(() => props.content, (newContent) => {
  if (monacoEditor && monacoEditor.getValue() !== newContent) {
    monacoEditor.setValue(newContent)
  }
})

// Watch for line numbers prop changes
watch(() => props.showLineNumbers, (show) => {
  monacoLineNumbers.value = show
  monacoEditor?.updateOptions({
    lineNumbers: show ? 'on' : 'off'
  })
})

// Watch for editor mode changes to handle layout
watch(() => props.editorMode, (newMode, oldMode) => {
  // If switching away from edit/split mode, dispose the editor
  if (oldMode && (oldMode === 'edit' || oldMode === 'split') && newMode === 'preview') {
    if (monacoEditor) {
      monacoEditor.dispose()
      monacoEditor = null
    }
    // Disconnect resize observer when editor is disposed
    resizeObserver?.disconnect()
    resizeObserver = null
  }
  
  // If switching to edit/split mode, ensure editor exists
  if (newMode === 'edit' || newMode === 'split') {
    nextTick(() => {
      // Always re-initialize if we don't have an editor instance
      if (monacoContainer.value && !monacoEditor) {
        initializeMonaco()
      } else if (monacoEditor) {
        // If editor exists, just re-layout
        setTimeout(() => {
          monacoEditor?.layout()
        }, 100)
      }
    })
  }
}, { immediate: false })

// Resize observer to handle container size changes
let resizeObserver: ResizeObserver | null = null

// Lifecycle
onMounted(() => {
  nextTick(() => {
    // Only initialize if we're in edit or split mode initially
    if (props.editorMode === 'edit' || props.editorMode === 'split') {
      initializeMonaco()
    }
  })
})

onUnmounted(() => {
  monacoEditor?.dispose()
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.instruct-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-white);
}

.instruct-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  flex-shrink: 0;
}

.editor-mode-selector {
  display: flex;
  gap: var(--spacing-1);
}

.mode-btn {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-normal);
}

.mode-btn:hover {
  background: var(--color-gray-100);
  border-color: var(--color-primary);
}

.mode-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.editor-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.editor-stats {
  display: flex;
  gap: var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.stat-label {
  font-weight: var(--font-weight-medium);
}

.stat-value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.editor-options {
  display: flex;
  gap: var(--spacing-2);
}

.control-btn {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-normal);
}

.control-btn:hover {
  background: var(--color-gray-100);
  border-color: var(--color-primary);
}

.markdown-editor-toolbar {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-white);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.toolbar-group-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-600);
  margin-right: var(--spacing-1);
}

.toolbar-btn {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-normal);
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: var(--color-gray-100);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.markdown-workspace {
  display: flex;
  flex: 1;
  min-height: 0;
}

.markdown-workspace.mode-edit .editor-panel {
  width: 100%;
}

.markdown-workspace.mode-preview .preview-panel {
  width: 100%;
}

.markdown-workspace.mode-split .editor-panel,
.markdown-workspace.mode-split .preview-panel {
  width: 50%;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-gray-200);
}

.monaco-editor-container {
  flex: 1;
  min-height: 400px;
  border: none;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-white);
}

.preview-header {
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
}

.preview-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.markdown-preview {
  flex: 1;
  padding: var(--spacing-4);
  overflow-y: auto;
  line-height: var(--line-height-relaxed);
  font-family: var(--font-content);
  font-size: var(--font-size-content-base);
}


/* Medium screen adjustments */
@media (max-width: 1100px) and (min-width: 769px) {
  .medium-hidden {
    display: none;
  }
  
  .instruct-editor-header {
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }
  
  .editor-controls {
    gap: var(--spacing-2);
  }
  
  .editor-stats {
    gap: var(--spacing-2);
  }
  
  /* Reduce font size for tighter spacing */
  .mode-btn {
    font-size: var(--font-size-xs);
    padding: var(--spacing-1) var(--spacing-2);
  }
  
  .control-btn {
    font-size: 10px;
    padding: var(--spacing-1);
  }
  
  .stat-item {
    font-size: var(--font-size-xs);
  }
  
  /* Toolbar adjustments for medium screens */
  .markdown-editor-toolbar {
    padding: var(--spacing-2) var(--spacing-3);
    gap: var(--spacing-3);
  }
  
  .toolbar-group {
    gap: var(--spacing-1);
  }
  
  .toolbar-btn {
    font-size: 10px;
    padding: var(--spacing-1);
    min-width: 1.5rem;
  }
}

@media (max-width: 768px) {
  .instruct-editor-header {
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: stretch;
  }
  
  .editor-controls {
    justify-content: space-between;
  }
  
  .markdown-editor-toolbar {
    gap: var(--spacing-2);
  }
  
  .toolbar-group {
    gap: var(--spacing-1);
  }
  
  .desktop-only {
    display: none;
  }
  
  .markdown-workspace.mode-split {
    flex-direction: column;
  }
  
  .markdown-workspace.mode-split .editor-panel,
  .markdown-workspace.mode-split .preview-panel {
    width: 100%;
    height: 50%;
  }
}
</style>

<!-- Non-scoped styles for markdown preview (v-html content) -->
<style>
.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
  margin-top: var(--spacing-5);
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-900);
  font-family: var(--font-display);
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
}

.markdown-preview h1:first-child,
.markdown-preview h2:first-child,
.markdown-preview h3:first-child {
  margin-top: 0;
}

.markdown-preview h1 {
  font-size: var(--font-size-display-base);
  border-bottom: 2px solid var(--color-gray-200);
  padding-bottom: var(--spacing-2);
}

.markdown-preview h2 {
  font-size: var(--font-size-display-sm);
}

.markdown-preview h3 {
  font-size: var(--font-size-lg);
}

.markdown-preview p {
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-700);
  font-family: var(--font-content);
  line-height: 1.7;
}

.markdown-preview ul,
.markdown-preview ol {
  margin-bottom: var(--spacing-3);
  padding-left: var(--spacing-5);
  font-family: var(--font-content);
}

.markdown-preview li {
  margin-bottom: var(--spacing-1);
  line-height: 1.6;
}

.markdown-preview ul {
  list-style-type: disc;
}

.markdown-preview ol {
  list-style-type: decimal;
}

.markdown-preview blockquote {
  border-left: 4px solid var(--color-primary);
  margin: var(--spacing-4) 0;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  font-style: italic;
  color: var(--color-gray-600);
  font-family: var(--font-content);
}

.markdown-preview blockquote p {
  margin-bottom: var(--spacing-2);
}

.markdown-preview blockquote p:last-child {
  margin-bottom: 0;
}

.markdown-preview code {
  background: var(--color-gray-100);
  padding: 2px var(--spacing-1);
  border-radius: var(--radius-sm);
  font-family: var(--font-code);
  font-size: 0.9em;
  border: 1px solid var(--color-gray-200);
  color: var(--color-gray-800);
}

.markdown-preview pre {
  background: var(--color-gray-900);
  color: var(--color-white);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--spacing-4) 0;
  border: 1px solid var(--color-gray-300);
  box-shadow: var(--shadow-sm);
}

.markdown-preview pre code {
  background: none;
  padding: 0;
  color: inherit;
  border: none;
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.markdown-preview img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  margin: var(--spacing-4) 0;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
}

.markdown-preview a {
  color: var(--color-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all var(--transition-normal);
}

.markdown-preview a:hover {
  text-decoration: none;
  border-bottom-color: var(--color-primary);
  color: var(--color-primary-dark);
}

.markdown-preview .task-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
  padding: var(--spacing-1) 0;
  font-family: var(--font-content);
  line-height: 1.6;
}

.markdown-preview .task-item input[type="checkbox"] {
  margin-top: 2px;
  margin-right: var(--spacing-1);
  cursor: not-allowed;
}

/* Improve spacing between different elements */
.markdown-preview > *:first-child {
  margin-top: 0;
}

.markdown-preview > *:last-child {
  margin-bottom: 0;
}

/* Better typography rhythm */
.markdown-preview h1 + p,
.markdown-preview h2 + p,
.markdown-preview h3 + p {
  margin-top: 0;
}

.markdown-preview p + h1,
.markdown-preview p + h2,
.markdown-preview p + h3 {
  margin-top: var(--spacing-6);
}

.markdown-preview .empty-preview {
  text-align: center;
  color: var(--color-gray-500);
  font-style: italic;
  margin-top: var(--spacing-8);
}
</style>