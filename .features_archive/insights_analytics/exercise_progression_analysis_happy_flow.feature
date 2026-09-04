Feature: Per-Exercise Progression Analysis

  As an athlete analyzing individual lift development
  I want to select an exercise and review its historical progression and estimated 1RM
  So that I know when to apply progressive overload on specific movements

  Scenario: Selecting an exercise to inspect estimated 1RM and volume trajectory
    Given the user is on the "Insights" tab
    When the user selects "Barbell Bench Press" from the exercise progression selector
    Then the progression report card renders:
      | Component            | Expected Content                            |
      | Estimated 1RM Peak   | Highest calculated one-rep maximum in kg    |
      | Best Set Performance | Heaviest weight and rep combination logged  |
      | Total Sets Logged    | Cumulative sets performed for this exercise |
      | Progression Advice   | Recommended weight or rep target for next session |
