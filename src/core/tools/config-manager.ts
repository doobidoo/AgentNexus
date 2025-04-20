/**
 * Tool Configuration System for Agent Nexus
 * 
 * Provides a configuration system that allows tools to be configured with
 * default and custom settings from various sources (environment variables,
 * config files, etc.)
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { deepMerge, mergeWithDefaults } from '../utils/object-utils';

// Configuration source types
export enum ConfigSourceType {
  DEFAULT = 'default',      // Built-in default configurations
  FILE = 'file',            // Configuration from file (JSON, YAML)
  ENVIRONMENT = 'environment', // Environment variables
  RUNTIME = 'runtime'       // Runtime configuration (set programmatically)
}

// Configuration value with metadata
export interface ConfigValueWithMetadata<T = any> {
  value: T;
  source: ConfigSourceType;
  timestamp: string;
  description?: string;
}

// Tool configuration schema
export interface ToolConfigSchema {
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    default?: any;
    enum?: any[];
    required?: boolean;
    items?: any; // For array type
    properties?: Record<string, any>; // For object type
  }>;
  required?: string[];
}

// Configuration validation error
export interface ConfigValidationError {
  property: string;
  message: string;
  value?: any;
}

// Configuration event types
export enum ConfigEventType {
  CONFIG_LOADED = 'config.loaded',
  CONFIG_UPDATED = 'config.updated',
  CONFIG_VALIDATED = 'config.validated',
  CONFIG_VALIDATION_ERROR = 'config.validation.error'
}

/**
 * Manages tool configurations with support for different sources,
 * validation, and inheritance
 */
export class ToolConfigManager extends EventEmitter {
  private configs: Record<string, Record<string, ConfigValueWithMetadata>> = {};
  private schemas: Record<string, ToolConfigSchema> = {};
  private configFilePath: string | null = null;
  
  constructor(configPath?: string) {
    super();
    
    if (configPath) {
      this.configFilePath = configPath;
      this.loadConfigFromFile(configPath);
    }
  }
  
  /**
   * Register a configuration schema for a tool
   * 
   * @param toolName Name of the tool
   * @param schema Configuration schema for validation
   * @param defaultValues Optional default values
   */
  registerToolConfig(
    toolName: string, 
    schema: ToolConfigSchema, 
    defaultValues?: Record<string, any>
  ): void {
    // Store the schema
    this.schemas[toolName] = schema;
    
    // Initialize config storage for this tool if it doesn't exist
    if (!this.configs[toolName]) {
      this.configs[toolName] = {};
    }
    
    // Add default values if provided
    if (defaultValues) {
      for (const [key, value] of Object.entries(defaultValues)) {
        this.configs[toolName][key] = {
          value,
          source: ConfigSourceType.DEFAULT,
          timestamp: new Date().toISOString(),
          description: schema.properties[key]?.description
        };
      }
    }
    
    // Emit event
    this.emit(ConfigEventType.CONFIG_LOADED, {
      toolName,
      source: ConfigSourceType.DEFAULT,
      timestamp: new Date().toISOString()
    });
    
    // Load from environment variables
    this.loadFromEnvironment(toolName);
    
    // Validate configuration
    this.validateToolConfig(toolName);
  }
  
  /**
   * Get configuration value for a specific tool property
   * 
   * @param toolName Name of the tool
   * @param property Configuration property name
   * @param defaultValue Optional default value if not configured
   * @returns The configuration value or default if not found
   */
  getConfigValue<T = any>(toolName: string, property: string, defaultValue?: T): T {
    if (!this.configs[toolName] || this.configs[toolName][property] === undefined) {
      return defaultValue as T;
    }
    
    return this.configs[toolName][property].value as T;
  }
  
  /**
   * Get all configuration values for a tool
   * 
   * @param toolName Name of the tool
   * @returns Object with all configuration values
   */
  getToolConfig(toolName: string): Record<string, any> {
    if (!this.configs[toolName]) {
      return {};
    }
    
    const config: Record<string, any> = {};
    for (const [key, metadata] of Object.entries(this.configs[toolName])) {
      config[key] = metadata.value;
    }
    
    return config;
  }
  
  /**
   * Get configuration metadata for a specific tool property
   * 
   * @param toolName Name of the tool
   * @param property Configuration property name
   * @returns The configuration value with metadata or undefined if not found
   */
  getConfigMetadata(toolName: string, property: string): ConfigValueWithMetadata | undefined {
    if (!this.configs[toolName]) {
      return undefined;
    }
    
    return this.configs[toolName][property];
  }
  
  /**
   * Update configuration value for a specific tool property
   * 
   * @param toolName Name of the tool
   * @param property Configuration property name
   * @param value The new value
   * @param source Source of the configuration update
   * @returns Boolean indicating if update was successful
   */
  setConfigValue(
    toolName: string, 
    property: string, 
    value: any, 
    source: ConfigSourceType = ConfigSourceType.RUNTIME
  ): boolean {
    // Ensure the tool config exists
    if (!this.configs[toolName]) {
      this.configs[toolName] = {};
    }
    
    // Update the configuration
    this.configs[toolName][property] = {
      value,
      source,
      timestamp: new Date().toISOString(),
      description: this.schemas[toolName]?.properties[property]?.description
    };
    
    // Emit event
    this.emit(ConfigEventType.CONFIG_UPDATED, {
      toolName,
      property,
      value,
      source,
      timestamp: new Date().toISOString()
    });
    
    // Validate the configuration
    return this.validateToolConfig(toolName);
  }
  
  /**
   * Update multiple configuration values for a tool
   * 
   * @param toolName Name of the tool
   * @param values Object with configuration values
   * @param source Source of the configuration update
   * @returns Boolean indicating if update was successful
   */
  updateToolConfig(
    toolName: string, 
    values: Record<string, any>, 
    source: ConfigSourceType = ConfigSourceType.RUNTIME
  ): boolean {
    // Update each configuration value
    for (const [property, value] of Object.entries(values)) {
      this.setConfigValue(toolName, property, value, source);
    }
    
    // Validate the configuration
    return this.validateToolConfig(toolName);
  }
  
  /**
   * Reset a tool configuration to default values
   * 
   * @param toolName Name of the tool
   * @returns Boolean indicating if reset was successful
   */
  resetToolConfig(toolName: string): boolean {
    if (!this.schemas[toolName]) {
      return false;
    }
    
    // Clear existing configuration
    this.configs[toolName] = {};
    
    // Set default values from schema
    for (const [property, schema] of Object.entries(this.schemas[toolName].properties)) {
      if (schema.default !== undefined) {
        this.configs[toolName][property] = {
          value: schema.default,
          source: ConfigSourceType.DEFAULT,
          timestamp: new Date().toISOString(),
          description: schema.description
        };
      }
    }
    
    // Load from environment variables
    this.loadFromEnvironment(toolName);
    
    // Emit event
    this.emit(ConfigEventType.CONFIG_UPDATED, {
      toolName,
      reset: true,
      timestamp: new Date().toISOString()
    });
    
    // Validate the configuration
    return this.validateToolConfig(toolName);
  }
  
  /**
   * Validate a tool's configuration against its schema
   * 
   * @param toolName Name of the tool
   * @returns Boolean indicating if configuration is valid
   */
  validateToolConfig(toolName: string): boolean {
    if (!this.schemas[toolName]) {
      // No schema to validate against
      return true;
    }
    
    const schema = this.schemas[toolName];
    const config = this.getToolConfig(toolName);
    const errors: ConfigValidationError[] = [];
    
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (config[requiredProp] === undefined) {
          errors.push({
            property: requiredProp,
            message: `Required property '${requiredProp}' is missing`
          });
        }
      }
    }
    
    // Validate property types and constraints
    for (const [property, value] of Object.entries(config)) {
      const propSchema = schema.properties[property];
      
      if (!propSchema) {
        // Unknown property, not in schema
        errors.push({
          property,
          message: `Unknown property '${property}' not defined in schema`,
          value
        });
        continue;
      }
      
      // Validate type
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      if (valueType !== propSchema.type) {
        errors.push({
          property,
          message: `Invalid type for '${property}'. Expected ${propSchema.type}, got ${valueType}`,
          value
        });
      }
      
      // Validate enum values
      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push({
          property,
          message: `Invalid value for '${property}'. Must be one of: ${propSchema.enum.join(', ')}`,
          value
        });
      }
      
      // Add more validation as needed (min/max for numbers, patterns for strings, etc.)
    }
    
    // Emit validation events
    if (errors.length > 0) {
      this.emit(ConfigEventType.CONFIG_VALIDATION_ERROR, {
        toolName,
        errors,
        timestamp: new Date().toISOString()
      });
      console.error(`Configuration validation errors for tool '${toolName}':`, errors);
      return false;
    } else {
      this.emit(ConfigEventType.CONFIG_VALIDATED, {
        toolName,
        timestamp: new Date().toISOString()
      });
      return true;
    }
  }
  
  /**
   * Get the configuration schema for a tool
   * 
   * @param toolName Name of the tool
   * @returns The configuration schema or undefined if not registered
   */
  getToolConfigSchema(toolName: string): ToolConfigSchema | undefined {
    return this.schemas[toolName];
  }
  
  /**
   * Get validation errors for a tool configuration
   * 
   * @param toolName Name of the tool
   * @returns Array of validation errors or empty array if valid
   */
  getValidationErrors(toolName: string): ConfigValidationError[] {
    if (!this.schemas[toolName]) {
      return [];
    }
    
    const schema = this.schemas[toolName];
    const config = this.getToolConfig(toolName);
    const errors: ConfigValidationError[] = [];
    
    // Perform validation (similar logic to validateToolConfig)
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (config[requiredProp] === undefined) {
          errors.push({
            property: requiredProp,
            message: `Required property '${requiredProp}' is missing`
          });
        }
      }
    }
    
    // Validate property types and constraints
    for (const [property, value] of Object.entries(config)) {
      const propSchema = schema.properties[property];
      
      if (!propSchema) {
        // Unknown property, not in schema
        errors.push({
          property,
          message: `Unknown property '${property}' not defined in schema`,
          value
        });
        continue;
      }
      
      // Validate type
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      if (valueType !== propSchema.type) {
        errors.push({
          property,
          message: `Invalid type for '${property}'. Expected ${propSchema.type}, got ${valueType}`,
          value
        });
      }
      
      // Validate enum values
      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push({
          property,
          message: `Invalid value for '${property}'. Must be one of: ${propSchema.enum.join(', ')}`,
          value
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Generate documentation for a tool's configuration schema
   * 
   * @param toolName Name of the tool
   * @returns Formatted documentation string
   */
  generateConfigDocumentation(toolName: string): string {
    if (!this.schemas[toolName]) {
      return `No configuration schema registered for tool '${toolName}'`;
    }
    
    const schema = this.schemas[toolName];
    const config = this.getToolConfig(toolName);
    
    let doc = `# Configuration for ${toolName}\n\n`;
    
    // Add required properties section
    if (schema.required && schema.required.length > 0) {
      doc += `## Required Properties\n\n`;
      for (const prop of schema.required) {
        const propSchema = schema.properties[prop];
        doc += `- **${prop}** (${propSchema.type})`;
        if (propSchema.description) {
          doc += `: ${propSchema.description}`;
        }
        doc += '\n';
      }
      doc += '\n';
    }
    
    // Add all properties section
    doc += `## All Properties\n\n`;
    for (const [property, propSchema] of Object.entries(schema.properties)) {
      doc += `### ${property}\n\n`;
      doc += `- **Type**: ${propSchema.type}\n`;
      if (propSchema.description) {
        doc += `- **Description**: ${propSchema.description}\n`;
      }
      if (propSchema.default !== undefined) {
        doc += `- **Default**: \`${JSON.stringify(propSchema.default)}\`\n`;
      }
      if (propSchema.enum) {
        doc += `- **Allowed Values**: ${propSchema.enum.map(v => `\`${v}\``).join(', ')}\n`;
      }
      
      // Show current value if available
      if (config[property] !== undefined) {
        const metadata = this.configs[toolName][property];
        doc += `- **Current Value**: \`${JSON.stringify(config[property])}\`\n`;
        doc += `- **Source**: ${metadata.source}\n`;
        doc += `- **Last Updated**: ${metadata.timestamp}\n`;
      }
      
      doc += '\n';
    }
    
    return doc;
  }
  
  /**
   * Save configurations to a file
   * 
   * @param filePath Path to save configuration file
   * @returns Boolean indicating if save was successful
   */
  saveConfigToFile(filePath?: string): boolean {
    const savePath = filePath || this.configFilePath;
    
    if (!savePath) {
      console.error('No configuration file path specified');
      return false;
    }
    
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Prepare configuration object to save
      const configToSave: Record<string, Record<string, any>> = {};
      
      for (const [toolName, toolConfig] of Object.entries(this.configs)) {
        configToSave[toolName] = {};
        
        for (const [property, metadata] of Object.entries(toolConfig)) {
          configToSave[toolName][property] = metadata.value;
        }
      }
      
      // Save to file
      fs.writeFileSync(savePath, JSON.stringify(configToSave, null, 2), 'utf8');
      this.configFilePath = savePath;
      
      return true;
    } catch (error) {
      console.error('Error saving configuration file:', error);
      return false;
    }
  }
  
  /**
   * Load configurations from a file
   * 
   * @param filePath Path to load configuration file from
   * @returns Boolean indicating if load was successful
   */
  loadConfigFromFile(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`Configuration file not found: ${filePath}`);
        return false;
      }
      
      // Read and parse configuration file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fileConfig = JSON.parse(fileContent);
      
      // Update configurations
      for (const [toolName, toolConfig] of Object.entries(fileConfig)) {
        // Initialize tool config if it doesn't exist
        if (!this.configs[toolName]) {
          this.configs[toolName] = {};
        }
        
        // Update each property
        for (const [property, value] of Object.entries(toolConfig as Record<string, any>)) {
          this.configs[toolName][property] = {
            value,
            source: ConfigSourceType.FILE,
            timestamp: new Date().toISOString(),
            description: this.schemas[toolName]?.properties[property]?.description
          };
        }
        
        // Validate after loading
        this.validateToolConfig(toolName);
      }
      
      this.configFilePath = filePath;
      
      // Emit event
      this.emit(ConfigEventType.CONFIG_LOADED, {
        source: ConfigSourceType.FILE,
        filePath,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error loading configuration file:', error);
      return false;
    }
  }
  
  /**
   * Load configuration from environment variables
   * 
   * @param toolName Name of the tool to load configuration for
   */
  private loadFromEnvironment(toolName: string): void {
    // Skip if no schema is registered
    if (!this.schemas[toolName]) {
      return;
    }
    
    const schema = this.schemas[toolName];
    const envPrefix = `NEXUS_TOOL_${toolName.toUpperCase()}`;
    
    // Check each property for environment variable
    for (const [property, propSchema] of Object.entries(schema.properties)) {
      const envName = `${envPrefix}_${property.toUpperCase()}`;
      const envValue = process.env[envName];
      
      if (envValue !== undefined) {
        // Convert environment variable to the appropriate type
        let typedValue: any;
        
        switch (propSchema.type) {
          case 'number':
            typedValue = Number(envValue);
            break;
          case 'boolean':
            typedValue = envValue.toLowerCase() === 'true';
            break;
          case 'object':
          case 'array':
            try {
              typedValue = JSON.parse(envValue);
            } catch (e) {
              console.error(`Error parsing JSON from environment variable ${envName}:`, e);
              continue;
            }
            break;
          case 'string':
          default:
            typedValue = envValue;
            break;
        }
        
        // Update the configuration
        this.configs[toolName][property] = {
          value: typedValue,
          source: ConfigSourceType.ENVIRONMENT,
          timestamp: new Date().toISOString(),
          description: propSchema.description
        };
      }
    }
  }
}

// Create a singleton instance
export const configManager = new ToolConfigManager();

// Export default instance
export default configManager;