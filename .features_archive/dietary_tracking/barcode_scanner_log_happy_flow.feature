Feature: Barcode Scanner Nutrition Logging

  As an athlete preparing food at home
  I want to scan a product barcode with my camera
  So that the item is instantly identified and loaded for logging

  Scenario: Scanning a valid product barcode to populate food details
    Given the user is on the "Dietary" tab
    When the user selects the "Scan Barcode" button
    Then the camera viewport opens in the barcode scanner modal
    When a valid product barcode is detected by the scanner
    Then the camera viewfinder closes
    And the product details and nutrition values are automatically loaded into the portion logging dialog
