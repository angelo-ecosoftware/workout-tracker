Feature: Import Product from Supermarket Link

  As a user shopping online
  I want to paste a supermarket product URL to fetch its nutritional values
  So that I can log accurate store items without manual data entry

  Scenario: Successfully extracting product information from a valid store URL
    Given the user opens the "Add Food Item" modal on the "Dietary" tab
    When the user selects the "Product Link" tab
    And the user enters a valid supermarket product URL into the link input field
    And the user selects the "Fetch & Ingest" button
    Then a preview card appears displaying the extracted product title, brand badge, and macro table
    When the user specifies "125" grams and selects "Add to Daily Log"
    Then the product is added to today's logged food list
    And the modal closes successfully
