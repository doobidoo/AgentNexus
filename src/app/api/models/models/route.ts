/**
 * API route for getting available models for a provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { modelManager } from '@/core/models/factory';

// Map of provider-specific models - in a real implementation, this would come from the API
const PROVIDER_MODELS: Record<string, string[]> = {
  'openai': [
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ],
  'anthropic': [
    'claude-3-7-sonnet-20250219',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229'
  ],
  'gemini': [
    'gemini-1.5-pro',
    'gemini-1.0-pro'
  ],
  'ollama': [
    'llama3',
    'mistral',
    'llava'
  ]
};

export async function GET(request: NextRequest) {
  try {
    // Get the provider from query params
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider');
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider parameter is required' },
        { status: 400 }
      );
    }
    
    // Check if the provider exists
    if (!modelManager.listProviders().includes(provider)) {
      return NextResponse.json(
        { error: `Provider "${provider}" not found` },
        { status: 404 }
      );
    }
    
    // Get the info for the provider
    const providerInfo = modelManager.getProvider(provider).getInfo();
    
    // Get models for the provider
    const models = PROVIDER_MODELS[provider] || [providerInfo.defaultCompletionModel];
    
    return NextResponse.json({
      provider,
      models,
      defaultModel: providerInfo.defaultCompletionModel
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
