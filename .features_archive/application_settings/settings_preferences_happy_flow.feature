Feature: Application Settings & Appearance Preferences

  As a user customizing application behavior
  I want to toggle visual themes, configure assisted timers, and manage accounts
  So that the app suits my visual preferences and workout style

  Scenario: Switching application theme and adjusting rest timer settings
    Given the user opens the "Settings" modal from the header
    When the user selects the "Cyberpunk Neon" theme option
    Then the application color scheme immediately updates to Cyberpunk Neon
    When the user toggles "Assisted Timed Workout" to enabled
    And the user adjusts the rest duration slider to "90 seconds"
    Then the rest duration preference is saved as 90 seconds
    And the user closes the settings modal
