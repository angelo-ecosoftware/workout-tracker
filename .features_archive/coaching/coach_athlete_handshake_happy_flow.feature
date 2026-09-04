Feature: Coach-Athlete Mutual Connection Handshake & Routine Proposal

  As an athlete
  I want to review and accept a coach's connection invite and evaluate proposed routines
  So that my coach can guide my training without overwriting my existing workouts without consent

  Scenario: Athlete accepts a coach invitation
    Given the athlete receives an invitation from "Coach Alex"
    When the athlete views pending coach invitations in the application settings
    And the athlete selects "Accept Connection" for "Coach Alex"
    Then "Coach Alex" is listed as an active authorized coach
    And a confirmation badge indicates the coach is connected

  Scenario: Athlete reviews and applies a coach-proposed routine to their library
    Given the athlete is connected with "Coach Alex"
    When "Coach Alex" sends a proposed program titled "4-Day Upper/Lower Strength Split"
    And the athlete opens the "Proposed Routines" notification card
    And the athlete reviews the prescribed exercises, sets, and rep ranges
    And the athlete selects the "Save to My Routines & Activate" button
    Then the new program is added to the athlete's "Saved Routines" library
    And the new program is set as the active workout split
    And the athlete's previous routine remains preserved in their library
