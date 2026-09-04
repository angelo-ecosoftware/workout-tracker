Feature: Delete Logged Workout Sessions

  As an athlete managing my log book
  I want to select and delete redundant or accidental workout sessions
  So that my history and analytical volume remain clean and accurate

  Scenario: Deleting a selected workout session with confirmation
    Given the user is on the "Log Book" tab
    When the user activates "Manage / Delete Mode"
    And the user selects the checkbox for an accidental workout entry
    And the user selects the "Delete Selected" button
    And the user confirms the action in the confirmation dialog
    Then the selected workout session is removed from the log book
    And the total session count updates accordingly
