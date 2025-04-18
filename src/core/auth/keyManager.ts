/**
 * API Key Management System
 * 
 * Provides secure handling of API keys for various model providers.
 * Includes validation, secure storage, and runtime updates.
 */

import crypto from 'crypto';

export interface ApiKeyConfig {
  provider: string;
  key: string;
  isValid?: boolean;
  validUntil?: Date;
}

export class ApiKeyManager {
  private keys: Map<string, ApiKeyConfig> = new Map();
  private encryptionKey: string;
  
  constructor(encryptionKey?: string) {
    // Use provided key or generate a session-specific one
    this.encryptionKey = encryptionKey || crypto.randomBytes(32).toString('hex');
    this.loadKeysFromEnvironment();
  }
  
  /**
   * Load API keys from environment variables
   */
  private loadKeysFromEnvironment() {
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.setKey('openai', process.env.OPENAI_API_KEY);
    }
    
    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.setKey('anthropic', process.env.ANTHROPIC_API_KEY);
    }
    
    // Gemini
    if (process.env.GEMINI_API_KEY) {
      this.setKey('gemini', process.env.GEMINI_API_KEY);
    }
  }
  
  /**
   * Set an API key for a provider
   * 
   * @param provider Provider name
   * @param key API key
   * @param persist Whether to persist the key to localStorage (client-side only)
   * @returns True if key was set successfully
   */
  setKey(provider: string, key: string, persist = false): boolean {
    if (!key || key.trim() === '') {
      console.warn(`Empty API key provided for ${provider}`);
      return false;
    }
    
    // Store the key in memory
    this.keys.set(provider, {
      provider,
      key,
      isValid: true, // Assume valid until proven otherwise
    });
    
    // Persist to localStorage if requested and in browser environment
    if (persist && typeof window !== 'undefined') {
      try {
        // Encrypt key before storing
        const encryptedKey = this.encryptKey(key);
        window.localStorage.setItem(`api_key_${provider}`, encryptedKey);
      } catch (error) {
        console.error(`Failed to persist API key for ${provider}:`, error);
      }
    }
    
    return true;
  }
  
  /**
   * Get an API key for a provider
   * 
   * @param provider Provider name
   * @returns API key or null if not found
   */
  getKey(provider: string): string | null {
    const keyConfig = this.keys.get(provider);
    
    if (!keyConfig) {
      // If key not in memory, try to load from localStorage
      if (typeof window !== 'undefined') {
        try {
          const encryptedKey = window.localStorage.getItem(`api_key_${provider}`);
          if (encryptedKey) {
            const key = this.decryptKey(encryptedKey);
            this.setKey(provider, key);
            return key;
          }
        } catch (error) {
          console.error(`Failed to load API key for ${provider} from localStorage:`, error);
        }
      }
      
      return null;
    }
    
    // If key has expired, return null
    if (keyConfig.validUntil && keyConfig.validUntil < new Date()) {
      console.warn(`API key for ${provider} has expired`);
      return null;
    }
    
    // If key is marked as invalid, return null
    if (keyConfig.isValid === false) {
      console.warn(`API key for ${provider} is marked as invalid`);
      return null;
    }
    
    return keyConfig.key;
  }
  
  /**
   * Check if a provider has a valid API key
   * 
   * @param provider Provider name
   * @returns True if provider has a valid key
   */
  hasValidKey(provider: string): boolean {
    return this.getKey(provider) !== null;
  }
  
  /**
   * Mark a key as invalid (e.g., after API rejection)
   * 
   * @param provider Provider name
   */
  invalidateKey(provider: string) {
    const keyConfig = this.keys.get(provider);
    if (keyConfig) {
      keyConfig.isValid = false;
      this.keys.set(provider, keyConfig);
      
      // Remove from localStorage if in browser environment
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`api_key_${provider}`);
      }
    }
  }
  
  /**
   * Get list of providers with valid keys
   * 
   * @returns Array of provider names
   */
  getValidProviders(): string[] {
    return Array.from(this.keys.keys())
      .filter(provider => this.hasValidKey(provider));
  }
  
  /**
   * Check which required keys are missing
   * 
   * @param requiredProviders Array of required provider names
   * @returns Array of missing provider names
   */
  getMissingKeys(requiredProviders: string[]): string[] {
    return requiredProviders.filter(provider => !this.hasValidKey(provider));
  }
  
  /**
   * Delete an API key
   * 
   * @param provider Provider name
   */
  deleteKey(provider: string) {
    this.keys.delete(provider);
    
    // Remove from localStorage if in browser environment
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`api_key_${provider}`);
    }
  }
  
  /**
   * Encrypt an API key for storage
   * 
   * @param key API key to encrypt
   * @returns Encrypted key
   */
  private encryptKey(key: string): string {
    // Simple encryption for demo purposes
    // In production, use a more secure encryption method
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(this.encryptionKey.slice(0, 32), 'hex'), 
      iv
    );
    
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypt an encrypted API key
   * 
   * @param encryptedKey Encrypted key
   * @returns Decrypted key
   */
  private decryptKey(encryptedKey: string): string {
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(this.encryptionKey.slice(0, 32), 'hex'), 
      iv
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Create a singleton instance
export const apiKeyManager = new ApiKeyManager();

// Export helper functions
export function getModelKey(provider: string): string | null {
  return apiKeyManager.getKey(provider);
}

export function setModelKey(provider: string, key: string, persist = false): boolean {
  return apiKeyManager.setKey(provider, key, persist);
}

export function getValidProviders(): string[] {
  return apiKeyManager.getValidProviders();
}
