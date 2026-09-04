Feature: Athlete Profile Management

  As an athlete
  I want to update my biometrics, training experience, fitness goals, and location
  So that the application tailors volume recommendations and analytics to my profile

  Scenario: Successfully updating biometric measurements and fitness goals
    Given the user is logged in
    When the user selects the profile avatar in the application header
    Then the "Athlete Profile" modal opens with current profile values
    When the user enters "1995-06-15" into the date of birth field
    And the user enters "183" into the height field
    And the user enters "84.0" into the weight field
    And the user selects "Intermediate" as the fitness level
    And the user selects "Build Muscle (Hypertrophy)" and "Increase Strength" as goals
    And the user selects "Commercial Gym" as the primary training location
    And the user selects the "Save Profile" button
    Then the profile changes are saved successfully
    And the calculated age and updated biometrics are reflected across the application
