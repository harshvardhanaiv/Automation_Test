# UI/UX & Usability Feedback Report
=====================================

## Discoverability: Buttons, Settings, and Actions
-----------------------------------------------

*   The "Hide Grid" option is not immediately visible when exporting or scheduling reports. It's buried within the "Output" tab in the Scheduler window.
*   When exporting a report, users need to click on the "Export Report" button and then navigate through multiple settings before finding the "Hide Grid" checkbox.

## Click Depth: Number of Clicks Required
-----------------------------------------

*   To hide gridlines in scheduled reports, users must perform 5 clicks:
	1. Open the Scheduler window.
	2. Go to the Output tab.
	3. Check the Hide Grid option.
	4. Rerun the report.
*   Exporting a report with hidden gridlines requires 7 clicks:
	1. Click on the Export Report button.
	2. Select the desired export format from the dropdown.
	3. Enable the Hide Grid checkbox.
	4. Optionally, select Single Sheet.
	5. Click SUBMIT.

## Visual Layout & Consistency: Form Layouts and Datepicker Usability
-------------------------------------------------------------------

*   The Export Report dialog box has a cluttered layout with multiple settings and options. Consider grouping related settings together or using a more tabbed interface.
*   The Page Range section could be improved by providing a dropdown for common page ranges (e.g., 1-5, 6-10) to simplify the export process.

## Recommendations: Design Suggestions
-----------------------------------------

### 1. Improve Discovery

*   Display the "Hide Grid" option prominently on the report viewer toolbar or in the Export Report dialog box.
*   Consider adding a tooltip or hint text explaining the purpose of the "Hide Grid" checkbox.

### 2. Reduce Click Depth

*   Automate the gridlines hiding process when scheduling reports by making it an optional setting within the Scheduler window.
*   Simplify the export process by consolidating settings into fewer steps.

### 3. Visual Layout and Consistency

*   Redesign the Export Report dialog box to have a more modern, tabbed layout with clear headings and concise descriptions.
*   Implement a datepicker or dropdown for common page ranges in the Page Range section.

### 4. Color Scheme and Branding

*   Apply AIV's brand colors (e.g., #3498db) consistently throughout the application to improve visual cohesion.
*   Use AIV's font stack (e.g., Open Sans, Arial) to maintain a consistent typography experience.

### 5. Accessibility Improvements

*   Ensure that all settings and options are accessible through keyboard navigation or screen readers for users with disabilities.
*   Implement high contrast mode to ensure the application remains usable in low-light environments.

By implementing these design suggestions, you can improve the user experience, reduce friction points, and enhance the overall usability of the AIV Reports feature.