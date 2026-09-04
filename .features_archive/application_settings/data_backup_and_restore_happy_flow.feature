Feature: Data Backup & Restore

  As a user ensuring data safety and portability
  I want to export my entire workout and nutrition history to JSON and restore from a backup
  So that my historical data is secure and portable

  Scenario: Exporting complete user data backup file
    Given the user is in the "Settings" modal under the "Data Backup & Storage" section
    When the user selects the "Export Complete Backup" button
    Then a JSON file containing all routines, exercises, workout history, and dietary logs is downloaded to the user's device
    And the filename includes the user's sanitized username

  Scenario: Restoring user data from a valid JSON backup file
    Given the user is in the "Settings" modal under the "Data Backup & Storage" section
    When the user selects the "Restore Backup File" action
    And the user provides a valid workout tracker backup JSON file
    Then a confirmation dialog announces that all routines, exercises, and logs have been restored
    And the application refreshes to display the restored dataset
