Feature: Dietary Date Navigation & Macro Totals

  As an athlete managing daily nutrition
  I want to navigate across different dates and see aggregated macronutrient totals
  So that I can ensure my daily caloric and protein intake match my fitness goals

  Scenario: Navigating to previous day and viewing aggregated macronutrient totals
    Given the user is on the "Dietary" tab for "Today"
    When the user selects the "Previous Day" navigation arrow
    Then the date title updates to the previous day
    And the "Next Day" navigation button becomes enabled
    And the daily summary cards display:
      | Macro Metric | Display Unit |
      | Total Energy | kcal         |
      | Protein      | grams (g)    |
      | Carbohydrates| grams (g)    |
      | Dietary Fat  | grams (g)    |
      | Fiber        | grams (g)    |
      | Sugars       | grams (g)    |

  Scenario: Navigating back to today disables future date navigation
    Given the user is viewing a previous date on the "Dietary" tab
    When the user selects the "Next Day" navigation arrow until the date reaches "Today"
    Then the date badge displays "Today"
    And the "Next Day" navigation button is disabled to prevent future logging
