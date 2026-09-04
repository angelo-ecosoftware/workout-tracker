Feature: Recovery and Daily Readiness Logging

  As an athlete tracking recovery variables
  I want to record sleep duration, energy level, and bodyweight on workout days
  So that I can correlate recovery quality with lifting performance

  Scenario: Updating recovery metrics and daily bodyweight
    Given the user is preparing to log today's workout session
    When the user selects "8.0 hrs" in the sleep duration picker
    And the user selects "9 / 10" in the energy level selector
    And the user enters "82.5" in the daily bodyweight field
    Then the recovery summary updates to reflect 8.0 hours of sleep and high energy
    And the daily bodyweight displays "82.5 kg"
    And the draft session state is automatically updated
