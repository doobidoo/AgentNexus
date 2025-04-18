/**
 * Architecture Visualizer Component
 * 
 * Visualizes the Agent Nexus cognitive architecture
 */

'use client';

import React, { useState } from 'react';

interface ComponentProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

function ArchitectureComponent({ title, description, children }: ComponentProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <span>{expanded ? '▼' : '►'}</span>
      </div>
      
      {expanded && (
        <div className="mt-2">
          <p className="text-gray-600 mb-4">{description}</p>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ArchitectureVisualizer() {
  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Agent Nexus Cognitive Architecture</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ArchitectureComponent
          title="Memory System"
          description="Stores and retrieves information with short-term and long-term components."
        >
          <div className="space-y-2">
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-medium">Short-term Memory</h4>
              <p className="text-sm">Maintains immediate context and conversation history.</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-medium">Long-term Memory</h4>
              <p className="text-sm">Stores persistent knowledge with vector-based retrieval.</p>
            </div>
          </div>
        </ArchitectureComponent>
        
        <ArchitectureComponent
          title="Tools Management"
          description="Provides access to specialized capabilities for solving problems."
        >
          <div className="space-y-2">
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-medium">VectorSearch</h4>
              <p className="text-sm">Semantic similarity search using vector embeddings.</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-medium">TextGeneration</h4>
              <p className="text-sm">Context-aware content creation (coming soon).</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-medium">Other Tools</h4>
              <p className="text-sm">CodeExecutor, WebBrowser, ImageAnalysis, KnowledgeGraph, DocAnalysis, RAGRetrieval (in development)</p>
            </div>
          </div>
        </ArchitectureComponent>
        
        <ArchitectureComponent
          title="Planning System"
          description="The cognitive center for sophisticated problem-solving."
        >
          <div className="space-y-2">
            <div className="bg-purple-50 p-3 rounded">
              <h4 className="font-medium">Reflection</h4>
              <p className="text-sm">Self-assessment of reasoning processes and decisions.</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <h4 className="font-medium">Self-critics</h4>
              <p className="text-sm">Error identification and correction mechanisms.</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <h4 className="font-medium">Chain of Thoughts</h4>
              <p className="text-sm">Transparent reasoning pathways for problem-solving.</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <h4 className="font-medium">Subgoal Decomposition</h4>
              <p className="text-sm">Breaking complex problems into manageable tasks.</p>
            </div>
          </div>
        </ArchitectureComponent>
        
        <ArchitectureComponent
          title="Action System"
          description="Executes plans and processes feedback for continuous improvement."
        >
          <div className="space-y-2">
            <div className="bg-amber-50 p-3 rounded">
              <h4 className="font-medium">Execution</h4>
              <p className="text-sm">Implements plans with monitoring capabilities.</p>
            </div>
            <div className="bg-amber-50 p-3 rounded">
              <h4 className="font-medium">Feedback</h4>
              <p className="text-sm">Collects and processes execution results for learning.</p>
            </div>
          </div>
        </ArchitectureComponent>
      </div>
      
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Architecture Diagram</h3>
        <div className="p-4 border rounded bg-white">
          <pre className="text-xs overflow-auto text-left">
            {`
            Agent
              │
┌─────────┬─┴───────┬─────────┐
│         │         │         │
Memory   Tools    Planning   Action
│ │       │ │ │     │ │ │ │   │ │
│ │       │ │ │     │ │ │ │   │ │
↓ ↓       ↓ ↓ ↓     ↓ ↓ ↓ ↓   ↓ ↓
S L       V T C ... R S C S   E F
T T       S G E     E E O U   X E
          R E X     F L T B   E E
                    L F H G   C D
                    E C O O   U B
                    C R U A   T A
                    T I G L   I C
                    I T H     O K
                    O I T     N
                    N C S
            `}
          </pre>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          ST: Short-term Memory, LT: Long-term Memory<br/>
          VS: VectorSearch, TG: TextGeneration, CE: CodeExecutor, ...<br/>
          REFL: Reflection, SELFC: Self-critics, COTH: Chain of Thoughts, SUBG: Subgoal<br/>
          EXEC: Execution, FEEDB: Feedback
        </p>
      </div>
    </div>
  );
}
