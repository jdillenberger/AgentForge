<template>
  <div class="no-agent-selected">
    <div class="no-agent-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-icon">
          <div class="loading-spinner"></div>
        </div>
        <h3>Loading Your Agents...</h3>
        <p>Please wait while we fetch your AI agent configurations</p>
      </div>
      
      <!-- Agent Selection State -->
      <div v-else-if="hasAgents" class="selection-state">
        <div class="no-agent-icon">🤖</div>
        <h3>Select an AI Agent</h3>
        <p>Choose an agent from the sidebar to configure its settings and instructions</p>
      </div>
      
      <!-- No Agents State -->
      <div v-else class="empty-state">
        <div class="no-agent-icon">🤖</div>
        <h3>Create Your First AI Agent</h3>
        <p>Get started by creating your first AI agent configuration</p>
        <!--<button 
          @click="$emit('create-agent')" 
          class="btn btn-primary btn-lg create-first-agent-btn"
        >
           <span class="btn-icon">✨</span>
          Create First Agent
        </button> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  hasAgents: boolean
  loading: boolean
}>()

defineEmits<{
  'create-agent': []
}>()
</script>

<style scoped>
.no-agent-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%);
  position: relative;
  overflow: hidden;
}

.no-agent-selected::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
  animation: backgroundPulse 8s ease-in-out infinite;
}

.no-agent-content {
  text-align: center;
  max-width: 480px;
  padding: var(--spacing-8);
  position: relative;
  z-index: 1;
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-gray-200);
  animation: fadeInUp 0.6s ease-out;
}

/* Loading State */
.loading-state {
  animation: fadeInScale 0.5s ease-out;
}

.loading-icon {
  margin-bottom: var(--spacing-4);
  display: flex;
  justify-content: center;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Selection State */
.selection-state {
  animation: fadeInScale 0.5s ease-out;
}

/* Empty State */
.empty-state {
  animation: fadeInScale 0.5s ease-out;
}

.no-agent-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-4);
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  position: relative;
}

.no-agent-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
  animation: iconGlow 2s ease-in-out infinite alternate;
}

.no-agent-content h3 {
  margin: 0 0 var(--spacing-3) 0;
  color: var(--color-gray-900);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-2xl);
  font-family: var(--font-display);
  background: linear-gradient(135deg, var(--color-gray-900) 0%, #1e40af 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slideInFromLeft 0.6s ease-out 0.2s both;
}

.no-agent-content p {
  margin: 0 0 var(--spacing-6) 0;
  color: var(--color-gray-600);
  line-height: var(--line-height-relaxed);
  font-size: var(--font-size-lg);
  font-family: var(--font-content);
  animation: slideInFromLeft 0.6s ease-out 0.3s both;
}

.create-first-agent-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4) var(--spacing-6);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-xl);
  transition: all var(--transition-normal);
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: var(--color-white);
  border: none;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
  animation: slideInFromBottom 0.6s ease-out 0.4s both;
  cursor: pointer;
}

.create-first-agent-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s ease;
}

.create-first-agent-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
}

.create-first-agent-btn:hover::before {
  left: 100%;
}

.create-first-agent-btn:active {
  transform: translateY(-1px) scale(1.01);
}

.btn-icon {
  font-size: 1.2em;
  animation: sparkle 2s ease-in-out infinite;
}

/* Keyframe animations */
@keyframes backgroundPulse {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
  50% { transform: scale(1.1) rotate(180deg); opacity: 0.6; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes iconGlow {
  0% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes slideInFromLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInFromBottom {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .no-agent-selected {
    min-height: 50vh;
    padding: var(--spacing-4);
  }
  
  .no-agent-content {
    padding: var(--spacing-6);
    max-width: 100%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  .no-agent-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-3);
  }
  
  .no-agent-content h3 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-2);
  }
  
  .no-agent-content p {
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-5);
  }
  
  .create-first-agent-btn {
    padding: var(--spacing-3) var(--spacing-5);
    font-size: var(--font-size-base);
  }
  
  .loading-spinner {
    width: 50px;
    height: 50px;
  }
}
</style>