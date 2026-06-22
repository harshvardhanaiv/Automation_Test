# Schedule Reports by Time - Right Now
=====================================

## Introduction
---------------

The **Schedule Reports by Time – Right Now** feature allows you to generate a report output immediately after scheduling. This document explains how to configure and execute reports using the **Right Now** scheduling option.

## Objectives & Use Cases
-------------------------

- Schedule and execute a report instantly using the **Right Now** scheduling option.
- Apply this procedure anywhere scheduling is supported throughout the application.

## Prerequisites
---------------

For this example, we will be using the **Order details.rptdesign** report.

1. Download the required sample files from the link [report.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip).
2. Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.
3. Refer to this <a href="../../.././common/upload" target="_blank">link</a> for detailed steps on uploading files in the application.

## Step-by-Step Guide
---------------------

### 1. Open a Report for Scheduling

*   You can open a report using two methods:
    *   I. **Directly schedule** by clicking on the desired output format option (for example: **rptdocument**, **XLSX**, **DOCX**, **PDF**, etc.) as shown in the image below.

        ![Description of Action](../../../../screenshots/documents/reports/reports-navigation-menu.png)

    *   II. Double-click the desired report name to open it for scheduling.
*   The **Parameters** tab will open by default.

### 2. Parameter Tab

*   Use the <a href=".././parameter" target="_blank">**Parameter Tab**</a> to provide the required input values for generating the report.
*   Parameters marked with an asterisk **(*)** are mandatory.
*   After entering all parameters, click on the **Schedule Tab**.

### 3. Schedule Tab

*   I. **Schedule Type**: Select **Time** from the dropdown list to schedule the report based on time.
*   II. **Frequency**: Choose **Right Now** from the available options (**Right Now**, **Once**, **Recurring**).
    - When you select **Right Now**, the system prepares the report for immediate execution.
    - No additional date or time selection is required.

### 4. Output Tab

*   Use the <a href=".././output" target="_blank">**Output Tab**</a> to define the report’s output format, file name, and storage location.
*   For example, you can generate the report in **PDF**, **XLSX**, or **DOCX** format.

### 5. Email Tab

*   Use the <a href=".././email" target="_blank">**Email Tab**</a> to configure recipients, email subject, and attachments for the automatic delivery of the generated report.

### 6. Final Execution

*   After configuring all required tabs (**Parameter**, **Schedule**, **Output**, and **Email**), you are ready to execute the report.
*   At the bottom of the scheduling window, the following buttons are available:

    | **Button** | **Description** |
    |-------------|-----------------|
    | **RUN** | Executes the report immediately according to your configuration. |
    | **SAVE AS QUICKRUN** | Saves the current report setup, including selected parameters, for quick and easy future execution. To know more, see <a href="../../../documents/quick_run/introduction" target="_blank">Quick Run</a> <br>|
    | **CANCEL** | Cancels the scheduling process and closes the window. |

### 7. Click RUN to Execute the Report

*   Once completed, the output will either open in a new tab or display a download prompt, depending on the selected format (e.g., **PDF**, **XLSX**, or **DOCX**).

![Executed report output displayed in a new browser tab](../../../../screenshots/documents/reports/reports-rightnow-executed-newtab.png)

### 8. Monitoring Report Execution Status

*   You can monitor the report execution status in the **Request** section of the application.
*   This section displays reports that are **Completed**, **Running**, **Failed**, or **Scheduled** for future execution.
*   In case of failure, the error reason will be displayed for troubleshooting.

![Description of Action](../../../../screenshots/documents/reports/reports-daily-25-run-verified.png)