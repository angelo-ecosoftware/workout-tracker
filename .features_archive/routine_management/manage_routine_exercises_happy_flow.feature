Feature: Routine Exercises Management

  As an athlete organizing a specific workout routine
  I want to add exercises from the catalog, reorder them, and adjust target rep ranges
  So that each routine contains my exact exercise selection and set parameters

  Scenario: Adding an exercise from the catalog and setting target ranges
    Given the user is editing the "Leg Hypertrophy" routine in the Routine Editor modal
    When the user selects the "Add Exercise" button
    And the user searches for "Romanian Deadlift" in the exercise picker
    And the user selects "Romanian Deadlift" from the search results
    Then "Romanian Deadlift" is added to the routine exercise list
    When the user sets the target sets to "4"
    And the user sets the target rep range to "8 - 12"
    And the user sets the rest timer to "120 seconds"
    And the user selects the "Save Changes" button
    Then the exercise parameters are saved successfully
