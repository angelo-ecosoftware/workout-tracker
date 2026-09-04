Feature: Log Standard Workout Session

  As an athlete performing a gym session
  I want to log weight, repetitions, notes, and photos for my scheduled exercises
  So that my workout performance is accurately recorded and tracked over time

  Scenario: Successfully logging an exercise set with weight and repetitions
    Given the user is on the "Today's Session" tab with an active "Push Day" routine
    When the user expands the "Incline Dumbbell Press" exercise card
    And the user enters "32" in the weight field for Set 1
    And the user enters "10" in the reps field for Set 1
    Then the set values "32 kg" and "10 reps" are registered
    And the auto-saved indicator updates with the latest timestamp

  Scenario: Successfully submitting a completed workout session
    Given the user has filled in valid weight and reps for all prescribed exercise sets
    When the user enters "Felt strong on all compound movements today" into the session notes field
    And the user selects the "Submit Workout" button
    Then a success notification confirms the workout has been saved
    And the user's progression state advances to the next suggested routine
