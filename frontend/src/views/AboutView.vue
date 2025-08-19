<template>
  <div class="about">
    <div class="about-content">
      <h1>AI Agent Configuration Hub</h1>
      <p>Configure and manage your AI agents with structured schemas and instruction templates.</p>
      
      <div class="features">
        <h2>Features</h2>
        <ul>
          <li>🤖 Create and configure different types of AI agents</li>
          <li><Icon name="settings" size="sm" /> Schema-based configuration management</li>
          <li><Icon name="edit" size="sm" /> Rich instruction editor with live preview</li>
          <li>🔐 Secure namespace-based access control</li>
          <li><Icon name="save" size="sm" /> Git-based version control and storage</li>
        </ul>
      </div>
      
      <div class="workflow">
        <h2>How it works</h2>
        <ol>
          <li>Each file represents one AI agent configuration</li>
          <li>Frontmatter contains agent settings and parameters</li>
          <li>Markdown content provides instructions for the agent</li>
          <li>Schemas define structured configuration options for different agent types</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../components/ui/Icon.vue'
</script>

<style>
.about {
  padding: var(--spacing-6);
  max-width: 800px;
  margin: 0 auto;
}

.about-content h1 {
  font-family: var(--font-display);
  font-size: var(--font-size-display-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-4);
}

.about-content > p {
  font-family: var(--font-content);
  font-size: var(--font-size-content-base);
  line-height: 1.7;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-6);
}

.features h2, .workflow h2 {
  font-family: var(--font-display);
  font-size: var(--font-size-display-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-4);
}

.features ul, .workflow ol {
  font-family: var(--font-content);
  font-size: var(--font-size-content-sm);
  line-height: 1.6;
  color: var(--color-gray-700);
}

.features li, .workflow li {
  margin-bottom: var(--spacing-2);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.features {
  margin-bottom: var(--spacing-6);
}

@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding: var(--spacing-8);
  }
}
</style>
