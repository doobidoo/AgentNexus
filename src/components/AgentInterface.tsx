/**
 * Agent Interface Component
 * 
 * A simple UI for interacting with Agent Nexus
 */

'use client';

import React, { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AgentInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'chat' | 'task'>('chat');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Send to API
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, type: mode })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Agent Nexus</h1>
        <div className="flex items-center space-x-2">
          <span>Mode:</span>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value as 'chat' | 'task')}
            className="p-2 border rounded"
          >
            <option value="chat">Chat</option>
            <option value="task">Task</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No messages yet. Start a conversation with Agent Nexus!</p>
            {mode === 'task' && (
              <p className="mt-2 text-sm">Task mode is for complex problems that require planning and reasoning.</p>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 p-3 rounded ${
                message.role === 'user' ? 'bg-blue-100 ml-10' : 'bg-white mr-10 border'
              }`}
            >
              <div className="font-semibold mb-1">
                {message.role === 'user' ? 'You' : 'Agent Nexus'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex justify-center items-center mt-4">
            <div className="animate-pulse text-gray-500">
              {mode === 'chat' ? 'Agent is thinking...' : 'Agent is processing task...'}
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-center">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded mr-2 h-20 resize-none"
          placeholder={mode === 'chat' 
            ? "Type a message to Agent Nexus..." 
            : "Describe your task in detail..."
          }
          disabled={isProcessing}
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded h-20"
          disabled={isProcessing}
        >
          Send
        </button>
      </form>
    </div>
  );
}
