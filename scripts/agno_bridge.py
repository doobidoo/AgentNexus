"""
Agno Bridge Script

This script serves as a bridge between the JavaScript frontend and Python agno library.
It receives requests via stdin, processes them using the agno library, and returns
results via stdout.
"""

import sys
import json
import traceback
from typing import Dict, Any, List, Optional

# Try to import agno, but provide fallback if not available
try:
    import agno
    AGNO_AVAILABLE = True
except ImportError:
    AGNO_AVAILABLE = False
    print("Warning: agno library not found. Running in compatibility mode.", file=sys.stderr)

# Global agent instance
agent = None

def handle_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle a request from the JavaScript frontend.
    
    Args:
        request: The request object containing action and data
        
    Returns:
        A response object with success flag and data/error
    """
    action = request.get('action')
    data = request.get('data', {})
    
    try:
        if action == 'ping':
            return {'success': True, 'data': True}
        
        elif action == 'initialize_agent':
            return initialize_agent(data)
        
        elif action == 'generate_completion':
            return generate_completion(data.get('messages', []), data.get('options', {}))
        
        elif action == 'execute_tool':
            return execute_tool(data.get('toolName'), data.get('params', {}))
        
        else:
            return {'success': False, 'error': f'Unknown action: {action}'}
    
    except Exception as e:
        traceback_str = traceback.format_exc()
        return {
            'success': False, 
            'error': f'Error processing {action}: {str(e)}',
            'traceback': traceback_str
        }

def initialize_agent(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initialize the agno agent.
    
    Args:
        config: The agent configuration
        
    Returns:
        Response with the initialized agent info
    """
    global agent
    
    if not AGNO_AVAILABLE:
        return {
            'success': True,
            'data': {
                'name': config.get('agentName', 'Agent Nexus'),
                'description': config.get('description', 'Demo Agent (agno not available)'),
                'model': config.get('modelName', 'demo-model'),
                'demo': True
            }
        }
    
    try:
        # Initialize the agent with the provided configuration
        agent = agno.Agent(
            name=config.get('agentName', 'Agent Nexus'),
            description=config.get('description', 'An advanced cognitive agent architecture'),
            model=config.get('modelName', 'gpt-4')
        )
        
        # Return the agent info
        return {
            'success': True,
            'data': {
                'name': agent.name,
                'description': agent.description,
                'model': agent.model,
                'demo': False
            }
        }
    except Exception as e:
        return {'success': False, 'error': f'Failed to initialize agent: {str(e)}'}

def generate_completion(messages: List[Dict[str, Any]], options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a completion using the agno agent.
    
    Args:
        messages: The messages to generate a completion from
        options: The completion options
        
    Returns:
        Response with the generated completion
    """
    global agent
    
    if not AGNO_AVAILABLE or agent is None:
        # Mock response in compatibility mode
        user_message = next((m['content'] for m in messages if m['role'] == 'user'), '')
        return {
            'success': True,
            'data': f"Demo response to: '{user_message[:50]}...'\n\nThis is a demo response because the agno library is not available. Please install the agno library for full functionality."
        }
    
    try:
        # Convert messages to agno format
        agno_messages = []
        for msg in messages:
            role = msg['role']
            content = msg['content']
            
            if role == 'system':
                agno_messages.append(agno.SystemMessage(content=content))
            elif role == 'user':
                agno_messages.append(agno.UserMessage(content=content))
            elif role == 'assistant':
                agno_messages.append(agno.AssistantMessage(content=content))
            elif role == 'function' or role == 'tool':
                agno_messages.append(agno.FunctionMessage(
                    content=content,
                    name=msg.get('name', 'function')
                ))
        
        # Generate completion with options
        response = agent.generate(
            messages=agno_messages,
            temperature=options.get('temperature', 0.7),
            max_tokens=options.get('maxTokens', 1000),
            stop=options.get('stop', None),
        )
        
        return {'success': True, 'data': response.content}
    
    except Exception as e:
        return {'success': False, 'error': f'Failed to generate completion: {str(e)}'}

def execute_tool(tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a tool using the agno agent.
    
    Args:
        tool_name: The name of the tool to execute
        params: The parameters for the tool
        
    Returns:
        Response with the result of the tool execution
    """
    global agent
    
    if not AGNO_AVAILABLE or agent is None:
        return {
            'success': True,
            'data': f"Demo tool execution for: {tool_name}\nParameters: {json.dumps(params)}\n\nThis is a demo response because the agno library is not available."
        }
    
    try:
        # Check if tool exists
        if tool_name not in agent.tools:
            return {'success': False, 'error': f'Tool not found: {tool_name}'}
        
        # Execute the tool
        result = agent.execute_tool(tool_name, **params)
        
        return {'success': True, 'data': result}
    
    except Exception as e:
        return {'success': False, 'error': f'Failed to execute tool {tool_name}: {str(e)}'}

def main():
    """
    Main function to process requests from stdin.
    """
    try:
        # Read request from stdin
        request_json = sys.stdin.read()
        request = json.loads(request_json)
        
        # Process the request
        response = handle_request(request)
        
        # Return the response as JSON
        print(json.dumps(response))
    
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON: {str(e)}'
        }))
    
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }))

if __name__ == '__main__':
    main()
