Feature: Main Application Tab Navigation

  As an active user
  I want to switch seamlessly between primary workspace tabs
  So that I can track workouts, review history, analyze insights, and log nutrition

  Scenario: Navigating between primary workspace tabs
    Given the user is logged in and viewing the "Today's Session" tab
    When the user selects the "Log Book" tab
    Then the active tab indicator highlights "Log Book"
    And the workout history log book view is displayed
    When the user selects the "Insights" tab
    Then the active tab indicator highlights "Insights"
    And the 90-day training analytics view is displayed
    When the user selects the "Dietary" tab
    Then the active tab indicator highlights "Dietary"
    And the daily macronutrient tracking view is displayed
    When the user selects the "Today's Session" tab
    Then the active tab indicator highlights "Today's Session"
    And the active workout session view is restored
