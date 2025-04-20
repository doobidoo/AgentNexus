"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiKeyManager } from '@/core/auth/keyManager';

interface ApiKeyConfigProps {
  onConfigChange?: (validProviders: string[]) => void;
}

export default function ApiKeyConfig({ onConfigChange }: ApiKeyConfigProps) {
  const [keys, setKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    gemini: '',
  });
  
  const [validProviders, setValidProviders] = useState<string[]>([]);
  const [saveLocally, setSaveLocally] = useState<Record<string, boolean>>({
    openai: false,
    anthropic: false,
    gemini: false,
  });
  
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({
    openai: false,
    anthropic: false,
    gemini: false,
  });
  
  // Update list of valid providers
  const updateValidProviders = useCallback(() => {
    const providers = apiKeyManager.getValidProviders();
    setValidProviders(providers);
    if (onConfigChange) {
      onConfigChange(providers);
    }
  }, [onConfigChange]);
  
  // Load existing keys on mount
  useEffect(() => {
    const loadedKeys: Record<string, string> = {
      openai: apiKeyManager.getKey('openai') || '',
      anthropic: apiKeyManager.getKey('anthropic') || '',
      gemini: apiKeyManager.getKey('gemini') || '',
    };
    
    setKeys(loadedKeys);
    updateValidProviders();
  }, [updateValidProviders]);
  
  // Handle key changes
  const handleKeyChange = (provider: string, value: string) => {
    setKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };
  
  // Handle save locally toggle
  const handleSaveLocallyChange = (provider: string) => {
    setSaveLocally(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };
  
  // Handle show/hide password
  const toggleShowPassword = (provider: string) => {
    setShowPassword(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };
  
  // Save API key
  const saveApiKey = (provider: string) => {
    const key = keys[provider];
    if (key) {
      apiKeyManager.setKey(provider, key, saveLocally[provider]);
      updateValidProviders();
    }
  };
  
  // Delete API key
  const deleteApiKey = (provider: string) => {
    apiKeyManager.deleteKey(provider);
    setKeys(prev => ({
      ...prev,
      [provider]: ''
    }));
    updateValidProviders();
  };
  
  // Verify API key (placeholder for actual verification)
  const verifyApiKey = async (provider: string) => {
    // This would be implemented with an actual API call to verify the key
    // For now, we'll just simulate a successful verification
    const key = keys[provider];
    if (key) {
      try {
        // Simulated verification delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        apiKeyManager.setKey(provider, key, saveLocally[provider]);
        updateValidProviders();
        return true;
      } catch (error) {
        console.error(`Failed to verify ${provider} API key:`, error);
        return false;
      }
    }
    return false;
  };
  
  const providerConfigs = [
    {
      name: 'OpenAI',
      id: 'openai',
      icon: '🤖',
      placeholder: 'sk-...',
      helpText: 'Get your API key from OpenAI dashboard',
      url: 'https://platform.openai.com/api-keys',
    },
    {
      name: 'Anthropic',
      id: 'anthropic',
      icon: '🌀',
      placeholder: 'sk-ant-...',
      helpText: 'Get your API key from Claude API Console',
      url: 'https://console.anthropic.com/keys',
    },
    {
      name: 'Google Gemini',
      id: 'gemini',
      icon: '🌎',
      placeholder: 'API key',
      helpText: 'Get your API key from Google AI Studio',
      url: 'https://aistudio.google.com/app/apikey',
    },
  ];
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">API Key Configuration</h2>
      
      <div className="space-y-6">
        {providerConfigs.map(provider => (
          <div key={provider.id} className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">{provider.icon}</span>
              <h3 className="text-lg font-semibold">{provider.name}</h3>
              {validProviders.includes(provider.id) && (
                <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Valid
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type={showPassword[provider.id] ? "text" : "password"}
                  id={`${provider.id}-key`}
                  placeholder={provider.placeholder}
                  value={keys[provider.id]}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword(provider.id)}
                  className="ml-2 px-3 py-2 bg-gray-100 rounded"
                >
                  {showPassword[provider.id] ? "Hide" : "Show"}
                </button>
              </div>
              
              <div className="flex items-center mb-2">
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={saveLocally[provider.id]}
                    onChange={() => handleSaveLocallyChange(provider.id)}
                    className="mr-2"
                  />
                  Save locally (encrypted)
                </label>
                
                <a
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-sm text-blue-600 hover:underline"
                >
                  Get API Key
                </a>
              </div>
              
              <p className="text-xs text-gray-500">{provider.helpText}</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => saveApiKey(provider.id)}
                disabled={!keys[provider.id]}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
              >
                Save
              </button>
              
              <button
                onClick={() => verifyApiKey(provider.id)}
                disabled={!keys[provider.id]}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-green-300"
              >
                Verify
              </button>
              
              <button
                onClick={() => deleteApiKey(provider.id)}
                disabled={!keys[provider.id]}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Provider Status</h3>
        <div className="space-y-2">
          {validProviders.length > 0 ? (
            <>
              <p className="text-sm text-gray-700">The following providers are configured and ready to use:</p>
              <ul className="list-disc pl-5">
                {validProviders.map(provider => (
                  <li key={provider} className="text-sm">
                    {providerConfigs.find(p => p.id === provider)?.name || provider}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-yellow-600">
              No model providers configured. Please add at least one API key to use advanced features.
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-xs text-gray-500">
        <p>
          <strong>Note:</strong> When saving locally, your API keys are encrypted before being stored in 
          your browser&apos;s local storage. This allows the application to remember your keys between sessions.
          Your keys are never sent to any server except the respective API provider.
        </p>
      </div>
    </div>
  );
}