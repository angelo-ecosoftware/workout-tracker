Feature: User Authentication & Access

  As a registered athlete
  I want to log in using my credentials or single sign-on
  So that I can securely access my personal training sessions and progress data

  Scenario: Successful login with valid email and password
    Given the user is on the login screen
    When the user enters "athlete@example.com" into the email address field
    And the user enters "ValidPassword123!" into the password field
    And the user selects the "Sign In" button
    Then the user is authenticated successfully
    And the user is navigated to the "Today's Session" main view
    And the user profile avatar is visible in the application header

  Scenario: Successful login via Google Single Sign-On
    Given the user is on the login screen
    When the user selects the "Continue with Google" button
    And the user completes the external Google authorization successfully
    Then the user is authenticated successfully
    And the user is navigated to the "Today's Session" main view
    And the user's Google display name and profile picture appear in the application header
