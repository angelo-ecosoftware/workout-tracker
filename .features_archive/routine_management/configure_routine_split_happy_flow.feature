Feature: Routine Split Configuration

  As an athlete customizing my training schedule
  I want to create, rename, and reorder workout routine split days
  So that the app reflects my custom training program

  Scenario: Adding and renaming a new workout routine day
    Given the user opens the "Edit Routines & Exercises" modal from Settings
    When the user selects the "Add Workout Day" button
    Then a new routine tab appears in the editor
    When the user enters "Day 4 - Leg Hypertrophy & Calves" as the workout name
    And the user selects the "Save Changes" button
    Then a success message confirms the routine was updated
    And the new routine day is selectable in the routine split selector
