Feature: Workout Session Photo Management

  As an athlete tracking physique and form progress
  I want to attach and view workout photos within a logged session
  So that I have visual documentation of my progress

  Scenario: Attaching a photo to a logged workout session
    Given the user has expanded a completed workout session in the "Log Book"
    When the user selects the "Add Photo" button
    And the user selects a valid image file from their device
    Then the selected photo is uploaded and added to the session photo gallery
    And the photo thumbnail is visible within the session details card
