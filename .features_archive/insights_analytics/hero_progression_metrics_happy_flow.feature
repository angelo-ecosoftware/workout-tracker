Feature: 90-Day Hero Progression Metrics

  As an athlete tracking high-level training volume
  I want to review total tonnage moved, total reps completed, and time under tension
  So that I have an immediate high-level summary of my workload

  Scenario: Viewing hero progression cards and toggling educational info popovers
    Given the user is on the "Insights" tab with logged workout history
    When the 90-Day Training Insights view loads
    Then the user sees the following hero metrics:
      | Metric Card           | Displayed Value                  |
      | 90-Day Volume         | Total cumulative weight in kg    |
      | Total Repetitions     | Total count of completed reps    |
      | Total Time in Tension | Formatted hours and minutes      |
    When the user selects the information icon on the "90-Day Volume" card
    Then an educational popover displays explaining volume load and progressive overload principles
