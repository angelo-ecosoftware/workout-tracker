Feature: 90-Day Activity and Consistency Heatmap

  As an athlete tracking workout consistency
  I want to view an interactive calendar heatmap of my training days
  So that I can visualize training frequency, rest periods, and volume distribution

  Scenario: Inspecting specific training day volume on the activity heatmap
    Given the user is on the "Insights" tab viewing the "Activity & Consistency Heatmap"
    When the user hovers over or taps an active training day block
    Then the day details pill displays:
      | Detail Field    | Expected Content                   |
      | Date            | Selected calendar date             |
      | Sessions Count  | Number of sessions completed       |
      | Routine Name    | Name of the completed routine      |
      | Volume Moved    | Total volume tonnage moved in kg   |
