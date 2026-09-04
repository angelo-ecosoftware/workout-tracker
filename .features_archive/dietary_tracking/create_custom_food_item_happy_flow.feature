Feature: Create Custom Food Item

  As an athlete with specialized nutritional products
  I want to create a custom food item with exact macronutrient values per 100g
  So that I can log food items not present in the default catalog

  Scenario: Creating and saving a new custom food item
    Given the user opens the "Add Food Item" modal on the "Dietary" tab
    When the user selects the "Custom" tab
    And the user enters "Whey Isolate Vanilla" into the food name field
    And the user enters "Optimum Nutrition" into the brand field
    And the user selects "gram" as the serving unit
    And the user fills in the nutritional values per 100g:
      | Nutrient | Value |
      | Calories | 375   |
      | Protein  | 82    |
      | Carbs    | 3.5   |
      | Sugar    | 1.2   |
      | Fat      | 1.8   |
      | Fiber    | 0.5   |
    And the user selects the "Save Food Item" button
    Then a success message confirms the custom item was saved to the personal catalog
    And the item becomes available in the search tab for immediate logging
