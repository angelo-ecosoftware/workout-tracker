Feature: First-Time User Welcome Modal

  As a newly onboarded athlete
  I want to view a welcome overview of tracker capabilities
  So that I understand progressive overload principles and log book tracking

  Scenario: Acknowledging and closing the first-time welcome modal
    Given the user logs into the application for the first time
    When the welcome dialog titled "Level Up Your Training" is presented
    And the user reads the progressive overload and clean log book highlights
    And the user selects the "Get Started" button
    Then the welcome dialog closes with a smooth transition
    And the user is presented with the active workout dashboard
    And the welcome dialog is not shown again on subsequent page refreshes
