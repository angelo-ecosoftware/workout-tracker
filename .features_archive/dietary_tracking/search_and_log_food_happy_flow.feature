Feature: Search and Log Food Items

  As an athlete logging a meal
  I want to search the food database, specify portion size, and add items to my daily log
  So that my nutritional intake is automatically calculated and recorded

  Scenario: Searching catalog and logging a food portion
    Given the user is on the "Dietary" tab
    When the user selects the "Log Food" button
    Then the "Add Food Item" modal opens on the "Search" tab
    When the user enters "Oatmeal" into the food search field
    Then matching food catalog items are displayed with brand names and store badges
    When the user selects "Rolled Oats" from the catalog
    And the user enters "80" into the portion grams field
    And the user selects the "Add to Log" button
    Then the modal closes
    And "Rolled Oats (80g)" appears in the logged foods list
    And the daily calorie and carbohydrate totals increase accordingly

  Scenario: Updating the portion size of an already logged food item
    Given the user has "Chicken Breast" logged with a portion of "150g"
    When the user changes the portion size input to "200"
    Then the displayed calories and protein for "Chicken Breast" recalculate dynamically
    And the daily macro summary totals update immediately
