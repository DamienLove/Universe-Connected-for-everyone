from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies that the Dev Panel button is visible and that clicking it
    opens the SFX Upload Panel.
    """
    # 1. Arrange: Go to the application's URL.
    # The dev server runs on port 3000 as per vite.config.ts
    page.goto("http://localhost:3000")

    # 2. Act: Start the game.
    # Find the "Start Game" button and click it.
    start_button = page.get_by_role("button", name="Begin Journey")
    expect(start_button).to_be_visible(timeout=10000)
    start_button.click(force=True)

    # 3. Act: Close the tutorial.
    # The tutorial overlay blocks the dev panel button, so we close it first.
    close_button = page.get_by_role("button", name="×")
    expect(close_button).to_be_visible()
    close_button.click()

    # 4. Act: Open the Dev Panel.
    # Find the "Dev Panel" button and click it.
    dev_panel_button = page.get_by_role("button", name="Dev Panel")
    expect(dev_panel_button).to_be_visible()
    dev_panel_button.click()

    # 5. Assert: Confirm the Dev Panel is open.
    # We expect the panel's heading to be visible.
    panel_heading = page.get_by_role("heading", name="SFX Upload Panel")
    expect(panel_heading).to_be_visible()

    # 6. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/dev_panel_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()