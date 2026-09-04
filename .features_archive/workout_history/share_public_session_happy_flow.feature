Feature: Share Public Workout Session

  As an athlete proud of a training milestone
  I want to generate and copy a shareable link to my completed workout
  So that friends or coaches can view my session summary without needing an account

  Scenario: Generating and copying a public shareable workout link
    Given the user has expanded a completed workout session in the "Log Book"
    When the user selects the "Share Session" button
    Then a shareable URL containing the session identifier is copied to the system clipboard
    And a confirmation badge displaying "Link Copied!" appears on the button
