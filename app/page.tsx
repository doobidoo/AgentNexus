/**
 * Home Page for Agent Nexus
 */

import dynamic from 'next/dynamic';

// Use dynamic imports with SSR disabled for client components
const AgentInterface = dynamic(() => import('../src/components/AgentInterface'), {
  ssr: false
});

const ArchitectureVisualizer = dynamic(() => import('../src/components/ArchitectureVisualizer'), {
  ssr: false
});

export default function Home() {
  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Agent Nexus</h1>
          <p className="text-xl text-gray-600">
            An advanced cognitive agent architecture framework
          </p>
        </header>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-3/5">
            <AgentInterface />
          </div>
          
          <div className="md:w-2/5">
            <ArchitectureVisualizer />
          </div>
        </div>
      </div>
    </main>
  );
}
