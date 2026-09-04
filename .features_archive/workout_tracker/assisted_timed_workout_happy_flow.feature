Feature: Assisted Timed Workout Mode

  As an athlete in the gym
  I want guided set countdowns and automated rest timers
  So that I maintain optimal workout pacing and time under tension

  Scenario: Completing a guided set and triggering automated rest countdown
    Given the user has enabled "Assisted Timed Workout" in settings
    And the user starts the active routine in assisted mode
    When the user completes the active exercise set
    And the user selects the "Complete Set" button
    Then the audio cue signals set completion
    And the rest countdown timer automatically begins counting down from the configured rest interval
    And the upcoming exercise set details are displayed on the screen
