Feature: Routine-Scoped Insights & Analytics

  As an athlete or coach
  I want to filter analytics and progression charts by a specific routine program
  So that I can evaluate the isolated performance, volume, and progression of each training cycle

  Scenario: Filtering 90-day insights to an isolated routine program
    Given the user is on the "Insights" tab
    And the user has completed workouts across "PPL Hypertrophy" and "Upper/Lower Strength"
    When the user opens the "Program Scope" filter dropdown
    And the user selects "PPL Hypertrophy"
    Then the insights dashboard recalculates to show only data from "PPL Hypertrophy":
      | Analytics Widget          | Scoped Behavior                                  |
      | 90-Day Volume (Tonnage)   | Tonnage moved strictly during "PPL Hypertrophy"  |
      | Total Repetitions         | Repetitions logged under "PPL Hypertrophy"       |
      | Activity Heatmap          | Highlights sessions belonging to this routine    |
      | Weekly Volume Trajectory  | Weekly volume bars for this specific program     |

  Scenario: Comparing exercise progression across distinct routines
    Given the user is viewing exercise progression on the "Insights" tab
    When the user selects "Barbell Bench Press" with program filter set to "Upper/Lower Strength"
    Then the progression curve shows the 1RM trajectory specific to that training block
    And a program comparison pill displays the average load difference compared to "PPL Hypertrophy"
