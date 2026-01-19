# Tests Directory - End-to-End Testing with Playwright

This directory contains all Playwright end-to-end (E2E) tests for the TehtäväMestari platform.

## 🧪 Test Structure

```
tests/
├── e2e/
│   └── direct-tasker-selection/    # Direct selection flow tests
│       ├── direct-selection.spec.ts
│       ├── nearby-taskers-search.spec.ts
│       ├── payment-flow.spec.ts
│       ├── radius-configuration.spec.ts
│       └── ... (11 test files total)
└── README.md
```

## 🚀 Running Tests

### All Tests
```bash
# Run all tests in headless mode
npx playwright test

# Run with UI mode (recommended for development)
npx playwright test --ui

# Run with visible browser
npx playwright test --headed

# Run in debug mode
npx playwright test --debug
```

### Specific Test Suites
```bash
# Run direct tasker selection tests
npx playwright test tests/e2e/direct-tasker-selection/

# Run a specific test file
npx playwright test tests/e2e/direct-tasker-selection/payment-flow.spec.ts

# Run tests matching a pattern
npx playwright test payment
```

### Test Reports
```bash
# View last test report
npx playwright show-report

# Generate and open HTML report
npx playwright test --reporter=html
```

## 📋 Test Coverage

### Direct Tasker Selection Flow (11 tests)

The comprehensive test suite covers the critical user journey from task creation to completion:

1. **[direct-selection.spec.ts](e2e/direct-tasker-selection/direct-selection.spec.ts)**
   - Complete direct selection workflow
   - Tasker selection and request sending
   - Task assignment flow

2. **[nearby-taskers-search.spec.ts](e2e/direct-tasker-selection/nearby-taskers-search.spec.ts)**
   - Tasker search functionality
   - Location-based queries
   - Search result validation

3. **[radius-configuration.spec.ts](e2e/direct-tasker-selection/radius-configuration.spec.ts)**
   - Search radius configuration (1-50km)
   - Default radius behavior (5km)
   - Radius adjustment and validation

4. **[payment-flow.spec.ts](e2e/direct-tasker-selection/payment-flow.spec.ts)**
   - Payment initialization
   - Paytrail integration
   - Payment confirmation

5. **[task-assignment.spec.ts](e2e/direct-tasker-selection/task-assignment.spec.ts)**
   - Tasker accepting requests
   - Task status updates
   - Assignment confirmation

6. **[task-completion.spec.ts](e2e/direct-tasker-selection/task-completion.spec.ts)**
   - Task completion workflow
   - Status transitions
   - Completion validation

7. **[fallback-to-open-posting.spec.ts](e2e/direct-tasker-selection/fallback-to-open-posting.spec.ts)**
   - No taskers found scenario
   - Fallback to open posting
   - Mode switching

8. **[error-handling.spec.ts](e2e/direct-tasker-selection/error-handling.spec.ts)**
   - Network error handling
   - Invalid input validation
   - Error recovery flows

9. **[mobile-responsive.spec.ts](e2e/direct-tasker-selection/mobile-responsive.spec.ts)**
   - Mobile viewport testing
   - Touch interactions
   - Responsive layouts

10. **[duplicate-prevention.spec.ts](e2e/direct-tasker-selection/duplicate-prevention.spec.ts)**
    - Prevent duplicate task requests
    - Concurrent request handling
    - Database constraint validation

11. **[publishing-mode-selector.spec.ts](e2e/direct-tasker-selection/publishing-mode-selector.spec.ts)**
    - Direct vs open posting mode selection
    - Mode confirmation dialogs
    - Publishing mode persistence

## ⚙️ Test Configuration

### Playwright Configuration
Tests are configured in `playwright.config.ts` (root directory):

```typescript
{
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:9002',  // Development server port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 9002,
    reuseExistingServer: !process.env.CI,
  }
}
```

**Important**: Tests run on port **9002** (same as development server).

### Test Data
Tests use:
- Mock data for predictable scenarios
- Real database interactions for integration testing
- Test credentials for payment flows (Paytrail test mode)

## 🎯 Writing New Tests

### Test Structure Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to starting page, login if needed
    await page.goto('/');
  });

  test('should do something specific', async ({ page }) => {
    // Arrange: Set up test conditions

    // Act: Perform user actions
    await page.click('button[data-testid="action-button"]');

    // Assert: Verify expected outcomes
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Reset state if needed
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable selectors
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

2. **Wait for network requests** to complete
   ```typescript
   await page.waitForResponse(response =>
     response.url().includes('/api/tasks') && response.status() === 200
   );
   ```

3. **Test user flows, not implementation**
   - Focus on user actions and outcomes
   - Avoid testing internal state directly

4. **Use descriptive test names**
   ```typescript
   test('should redirect to payment when user selects tasker and clicks "Maksa tehtävä"', ...)
   ```

5. **Isolate tests** - Each test should be independent
   ```typescript
   test.beforeEach(() => {
     // Reset state before each test
   });
   ```

6. **Handle async operations** properly
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

## 🐛 Debugging Tests

### Visual Debugging
```bash
# Open Playwright Inspector
npx playwright test --debug

# Run specific test in debug mode
npx playwright test payment-flow.spec.ts --debug
```

### Trace Viewer
```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots (on failure)
- Traces (on first retry)
- Videos (configurable)

Find them in: `test-results/` directory

## 📊 Test Coverage Goals

Current coverage:
- ✅ Direct tasker selection flow (complete)
- ✅ Payment integration (complete)
- ✅ Mobile responsiveness (complete)
- ✅ Error handling (complete)

Future coverage needed:
- ⏳ Open posting flow
- ⏳ Messaging system
- ⏳ Admin dashboard
- ⏳ Tasker onboarding
- ⏳ Profile management
- ⏳ Dispute resolution

## 🔧 Continuous Integration

### CI/CD Pipeline
Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

### CI Configuration
```yaml
# Example GitHub Actions workflow
- name: Run Playwright tests
  run: npx playwright test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 📝 Test Maintenance

### When to Update Tests

- **After feature changes** → Update affected test cases
- **After UI changes** → Update selectors and assertions
- **After bug fixes** → Add regression tests
- **When adding features** → Write new test coverage

### Test Review Checklist

- [ ] Tests are independent and isolated
- [ ] Test names clearly describe scenarios
- [ ] Proper wait conditions for async operations
- [ ] Error cases are covered
- [ ] Mobile viewports are tested
- [ ] Tests clean up after themselves

## 🚦 Test Status

| Test Suite | Status | Coverage |
|-----------|--------|----------|
| Direct Selection Flow | ✅ Complete | 11 tests |
| Payment Integration | ✅ Complete | Integrated |
| Mobile Responsive | ✅ Complete | Tested |
| Error Handling | ✅ Complete | Covered |
| Open Posting Flow | ⏳ Pending | Not started |
| Messaging System | ⏳ Pending | Not started |
| Admin Features | ⏳ Pending | Not started |

## 📞 Support

- **Test failures**: Check [playwright.dev/docs](https://playwright.dev/docs)
- **CI issues**: Review GitHub Actions logs
- **Writing tests**: Reference existing test files for patterns
- **Coverage questions**: Check [../docs/roadmap.md](../docs/roadmap.md) for testing priorities

---

**Remember**: Good tests give confidence to ship features quickly and safely!
