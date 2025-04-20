/**
 * Object Utility Functions for Agent Nexus
 * 
 * Provides utility functions for working with objects, including deep merging,
 * cloning, and other operations.
 */

/**
 * Deep merge two objects
 * 
 * @param target The target object to merge into
 * @param source The source object to merge from
 * @returns The merged object (modified target)
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  // Handle edge cases
  if (!source) return target;
  if (!target) return source as T;
  
  // Merge each property
  for (const key of Object.keys(source)) {
    const targetValue = target[key];
    const sourceValue = source[key];
    
    // If both values are objects, merge them recursively
    if (
      targetValue && 
      typeof targetValue === 'object' && 
      !Array.isArray(targetValue) && 
      sourceValue && 
      typeof sourceValue === 'object' && 
      !Array.isArray(sourceValue)
    ) {
      target[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      // Otherwise, just overwrite target with source
      target[key] = sourceValue;
    }
  }
  
  return target;
}

/**
 * Deep merge with a default object
 * Only applies values from defaults that don't exist in target
 * 
 * @param target The target object to apply defaults to
 * @param defaults The default values to apply
 * @returns The merged object (modified target)
 */
export function mergeWithDefaults<T extends Record<string, any>>(target: T, defaults: Record<string, any>): T {
  // Handle edge cases
  if (!defaults) return target;
  if (!target) return Object.assign({}, defaults) as T;
  
  // Create a copy of target to avoid modifying original
  const result = Object.assign({}, target);
  
  // Apply defaults for each property
  for (const key of Object.keys(defaults)) {
    // Skip if target already has this property
    if (result[key] !== undefined) {
      // If both are objects, recursively merge
      if (
        typeof result[key] === 'object' && 
        !Array.isArray(result[key]) && 
        typeof defaults[key] === 'object' && 
        !Array.isArray(defaults[key])
      ) {
        result[key] = mergeWithDefaults(result[key], defaults[key]);
      }
      // Otherwise keep target's value
      continue;
    }
    
    // Apply default value
    result[key] = defaults[key];
  }
  
  return result;
}

/**
 * Create a deep clone of an object
 * 
 * @param obj Object to clone
 * @returns A deep copy of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  const result = {} as Record<string, any>;
  for (const key of Object.keys(obj as Record<string, any>)) {
    result[key] = deepClone((obj as Record<string, any>)[key]);
  }
  
  return result as T;
}

/**
 * Check if a value is a plain object (not Array, Date, etc.)
 * 
 * @param value Value to check
 * @returns Boolean indicating if it's a plain object
 */
export function isPlainObject(value: any): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Flatten an object with nested properties into a flat object with dot notation
 * 
 * @param obj Object to flatten
 * @param prefix Prefix for nested keys
 * @returns Flattened object
 */
export function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (isPlainObject(value)) {
      // Recursively flatten nested objects
      Object.assign(result, flattenObject(value, newKey));
    } else {
      // Add the value at the current path
      result[newKey] = value;
    }
  }
  
  return result;
}

/**
 * Unflatten a flat object with dot notation into a nested object
 * 
 * @param obj Flattened object
 * @returns Nested object
 */
export function unflattenObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const parts = key.split('.');
    
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  return result;
}

/**
 * Get a nested property from an object using a path string
 * 
 * @param obj Object to get property from
 * @param path Path to the property (dot notation)
 * @param defaultValue Default value to return if property not found
 * @returns The property value or default value if not found
 */
export function getNestedProperty<T = any>(
  obj: Record<string, any>, 
  path: string, 
  defaultValue?: T
): T | undefined {
  if (!obj || !path) {
    return defaultValue;
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current !== undefined ? current as T : defaultValue;
}

/**
 * Set a nested property on an object using a path string
 * 
 * @param obj Object to set property on
 * @param path Path to the property (dot notation)
 * @param value Value to set
 * @returns The modified object
 */
export function setNestedProperty<T extends Record<string, any>>(
  obj: T, 
  path: string, 
  value: any
): T {
  if (!obj || !path) {
    return obj;
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return obj;
}

/**
 * Delete a nested property from an object using a path string
 * 
 * @param obj Object to delete property from
 * @param path Path to the property (dot notation)
 * @returns The modified object
 */
export function deleteNestedProperty<T extends Record<string, any>>(
  obj: T, 
  path: string
): T {
  if (!obj || !path) {
    return obj;
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      return obj; // Property path doesn't exist
    }
    current = current[part];
  }
  
  delete current[parts[parts.length - 1]];
  return obj;
}

/**
 * Check if an object has a nested property using a path string
 * 
 * @param obj Object to check
 * @param path Path to the property (dot notation)
 * @returns Boolean indicating if the property exists
 */
export function hasNestedProperty(obj: Record<string, any>, path: string): boolean {
  if (!obj || !path) {
    return false;
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
      return false;
    }
    current = current[part];
  }
  
  return true;
}
