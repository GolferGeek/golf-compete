# End-to-End Tests for Golf Compete

This directory contains end-to-end tests for the Golf Compete application using Playwright.

## Test Structure

- `home.spec.ts` - Tests for the home page
- `about.spec.ts` - Tests for the about page
- `contact.spec.ts` - Tests for the contact page
- `profile.spec.ts` - Tests for user profile functionality
- `equipment.spec.ts` - Tests for equipment management
- `user-journey.spec.ts` - Tests for complete user journeys
- `admin-journey.spec.ts` - Tests for admin functionality (courses, series, events)

## Utilities

- `utils/test-user.ts` - Utility for managing test users
- `utils/test-equipment.ts` - Utility for managing test equipment
- `utils/test-admin.ts` - Utility for managing admin entities (courses, series, events)

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Testing Strategy

Our E2E testing strategy focuses on testing real user flows with actual data (no mocks). The tests create real entities in the database, perform operations on them, and then clean up after themselves.

### Admin Testing

The admin tests (`admin-journey.spec.ts`) cover the core administrative functionality:

1. **Course Management**
   - Creating a new course
   - Adding tee boxes
   - Adding scorecard data
   - Deleting a course

2. **Series Management**
   - Creating a new series
   - Adding participants to a series
   - Deleting a series

3. **Event Management**
   - Creating a new event
   - Adding participants to an event
   - Deleting an event

### Test Data Management

- Each test run creates entities with unique names (using timestamps)
- Entity IDs are tracked for proper cleanup
- All created entities are deleted at the end of the test run

### Test User

The tests use a predefined admin user to perform administrative actions. Make sure this user exists in your test environment with the correct permissions.

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests.
2. **Cleanup**: Always clean up created entities to prevent test data accumulation.
3. **Assertions**: Include meaningful assertions to verify that operations succeeded.
4. **Logging**: Use console.log for important information like entity IDs.
5. **Selectors**: Use role-based selectors when possible for better resilience. 