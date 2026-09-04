Feature: 90-Day Biometrics and BMI Matrix

  As an athlete monitoring body composition
  I want to view my calculated BMI score, standard health category, and weigh-in history
  So that I can evaluate weight trends relative to training intensity

  Scenario: Viewing BMI category status and historical weigh-in matrix
    Given the user has configured valid height and weight in their athlete profile
    And the user is on the "Insights" tab
    When the user views the "Body Mass Index (BMI) & Biometrics" section
    Then the BMI score card displays the calculated value with the WHO standard category badge
    And the 90-day weigh-in calendar grid renders color-coded blocks for logged bodyweight days
    When the user hovers over a logged weigh-in date
    Then the hover pill displays the exact recorded weight in kg and calculated BMI
