<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content help-modal" @click.stop>
      <div class="modal-header">
        <h2>
          <Icon name="help" size="sm" aria-label="Help" />
          AI Agent Configuration Hub - Help
        </h2>
        <button @click="$emit('close')" class="modal-close">×</button>
      </div>
      <div class="modal-body help-content">
        <div class="help-section">
          <h3>
            <Icon name="robot" size="sm" aria-label="Agents" />
            What are AI Agents?
          </h3>
          <p>AI Agents are configurations that define how AI assistants behave. Each agent has:</p>
          <ul>
            <li><strong>Settings</strong> - Configuration parameters like model, temperature, etc.</li>
            <li><strong>Instructions</strong> - The system prompt that defines the agent's role and behavior</li>
            <li><strong>Schema</strong> - Structured configuration options for different agent types</li>
          </ul>
        </div>
        
        <div class="help-section">
          <h3>
            <Icon name="wrench" size="sm" aria-label="Tools" />
            Using the Editor
          </h3>
          <div class="help-subsection">
            <h4>
              <Icon name="configure" size="xs" aria-label="Configure" />
              Configure Tab
            </h4>
            <p>Set up your agent's parameters like model settings, temperature, and other configuration options. If your agent has a schema, you'll see a structured form.</p>
          </div>
          <div class="help-subsection">
            <h4>
              <Icon name="edit" size="xs" aria-label="Instruct" />
              Instruct Tab
            </h4>
            <p>Write the instructions that define your agent's role, personality, and how it should respond. This is the system prompt that guides the AI's behavior.</p>
          </div>
          <div class="help-subsection">
            <h4>
              <Icon name="settings" size="xs" aria-label="Manage" />
              Manage Tab
            </h4>
            <p>Handle agent permissions, view history, transfer between permission groups, and delete agents.</p>
          </div>
        </div>
        
        <div class="help-section">
          <h3>
            <Icon name="info" size="sm" aria-label="Security" />
            Permission Groups
          </h3>
          <ul>
            <li><strong>Private</strong> - Only you can access and edit</li>
            <li><strong>Team</strong> - Shared with your team or organization</li>
            <li><strong>Public</strong> - Accessible to everyone</li>
          </ul>
        </div>
        
        <div class="help-section">
          <h3>
            <Icon name="document" size="sm" aria-label="Files" />
            File Naming
          </h3>
          <p>Agent files follow the pattern: <code>name.schemaType.md</code></p>
          <p>Example: <code>customer-support.chatbot.md</code></p>
        </div>
        
        <div class="help-section">
          <h3>
            <Icon name="settings" size="sm" aria-label="Shortcuts" />
            Keyboard Shortcuts
          </h3>
          <ul>
            <li><strong>Ctrl/Cmd + S</strong> - Save changes</li>
            <li><strong>Ctrl/Cmd + /</strong> - Toggle help</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue'

defineProps<{
  show: boolean
}>()

defineEmits<{
  'close': []
}>()
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.help-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-display-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  overflow-y: auto;
  flex: 1;
}

.help-content {
  padding: 20px 24px;
}

.help-section {
  margin-bottom: 24px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h3 {
  margin: 0 0 12px 0;
  font-family: var(--font-display);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.help-section p {
  margin: 0 0 8px 0;
  color: #374151;
  line-height: 1.6;
  font-family: var(--font-content);
  font-size: var(--font-size-content-sm);
}

.help-section ul {
  margin: 8px 0;
  padding-left: 20px;
  color: #374151;
  font-family: var(--font-content);
  font-size: var(--font-size-content-sm);
}

.help-section li {
  margin-bottom: 4px;
  line-height: 1.6;
  font-family: var(--font-content);
}

.help-subsection {
  margin-bottom: 16px;
}

.help-subsection h4 {
  margin: 0 0 8px 0;
  font-family: var(--font-display);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-800);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.help-subsection p {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
  font-family: var(--font-content);
  font-size: var(--font-size-content-sm);
}

code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-code);
  font-size: 0.875em;
  color: #d97706;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .help-content {
    padding: 16px 20px;
  }
  
  .modal-header {
    padding: 16px 20px 12px;
  }
  
  .modal-header h2 {
    font-size: 1.125rem;
  }
}
</style>