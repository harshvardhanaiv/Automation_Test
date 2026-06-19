Hide Grid in Report Export
==========================

The **Hide Grid in Report** feature allows users to disable gridlines in reports exported to Excel formats such as **aiv-xlsx**, **xlsx**, **xls**, and **xls\_spudsoft**. This ensures a cleaner, grid-free layout in exported or scheduled Excel reports.

### Use Case
Consider a scenario where a user needs to export or schedule a report in Excel format but prefers to hide gridlines for a cleaner presentation or professional formatting.

### Objective
Learn how to disable gridlines in scheduled or exported Excel reports.

### Prerequisites
For this example, the report used is **Order details.rptdesign**. Download the required sample files from the link [hidegridreportexport.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip) and upload it to the **Report Section** under the **Root** folder.

### Steps to Hide Grids in Scheduled Reports
To hide gridlines in scheduled reports, follow these steps:

1.  By default, gridlines are visible when you export or schedule reports in **XLSX** format.
    ![Gridlines Visible](../../../../screenshots/documents/reports/reports-daily-15-once-datepicker.png)
2.  Click the **Run** button to execute the report. A confirmation popup will appear indicating that the file is being downloaded.
    ![Waiting for File Download](../../../../screenshots/documents/reports/reports-daily-16-confirm-download.png)
3.  The report output will display with visible gridlines, as shown below:
    ![Gridlines in Report Output](../../../../screenshots/documents/reports/hidegrid1-report-output.png)
4.  To hide these gridlines, go to the **Output** tab in the **Scheduler** window and check the **Hide Grid** option.
    ![Hide Grid Option in Scheduler](../../../../screenshots/documents/reports/reports-daily-17-output-tab.png)
5.  Once the checkbox is selected, rerun the report. The output will appear without gridlines, as shown below:
    ![Report Output Without Gridlines](../../../../screenshots/documents/reports/hidegrid3-report-output-no-gridlines.png)

### Steps to Hide Grids in Exported Reports
To hide gridlines in exported reports, follow these steps:

1.  Click the **Export Report** option from the report viewer toolbar.
    ![Export Report Option](../../../../screenshots/documents/reports/hidegrid4-export-option.png)
2.  The **Export Report** dialog box will appear, as shown below.
    ![Export Report Dialog Box](../../../../screenshots/documents/reports/hidegrid5-export-dialog-box.png)
3.  From the **Select a Module** dropdown, choose the desired export format — such as PDF or **XLS\_SPUDSOFT**.
4.  In the Page Range section, select one of the following options:
    *   **All Pages** – Exports the complete report.
    *   **Current Page** – Exports only the visible pages.
    *   **Pages** – Allows you to specify a custom page range manually.
5.  Enable the **Hide Grid** checkbox to remove gridlines from the exported Excel report. This option is available for XLSX, XLS, and XLS\_SPUDSOFT formats.
6.  Optionally, check the **Single Sheet** box if you want to export all report pages into one consolidated Excel sheet.
7.  Click **SUBMIT** to export the report with the selected settings, or click **CANCEL** to close the dialog box without exporting.

### Tips and Reminders
*   The **Hide Grid** option is only available for XLSX, XLS, and XLS\_SPUDSOFT formats.
*   Make sure to select the correct format from the dropdown before enabling the **Hide Grid** checkbox.