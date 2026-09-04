Feature: View Workout History Log Book

  As an athlete reviewing past performance
  I want to browse previous completed workouts and inspect individual set details
  So that I can evaluate long-term strength gains and session consistency

  Scenario: Expanding a past workout session to inspect exercises and sets
    Given the user is on the "Log Book" tab
    And a list of completed workout sessions is displayed in chronological order
    When the user selects a past workout card titled "Pull Day Hypertrophy"
    Then the session details expand to reveal:
      | Field            | Expected Display Value           |
      | Session Date     | Formatted date and completion time |
      | Total Volume     | Calculated total tonnage in kg   |
      | Total Sets       | Total completed sets count       |
      | Exercise Summary | Individual exercise breakdown with weights and reps |
