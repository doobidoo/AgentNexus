# Web Automation - Claude AI Guidance

## Component Overview

The Web Automation system provides agents with the ability to interact with web pages, execute browser operations, and extract information from websites. It leverages Playwright for browser automation and implements a robust page object pattern for structured interactions.

## Architecture

```
Web Automation
├── BrowserManager
├── PageObjectModel
│   ├── BasePage
│   ├── PageFactory
│   └── ComponentLibrary
├── Interaction
│   ├── Navigation
│   ├── Form
│   ├── Extraction
│   └── Validation
└── WebTool
```

## Key Files

- `/src/core/tools/web-browser.ts`: Main web browser tool implementation
- Related files in the tools directory

## Implementation Patterns

### Web Browser Tool

```typescript
export class WebBrowserTool extends BaseTool {
  constructor(
    private readonly browserManager: BrowserManager,
    private readonly config: WebBrowserConfig
  ) {
    super(
      'web-browser',
      'Interact with websites and extract information',
      '1.0.0',
      [
        {
          name: 'url',
          description: 'URL to navigate to',
          type: 'string',
          required: true
        },
        {
          name: 'operation',
          description: 'Operation to perform',
          type: 'string',
          required: true,
          allowedValues: ['navigate', 'extract', 'interact', 'screenshot']
        },
        {
          name: 'selector',
          description: 'CSS selector for target element',
          type: 'string',
          required: false
        },
        {
          name: 'interaction',
          description: 'Interaction details for interact operation',
          type: 'object',
          required: false
        }
      ],
      [Capability.WebBrowsing]
    );
  }
  
  async execute(params: Record<string, any>, context: ExecutionContext): Promise<ToolResult> {
    try {
      const { url, operation, selector, interaction } = params;
      
      // Get or create browser instance
      const browser = await this.browserManager.getBrowser();
      
      // Create new page
      const page = await browser.newPage();
      
      try {
        // Operation implementations
        switch (operation) {
          case 'navigate':
            await this.performNavigation(page, url);
            break;
          case 'extract':
            return await this.performExtraction(page, url, selector);
          case 'interact':
            await this.performInteraction(page, url, selector, interaction);
            break;
          case 'screenshot':
            return await this.performScreenshot(page, url, selector);
          default:
            throw new ToolValidationError(`Unsupported operation: ${operation}`);
        }
        
        return {
          success: true,
          data: {
            url: page.url(),
            title: await page.title()
          }
        };
      } finally {
        // Close page when done
        await page.close();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  private async performNavigation(page: Page, url: string): Promise<void> {
    // Implementation
  }
  
  private async performExtraction(page: Page, url: string, selector?: string): Promise<ToolResult> {
    // Implementation
  }
  
  private async performInteraction(page: Page, url: string, selector: string, interaction: any): Promise<void> {
    // Implementation
  }
  
  private async performScreenshot(page: Page, url: string, selector?: string): Promise<ToolResult> {
    // Implementation
  }
}
```

### Browser Manager

```typescript
export class BrowserManager {
  private browser: Browser | null = null;
  
  constructor(
    private readonly config: BrowserManagerConfig
  ) {}
  
  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        timeout: this.config.launchTimeout
      });
    }
    
    return this.browser;
  }
  
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

### Page Object Model

```typescript
export abstract class BasePage {
  constructor(
    protected readonly page: Page,
    public readonly url: string
  ) {}
  
  abstract isCurrentPage(): Promise<boolean>;
  
  async navigate(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }
  
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
  
  async getTitle(): Promise<string> {
    return await this.page.title();
  }
  
  // Additional helper methods...
}

export class PageFactory {
  private pageRegistry: Map<string, new (page: Page) => BasePage> = new Map();
  
  registerPage(pageId: string, pageClass: new (page: Page) => BasePage): void {
    this.pageRegistry.set(pageId, pageClass);
  }
  
  async createPage(pageId: string, page: Page): Promise<BasePage> {
    const PageClass = this.pageRegistry.get(pageId);
    
    if (!PageClass) {
      throw new Error(`Page '${pageId}' not registered`);
    }
    
    const pageInstance = new PageClass(page);
    return pageInstance;
  }
}
```

## Implementation Guidelines

1. **Browser Management**:
   - Use headless mode for most operations
   - Implement proper browser lifecycle management
   - Handle browser crashes gracefully
   - Support session persistence when needed

2. **Page Interactions**:
   - Wait for elements to be ready before interaction
   - Implement retry mechanisms for flaky interactions
   - Use explicit waits rather than timeouts
   - Support both CSS and XPath selectors

3. **Data Extraction**:
   - Extract structured data where possible
   - Support different extraction formats (text, HTML, JSON)
   - Implement pagination handling
   - Document extraction patterns for common sites

4. **Error Handling**:
   - Handle common browser errors (navigation timeouts, element not found)
   - Provide detailed error messages for debugging
   - Support graceful degradation for failed operations
   - Implement screenshots for error diagnosis

## Common Tasks

### Implementing a New Page Object

1. Create a class extending BasePage
2. Define selectors for important elements
3. Implement page-specific interaction methods
4. Add validation methods for page state
5. Register with PageFactory

```typescript
export class LoginPage extends BasePage {
  // Selectors
  private usernameSelector = '#username';
  private passwordSelector = '#password';
  private loginButtonSelector = 'button[type="submit"]';
  private errorMessageSelector = '.error-message';
  
  constructor(page: Page) {
    super(page, 'https://example.com/login');
  }
  
  async isCurrentPage(): Promise<boolean> {
    return await this.page.url().includes('/login');
  }
  
  async login(username: string, password: string): Promise<void> {
    await this.page.fill(this.usernameSelector, username);
    await this.page.fill(this.passwordSelector, password);
    await this.page.click(this.loginButtonSelector);
    await this.page.waitForNavigation();
  }
  
  async getErrorMessage(): Promise<string | null> {
    const errorElement = await this.page.$(this.errorMessageSelector);
    
    if (!errorElement) {
      return null;
    }
    
    return await errorElement.textContent() || null;
  }
}
```

### Adding Form Interaction Capabilities

1. Define form interaction patterns
2. Implement support for different input types
3. Add validation for form submission
4. Support error detection and handling
5. Document form interaction patterns

### Implementing Extraction Strategies

1. Define data structures for extracted content
2. Implement different extraction methods
3. Support table and list extraction
4. Add data cleaning and formatting
5. Document extraction patterns

## Error Handling

```typescript
// Custom error classes
export class WebAutomationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'WebAutomationError';
  }
}

export class NavigationError extends WebAutomationError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NavigationError';
  }
}

export class InteractionError extends WebAutomationError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InteractionError';
  }
}

export class ExtractionError extends WebAutomationError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ExtractionError';
  }
}

// Error handling approach
try {
  // Web automation operations
} catch (error) {
  if (error instanceof NavigationError) {
    // Handle navigation error
  } else if (error instanceof InteractionError) {
    // Handle interaction error
  } else if (error instanceof ExtractionError) {
    // Handle extraction error
  } else {
    // Handle unexpected error
    throw new WebAutomationError('Unexpected error during web automation', { cause: error });
  }
}
```

## Testing Approach

1. Unit test page objects in isolation
2. Use mock pages for testing interactions
3. Test against live sites for integration testing
4. Verify error handling for common failure modes
5. Test in both headless and headed modes

## Best Practices

1. **Performance**:
   - Minimize the number of navigation operations
   - Batch extraction tasks when possible
   - Close pages and contexts when not needed
   - Use resource-efficient selectors

2. **Reliability**:
   - Implement proper waiting mechanisms
   - Use retry logic for flaky operations
   - Add logging for debugging
   - Capture screenshots for failures

3. **Security**:
   - Never store sensitive credentials in code
   - Use secure context for authentication
   - Implement proper session management
   - Follow security best practices for web automation

4. **Ethics**:
   - Respect robots.txt directives
   - Implement rate limiting
   - Add proper user agents
   - Document ethical guidelines for web automation

## Additional Resources

- See `/docs/standards/web-automation.md` for complete specifications
- Review existing implementations in web browser tool
- Study Playwright documentation for advanced features