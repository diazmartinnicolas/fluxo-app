# E2E Tests with Playwright

These tests cover the critical flows of the Fluxo application: Login, POS Checkout, and Kitchen Display.

## Setup

1.  Ensure dependencies are installed:
    ```bash
    npm install
    npx playwright install
    ```

2.  Ensure local development server is running (Playwright will try to start it if not):
    ```bash
    npm run dev
    ```

## Running Tests

-   **Run all tests:**
    ```bash
    npx playwright test
    ```

-   **Run tests with UI mode (interactive):**
    ```bash
    npx playwright test --ui
    ```

-   **Debug tests:**
    ```bash
    npx playwright test --debug
    ```

## Troubleshooting

-   If tests fail due to "Connection Refused", ensure port 3000 is free or update `playwright.config.ts`.
-   If login fails, verify the demo credentials in `tests/utils.ts` match your local environment or `.env` file.
