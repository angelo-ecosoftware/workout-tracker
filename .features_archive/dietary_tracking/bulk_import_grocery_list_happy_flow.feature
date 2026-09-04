Feature: Bulk Import Supermarket Grocery List

  As a user meal planning from a grocery order
  I want to import a shared supermarket list link
  So that all items in the grocery order are imported into my food database at once

  Scenario: Fetching and bulk importing a shared grocery list
    Given the user opens the "Add Food Item" modal on the "Dietary" tab
    When the user selects the "AH List" tab
    And the user enters a valid shared grocery list URL into the list input field
    And the user selects the "Extract Products" button
    Then the list of extracted grocery products is displayed with item counts
    When the user selects the "Bulk Import All" button
    Then all extracted products are imported into the user's food index
    And a confirmation badge indicates the items are ready for logging
