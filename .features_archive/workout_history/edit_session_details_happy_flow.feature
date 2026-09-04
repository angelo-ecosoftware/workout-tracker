Feature: Edit Past Workout Session Details

  As an athlete maintaining accurate records
  I want to edit the date, notes, and bodyweight of a past workout session
  So that any historical logging discrepancies can be corrected

  Scenario: Editing workout notes for a completed session
    Given the user has expanded a completed workout session in the "Log Book"
    When the user selects the "Edit Notes" action
    And the user updates the notes text to "Swapped barbell bench for dumbbells due to shoulder fatigue"
    And the user selects the "Save Notes" button
    Then the updated notes are displayed on the workout card
    And the inline editor closes successfully

  Scenario: Updating the recorded bodyweight for a historical session
    Given the user has expanded a completed workout session in the "Log Book"
    When the user selects the "Edit Bodyweight" action
    And the user enters "81.8" into the bodyweight field
    And the user selects the "Save Weight" button
    Then the session bodyweight reflects "81.8 kg"
    And the inline weight editor closes successfully
