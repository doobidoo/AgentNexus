/**
 * API route for getting available model providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { modelManager } from '@/core/models/factory';

export async function GET(_request: NextRequest) {
  try {
    // Get the list of available providers
    const providers = modelManager.listProviders();
    
    // Create a map of default models for each provider
    const defaultModels: Record<string, string> = {};
    for (const provider of providers) {
      try {
        const info = modelManager.getProvider(provider).getInfo();
        defaultModels[provider] = info.defaultCompletionModel;
      } catch (error) {
        console.error(`Error getting info for provider ${provider}:`, error);
      }
    }
    
    return NextResponse.json({
      providers,
      defaultModels,
      defaultProvider: providers.length > 0 ? providers[0] : null
    });
  } catch (error) {
    console.error('Error fetching model providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model providers' },
      { status: 500 }
    );
  }
}
