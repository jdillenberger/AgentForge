import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, AuthState, AppConfig } from '@/types/auth';
import { authService } from '@/services/auth.service';
import { configService } from '@/services/config.service';

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const error = ref<string | null>(null);
  const appConfig = ref<AppConfig | null>(null);

  // Getters
  const isAuthEnabled = computed(() => {
    return appConfig.value?.auth.enabled || false;
  });

  const userDisplayName = computed(() => {
    if (!user.value) return null;
    return user.value.name || 
           user.value.preferred_username || 
           user.value.email || 
           user.value.sub;
  });

  const userEmail = computed(() => {
    return user.value?.email || null;
  });

  const userRoles = computed(() => {
    return user.value?.roles || [];
  });

  const userGroups = computed(() => {
    return user.value?.groups || [];
  });

  const hasRole = computed(() => {
    return (role: string) => userRoles.value.includes(role);
  });

  const hasGroup = computed(() => {
    return (group: string) => userGroups.value.includes(group);
  });

  // Actions
  async function initialize(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      // Load app configuration
      appConfig.value = await configService.getAppConfig();

      // If auth is not enabled, we're done
      if (!appConfig.value.auth.enabled) {
        isAuthenticated.value = false;
        return;
      }

      // Check if user is already authenticated
      const currentUser = await authService.getUser();
      if (currentUser) {
        user.value = currentUser;
        isAuthenticated.value = true;
        accessToken.value = await authService.getAccessToken();
      } else {
        isAuthenticated.value = false;
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
      error.value = err instanceof Error ? err.message : 'Authentication initialization failed';
      isAuthenticated.value = false;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(returnTo?: string): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      if (!isAuthEnabled.value) {
        throw new Error('Authentication is not enabled');
      }

      await authService.login(returnTo);
    } catch (err) {
      console.error('Login failed:', err);
      error.value = err instanceof Error ? err.message : 'Login failed';
    } finally {
      isLoading.value = false;
    }
  }

  async function handleCallback(): Promise<string> {
    try {
      isLoading.value = true;
      error.value = null;

      const callbackUser = await authService.handleCallback();
      user.value = callbackUser;
      isAuthenticated.value = true;
      accessToken.value = await authService.getAccessToken();

      // Get return URL
      const returnUrl = authService.getReturnUrl();
      return returnUrl;
    } catch (err) {
      console.error('Callback handling failed:', err);
      error.value = err instanceof Error ? err.message : 'Login callback failed';
      isAuthenticated.value = false;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      if (isAuthenticated.value) {
        await authService.logout();
      }
      
      // Clear local state
      user.value = null;
      isAuthenticated.value = false;
      accessToken.value = null;
    } catch (err) {
      console.error('Logout failed:', err);
      error.value = err instanceof Error ? err.message : 'Logout failed';
      
      // Still clear local state even if logout request failed
      user.value = null;
      isAuthenticated.value = false;
      accessToken.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshToken(): Promise<boolean> {
    try {
      if (!isAuthEnabled.value) {
        return false;
      }

      const refreshedUser = await authService.refreshToken();
      if (refreshedUser) {
        user.value = refreshedUser;
        isAuthenticated.value = true;
        accessToken.value = await authService.getAccessToken();
        return true;
      } else {
        // Token refresh failed, clear auth state
        user.value = null;
        isAuthenticated.value = false;
        accessToken.value = null;
        return false;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      error.value = err instanceof Error ? err.message : 'Token refresh failed';
      
      // Clear auth state on refresh failure
      user.value = null;
      isAuthenticated.value = false;
      accessToken.value = null;
      return false;
    }
  }

  async function checkAuthStatus(): Promise<boolean> {
    try {
      if (!isAuthEnabled.value) {
        return false;
      }

      const isAuth = await authService.isAuthenticated();
      
      if (isAuth && !isAuthenticated.value) {
        // User is authenticated but store state is stale, refresh
        const currentUser = await authService.getUser();
        if (currentUser) {
          user.value = currentUser;
          isAuthenticated.value = true;
          accessToken.value = await authService.getAccessToken();
        }
      } else if (!isAuth && isAuthenticated.value) {
        // User is not authenticated but store thinks they are, clear state
        user.value = null;
        isAuthenticated.value = false;
        accessToken.value = null;
      }

      return isAuth;
    } catch (err) {
      console.error('Auth status check failed:', err);
      return false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function clearAuth(): void {
    user.value = null;
    isAuthenticated.value = false;
    accessToken.value = null;
    error.value = null;
  }

  // Utility method to make authenticated API calls
  async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (!isAuthEnabled.value) {
      // If auth is disabled, make regular fetch
      return fetch(url, options);
    }

    if (!isAuthenticated.value) {
      throw new Error('User is not authenticated');
    }

    try {
      return await authService.authenticatedFetch(url, options);
    } catch (err) {
      // If request fails due to auth, try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the request with new token
        return await authService.authenticatedFetch(url, options);
      } else {
        // Refresh failed, redirect to login
        throw new Error('Authentication expired');
      }
    }
  }

  return {
    // State
    isAuthenticated,
    isLoading,
    user,
    accessToken,
    error,
    appConfig,
    
    // Getters
    isAuthEnabled,
    userDisplayName,
    userEmail,
    userRoles,
    userGroups,
    hasRole,
    hasGroup,
    
    // Actions
    initialize,
    login,
    handleCallback,
    logout,
    refreshToken,
    checkAuthStatus,
    clearError,
    clearAuth,
    authenticatedFetch,
  };
});