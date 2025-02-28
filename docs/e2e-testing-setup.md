# End-to-End Testing Setup

This document outlines the end-to-end (E2E) testing setup for the GolfCompete application using Playwright.

## Overview

We've implemented E2E testing using Playwright, a modern testing framework that allows us to test our application in real browsers. The tests are designed to verify that the application works correctly from a user's perspective, testing the entire application stack from the UI to the backend.

## Test Structure

The tests are organized in the `/e2e` directory and are structured as follows:

- `home.spec.ts`: Tests for the homepage functionality
  - Verifies that the homepage loads correctly
  - Checks for the presence of navigation elements
  - Ensures the footer is displayed with the correct information

- `about.spec.ts`: Tests for the about page functionality
  - Verifies that the about page loads correctly
  - Checks for the presence of content
  - Tests navigation back to the homepage

- `responsive.spec.ts`: Tests for responsive design
  - Tests the application on mobile viewport sizes
  - Tests the application on tablet viewport sizes
  - Tests the application on desktop viewport sizes

## Running Tests

The following npm scripts are available for running the tests:

```bash
# Run all E2E tests
yarn test:e2e

# Run E2E tests with UI mode
yarn test:e2e:ui

# Run E2E tests in debug mode
yarn test:e2e:debug

# View the HTML report of the last test run
yarn test:e2e:report
```

You can also run tests for specific browsers:

```bash
# Run tests only in Chromium
yarn test:e2e --project=chromium

# Run tests only in Firefox
yarn test:e2e --project=firefox

# Run tests only in WebKit (Safari)
yarn test:e2e --project=webkit
```

Or run specific test files:

```bash
# Run only the home page tests
yarn test:e2e e2e/home.spec.ts
```

## CI Integration

The E2E tests are automatically run on GitHub Actions for all pull requests and pushes to the main branch. The workflow is defined in `.github/workflows/e2e-tests.yml`.

The test results are uploaded as artifacts and can be viewed in the GitHub Actions tab.

## Test Configuration

The Playwright configuration is defined in `playwright.config.ts` and includes:

- Browser configurations for Chromium, Firefox, and WebKit
- Mobile device configurations for testing responsive design
- Automatic screenshot capture on test failure
- HTML report generation
- Automatic starting of the development server before running tests

## Best Practices

When writing E2E tests, follow these best practices:

1. **Keep tests independent**: Each test should be able to run independently of others.
2. **Use specific selectors**: Use specific selectors that are unlikely to change, such as data-testid attributes.
3. **Test user flows**: Focus on testing complete user flows rather than individual components.
4. **Minimize test flakiness**: Avoid timeouts and use proper waiting mechanisms.
5. **Keep tests maintainable**: Use page objects or similar patterns to keep tests maintainable.

## Future Improvements

- Add more comprehensive tests for user flows
- Implement visual regression testing
- Add performance testing
- Integrate with a testing dashboard for better visibility of test results 