/**
 * Model Selector Component
 * 
 * A UI component for selecting and configuring the AI model provider
 */

'use client';

import React, { useState, useEffect } from 'react';

interface ModelInfo {
  provider: string;
  model: string;
  availableModels?: string[];
}

interface ModelSelectorProps {
  initialProvider?: string;
  initialModel?: string;
  onProviderChange?: (provider: string, model: string) => void;
}

export default function ModelSelector({ 
  initialProvider = 'openai', 
  initialModel = '', 
  onProviderChange 
}: ModelSelectorProps) {
  const [provider, setProvider] = useState(initialProvider);
  const [model, setModel] = useState(initialModel);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch available providers on component mount
  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch('/api/models/providers');
        const data = await response.json();
        
        if (data.providers && data.providers.length > 0) {
          setAvailableProviders(data.providers);
          
          // Set default provider and model if not already set
          if (!initialProvider) {
            setProvider(data.providers[0]);
          }
          
          if (!initialModel && data.defaultModels && data.defaultModels[provider]) {
            setModel(data.defaultModels[provider]);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching model providers:', error);
        setIsLoading(false);
      }
    }
    
    fetchProviders();
  }, [initialProvider, initialModel, provider]);
  
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    
    // Reset model when provider changes
    setModel('');
    
    // Fetch models for the new provider
    fetchModels(newProvider);
  };
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setModel(newModel);
    
    // Notify parent component
    if (onProviderChange) {
      onProviderChange(provider, newModel);
    }
  };
  
  const fetchModels = async (providerName: string) => {
    try {
      const response = await fetch(`/api/models/models?provider=${providerName}`);
      const data = await response.json();
      
      if (data.models && data.models.length > 0) {
        // Auto-select the first model
        setModel(data.models[0]);
        
        // Notify parent component
        if (onProviderChange) {
          onProviderChange(providerName, data.models[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center">Loading model providers...</div>;
  }
  
  if (availableProviders.length === 0) {
    return <div className="text-yellow-500">No model providers configured</div>;
  }
  
  return (
    <div className="bg-gray-100 p-3 rounded-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center">
        <div className="flex flex-col mb-2 md:mb-0 md:mr-4">
          <label htmlFor="provider-select" className="text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select
            id="provider-select"
            value={provider}
            onChange={handleProviderChange}
            className="border rounded p-2 min-w-32"
          >
            {availableProviders.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col">
          <label htmlFor="model-select" className="text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            id="model-select"
            value={model}
            onChange={handleModelChange}
            className="border rounded p-2 min-w-40"
            disabled={!model}
          >
            {!model ? (
              <option value="">Loading models...</option>
            ) : (
              <option value={model}>{model}</option>
            )}
          </select>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Currently using: <span className="font-medium">{provider}</span> / <span className="font-medium">{model || 'Default model'}</span>
      </div>
    </div>
  );
}
