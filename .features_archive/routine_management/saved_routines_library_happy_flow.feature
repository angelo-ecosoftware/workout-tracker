Feature: Saved Routines Library & Program Switching

  As an athlete
  I want a personal library of saved training programs and routine splits
  So that I can switch between seasonal programs, save custom templates, and keep my routines isolated

  Scenario: Saving current active routine split to the routines library
    Given the user is on the "Edit Routines & Exercises" modal
    When the user selects the "Save Routine As New Program" action
    And the user enters "Hypertrophy Push-Pull-Legs v2" as the program title
    And the user selects the "Save to Library" button
    Then "Hypertrophy Push-Pull-Legs v2" appears in the user's "Saved Routines" library
    And a confirmation badge indicates the program has been archived safely

  Scenario: Switching active program from the saved routines library
    Given the user has multiple programs saved in their "Saved Routines" library
    When the user opens the "Saved Routines" section in Settings
    And the user selects the "Activate Program" button on "4-Day Upper/Lower Strength Split"
    Then the active routine split immediately switches to "4-Day Upper/Lower Strength Split"
    And the "Today's Session" tab updates with the newly activated routine days and exercises
    And the previous program remains stored in the library without loss of configuration
