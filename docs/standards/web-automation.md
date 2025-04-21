# Web Automation Standards

## Web Automation Architecture

- **Browser Automation Principles**
  - Use Playwright exclusively for all web automation and testing
  - Isolate browser automation code into dedicated service modules
  - Use TypeScript types from @playwright/test for all browser interactions
  - Implement proper error handling with exponential backoff retry mechanisms
  - Cache browser contexts when possible for improved performance
  - Configure automation for both headless and headed operation via environment variables

## Implementation Standards

- **Page Object Pattern**
  - Create class-based representations of web pages
  - Encapsulate page-specific selectors and methods
  - Implement chainable methods for fluent interface
  - Separate page structure from test logic
  - Example implementation:
  
  ```typescript
  export class LoginPage {
    private readonly page: Page;
    
    // Selectors
    private readonly usernameInput = '[data-testid="username-input"]';
    private readonly passwordInput = '[data-testid="password-input"]';
    private readonly loginButton = '[data-testid="login-button"]';
    private readonly errorMessage = '[data-testid="error-message"]';
    
    constructor(page: Page) {
      this.page = page;
    }
    
    async navigate() {
      await this.page.goto('/login');
      await this.page.waitForLoadState('networkidle');
      return this;
    }
    
    async login(username: string, password: string) {
      await this.page.fill(this.usernameInput, username);
      await this.page.fill(this.passwordInput, password);
      await this.page.click(this.loginButton);
      await this.page.waitForNavigation();
      return new DashboardPage(this.page);
    }
    
    async getErrorMessage() {
      return this.page.textContent(this.errorMessage);
    }
  }
  ```

- **Selector Strategy**
  - Use data-testid as primary selector method (`data-testid="login-button"`)
  - Fall back to accessible selectors (role, aria-label)
  - Avoid CSS selectors based on style or position
  - Avoid XPath selectors except for complex structural queries
  - Document selectors with comments explaining their purpose
  - Centralize selectors in page objects or dedicated constants

- **Waiting Strategy**
  - Prefer explicit waits over implicit timeouts
  - Use `waitForSelector` with appropriate state (visible, attached)
  - Implement `waitForLoadState` to ensure page readiness
  - Use custom wait functions for complex conditions
  - Configure reasonable timeout defaults based on application behavior
  - Example implementation:
  
  ```typescript
  // Wait for a specific condition
  async function waitForDataLoaded(page: Page, timeout = 30000) {
    return page.waitForFunction(
      () => !document.querySelector('[data-loading="true"]'),
      { timeout }
    );
  }
  
  // Use in page object
  async getData() {
    await this.page.click(this.loadDataButton);
    await waitForDataLoaded(this.page);
    return this.page.$$eval(this.dataRows, rows => {
      return rows.map(row => ({
        id: row.getAttribute('data-id'),
        name: row.querySelector('.name')?.textContent || '',
        value: row.querySelector('.value')?.textContent || ''
      }));
    });
  }
  ```

- **Error Handling**
  - Implement retry mechanisms for flaky operations
  - Use try/catch blocks for recoverable errors
  - Implement custom error classes for automation-specific issues
  - Capture screenshots on failure
  - Log detailed error information
  - Example implementation:
  
  ```typescript
  async function retryOperation<T>(
    operation: () => Promise<T>,
    options: { maxRetries?: number; delay?: number; name?: string } = {}
  ): Promise<T> {
    const { maxRetries = 3, delay = 1000, name = 'operation' } = options;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Attempt ${attempt}/${maxRetries} for ${name} failed: ${error.message}`
        );
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, delay * attempt)); // Exponential backoff
        }
      }
    }
    
    throw new Error(`All ${maxRetries} attempts for ${name} failed. Last error: ${lastError.message}`);
  }
  ```

## Testing Integration

- **Test Structure**
  - Organize tests by feature or user flow
  - Implement before/after hooks for setup and teardown
  - Use descriptive test names following "should" pattern
  - Group related tests in describe blocks
  - Keep tests independent and isolated
  - Example implementation:
  
  ```typescript
  describe('User Authentication', () => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    let loginPage: LoginPage;
    
    beforeAll(async () => {
      browser = await chromium.launch({ headless: process.env.CI === 'true' });
    });
    
    afterAll(async () => {
      await browser.close();
    });
    
    beforeEach(async () => {
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Playwright Test Agent'
      });
      page = await context.newPage();
      loginPage = new LoginPage(page);
      await loginPage.navigate();
    });
    
    afterEach(async () => {
      await context.close();
    });
    
    test('should login successfully with valid credentials', async () => {
      const dashboardPage = await loginPage.login('validUser', 'validPassword');
      expect(await dashboardPage.isLoggedIn()).toBe(true);
    });
    
    test('should show error message with invalid credentials', async () => {
      await loginPage.login('invalidUser', 'invalidPassword');
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain('Invalid username or password');
    });
  });
  ```

- **Data-Driven Testing**
  - Parameterize tests for multiple scenarios
  - Externalize test data in JSON or fixtures
  - Implement test factories for common patterns
  - Support dynamic test generation
  - Example implementation:
  
  ```typescript
  const loginScenarios = [
    { username: 'admin', password: 'correctPassword', expected: 'success' },
    { username: 'user', password: 'wrongPassword', expected: 'failure' },
    { username: '', password: 'anyPassword', expected: 'validation' }
  ];
  
  describe('Login validation', () => {
    loginScenarios.forEach(scenario => {
      test(`Login with ${scenario.username} should result in ${scenario.expected}`, async () => {
        // Test implementation using scenario data
      });
    });
  });
  ```

## Performance Optimization

- **Browser Context Reuse**
  - Share browser instance across tests
  - Create new contexts for test isolation
  - Implement context state presets
  - Cache authenticated contexts
  - Example implementation:
  
  ```typescript
  // Context manager
  class BrowserContextManager {
    private browser: Browser | null = null;
    private contextCache: Map<string, BrowserContext> = new Map();
    
    async getBrowser() {
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: process.env.HEADLESS !== 'false'
        });
      }
      return this.browser;
    }
    
    async getContext(name = 'default', options = {}) {
      if (!this.contextCache.has(name)) {
        const browser = await this.getBrowser();
        const context = await browser.newContext(options);
        this.contextCache.set(name, context);
      }
      return this.contextCache.get(name)!;
    }
    
    async closeAll() {
      for (const context of this.contextCache.values()) {
        await context.close();
      }
      this.contextCache.clear();
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }
  ```

- **Resource Interception**
  - Block unnecessary resources
  - Mock API responses
  - Cache external resources
  - Modify network requests
  - Example implementation:
  
  ```typescript
  // Block non-essential resources
  await context.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,otf}', route => {
    if (process.env.BLOCK_IMAGES === 'true') {
      return route.abort();
    }
    return route.continue();
  });
  
  // Mock API responses
  await context.route('**/api/data', route => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: mockData })
    });
  });
  ```

## Visual Testing

- **Screenshot Comparison**
  - Take screenshots at critical points
  - Compare against baseline images
  - Implement visual regression testing
  - Configure screenshot settings for consistency
  - Example implementation:
  
  ```typescript
  async function verifyScreenshot(page: Page, name: string) {
    const screenshot = await page.screenshot({ fullPage: true });
    
    // In test mode, save as baseline
    if (process.env.UPDATE_SNAPSHOTS === 'true') {
      fs.writeFileSync(`./snapshots/${name}.png`, screenshot);
      return true;
    }
    
    // In verification mode, compare with baseline
    const baseline = fs.readFileSync(`./snapshots/${name}.png`);
    const result = await compareImages(screenshot, baseline, {
      threshold: 0.1, // Allow 10% difference
      outputDiffImage: true
    });
    
    if (!result.matched) {
      fs.writeFileSync(`./snapshots/${name}.diff.png`, result.diffImage);
    }
    
    return result.matched;
  }
  ```

## Accessibility Testing

- **Automated Checks**
  - Implement axe-core for accessibility testing
  - Verify WCAG compliance
  - Test keyboard navigation
  - Check screen reader compatibility
  - Example implementation:
  
  ```typescript
  // Access testing with axe-core
  async function checkAccessibility(page: Page, context?: string) {
    await page.addScriptTag({
      path: require.resolve('axe-core/axe.min.js')
    });
    
    const violations = await page.evaluate((ctx) => {
      return new Promise(resolve => {
        // @ts-ignore
        axe.run(ctx ? document.querySelector(ctx) : document, {
          runOnly: ['wcag2a', 'wcag2aa']
        }, (err, results) => {
          resolve(err ? [] : results.violations);
        });
      });
    }, context);
    
    return violations;
  }
  
  test('Dashboard should not have accessibility violations', async () => {
    const dashboard = await loginPage.login('user', 'password');
    const violations = await checkAccessibility(page);
    expect(violations).toHaveLength(0);
  });
  ```

## Security Considerations

- **Credential Management**
  - Never hardcode credentials in test code
  - Use environment variables for sensitive data
  - Implement vault integration for secrets
  - Rotate test credentials regularly
  - Example implementation:
  
  ```typescript
  // Secure credential management
  function getCredentials(userType: string) {
    const username = process.env[`${userType.toUpperCase()}_USERNAME`];
    const password = process.env[`${userType.toUpperCase()}_PASSWORD`];
    
    if (!username || !password) {
      throw new Error(`Credentials for ${userType} not found in environment variables`);
    }
    
    return { username, password };
  }
  
  // Usage
  const adminCreds = getCredentials('admin');
  await loginPage.login(adminCreds.username, adminCreds.password);
  ```

## Migration from Puppeteer

- **Migration Strategy**
  - Identify all Puppeteer usage
  - Prioritize migration by usage frequency
  - Create mapping documentation for API differences
  - Maintain parallel implementations during transition
  - Migration reference:
  
  | Puppeteer | Playwright |
  |-----------|-----------|
  | `page.goto(url)` | `page.goto(url)` |
  | `page.waitForSelector(selector)` | `page.waitForSelector(selector)` |
  | `page.$(selector)` | `page.$(selector)` |
  | `page.$$(selector)` | `page.$$(selector)` |
  | `page.waitForNavigation()` | `page.waitForNavigation()` |
  | `page.evaluate(fn, ...args)` | `page.evaluate(fn, ...args)` |
  | `page.screenshot()` | `page.screenshot()` |
  | `page.type(selector, text)` | `page.fill(selector, text)` |
  | `page.click(selector)` | `page.click(selector)` |
  | `browser.pages()` | `context.pages()` |
  | `page.waitForTimeout(ms)` | `page.waitForTimeout(ms)` |
  | `page.waitForFunction(fn)` | `page.waitForFunction(fn)` |
  | `page.setRequestInterception(true)` | `context.route(url, handler)` |

- **API Differences**
  - Playwright uses browser contexts for isolation
  - Different approach to request interception
  - More powerful selector engine in Playwright
  - Different default timeout behavior
  - Better handling of frames and iframes

## Browser Context Management

- **Isolated Testing Environments**
  - Create separate contexts for different test scenarios
  - Configure viewport, locale, and permissions per context
  - Set up different user agent profiles
  - Manage multiple browser types
  - Example implementation:
  
  ```typescript
  async function createTestContext(options = {}) {
    const browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false'
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Playwright Test Agent',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      ...options
    });
    
    return { browser, context };
  }
  ```

## Documentation and Example Repository

- Maintain examples of common automation patterns
- Document page object implementations
- Create templates for new test suites
- Provide setup guides for different environments
- Include troubleshooting documentation