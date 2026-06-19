Hide Grid in Report Export
==========================

The **Hide Grid in Report** feature allows users to disable gridlines in reports exported to Excel formats such as **aiv-xlsx**, **xlsx**, **xls**, and **xls\_spudsoft**. This ensures a cleaner, grid-free layout in exported or scheduled Excel reports.

* * *

#### Use Case

Consider a scenario where a user needs to export or schedule a report in Excel format but prefers to hide gridlines for a cleaner presentation or professional formatting.

* * *

#### Objective

Learn how to disable gridlines in scheduled or exported Excel reports.

* * *

#### Prerequisites

1.  For this example, the report used is **Order details.rptdesign**.
    
2.  Download the required sample files from the link [hidegridreportexport.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip)
    
3.  Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.
    
4.  Refer to this [link](../../.././common/upload) for detailed steps on uploading files in the application.
    
5.  The report should support export formats such as **XLSX**, **XLS**, or **XLS\_spudsoft**.
    

* * *

**Hide Gridlines in Report:** This video explains how to hide gridlines in a report within the application.

* * *

#### Steps to Hide Grids in Scheduled Reports

1.  By default, gridlines are visible when you export or schedule reports in **XLSX** format.
    
    ![Image](/_astro/hidegrid.ab724aff_Z2eDFWG.webp)
    
2.  Click the **Run** button to execute the report. A confirmation popup will appear indicating that the file is being downloaded.
    
    ![Image](/_astro/waitfilebeingdownloaded.a5a6a26d_RQ8ca.webp)
    
3.  The report output will display with visible gridlines, as shown below:
    
    ![Image](/_astro/hidegrid1.90a1c773_Z1dhwqf.webp)
    
4.  By default, the **Hide Grid** checkbox in the Scheduler window’s **Output** tab is **unchecked**, meaning gridlines will appear. To hide these gridlines, go to the **Output** tab in the **Scheduler** window and check the **Hide Grid** option.
    
    ![Image](/_astro/hidegrid2.2f38f44f_Z1h7ENp.webp)
    
5.  Once the checkbox is selected, rerun the report. The output will appear without gridlines, as shown below:
    
    ![Image](/_astro/hidegrid3.65cf33e6_ZC0Yyu.webp)
    

* * *

#### Steps to Hide Grids in Exported Reports

1.  Click the **Export Report** option from the report viewer toolbar.
    
    ![Image](/_astro/hidegrid4.1c7921d3_1QOBOY.webp)
    
2.  The **Export Report** dialog box will appear, as shown below.
    
    ![Image](/_astro/hidegrid5.a30b3bb1_imPQp.webp)
    
3.  From the **Select a Module** dropdown, choose the desired export format — such as PDF or **XLS\_SPUDSOFT**.
    
4.  In the Page Range section, select one of the following options:
    
    *   **All Pages** – Exports the complete report.
    *   **Current Page** – Exports only the visible pages.
    *   **Pages** – Allows you to specify a custom page range manually.
5.  Enable the **Hide Grid** checkbox to remove gridlines from the exported Excel report. This option is available for XLSX, XLS, and XLS\_SPUDSOFT formats.
    
6.  Optionally, check the **Single Sheet** box if you want to export all report pages into one consolidated Excel sheet.
    
7.  Click **SUBMIT** to export the report with the selected settings, or click **CANCEL** to close the dialog box without exporting.
    

* * *

[Previous  
Email Tab](/aiv/documents/report/email/) [Next  
Hide Report Options](/aiv/documents/report/hide_report_options/)