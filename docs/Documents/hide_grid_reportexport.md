---
id: hidegrid_reportexport  
title: Hide Grid in Report Export  
sidebar_position: 7
---

The **Hide Grid in Report** feature allows users to disable gridlines in reports exported to Excel formats such as **aiv-xlsx**, **xlsx**, **xls**, and **xls_spudsoft**. This ensures a cleaner, grid-free layout in exported or scheduled Excel reports.

---

## <h4>Use Case</h4>

Consider a scenario where a user needs to export or schedule a report in Excel format but prefers to hide gridlines for a cleaner presentation or professional formatting.

---

## <h4>Objective</h4>

Learn how to disable gridlines in scheduled or exported Excel reports.

---

## <h4> Prerequisites </h4>

1. For this example, the report used is **Order details.rptdesign**.

2. Download the required sample files from the link [hidegridreportexport.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip)

3. Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.

4. Refer to this <a href="../../.././common/upload" target="_blank">link</a> for detailed steps on uploading files in the application.

5. The report should support export formats such as **XLSX**, **XLS**, or **XLS_spudsoft**.

---

**Hide Gridlines in Report:** This video explains how to hide gridlines in a report within the application.

<iframe style="height:400px; width:550px;" src="https://www.youtube.com/embed/5GoJdv6si0s?si=uzQ0kmkpztP_D46O" title="Hide Grid in Report" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---

## <h4>Steps to Hide Grids in Scheduled Reports</h4>

1. By default, gridlines are visible when you export or schedule reports in **XLSX** format.  

   ![Image](../../../aiv_img/documents/reports/hidegrid.png)

2. Click the **Run** button to execute the report. A confirmation popup will appear indicating that the file is being downloaded.

    ![Image](../../../aiv_img/documents/reports/waitfilebeingdownloaded.png)

3. The report output will display with visible gridlines, as shown below:

   ![Image](../../../aiv_img/documents/reports/hidegrid1.png)

4. By default, the **Hide Grid** checkbox in the Scheduler window’s **Output** tab is **unchecked**, meaning gridlines will appear. To hide these gridlines, go to the **Output** tab in the **Scheduler** window and check the **Hide Grid** option.

    ![Image](../../../aiv_img/documents/reports/hidegrid2.png)

5. Once the checkbox is selected, rerun the report. The output will appear without gridlines, as shown below:

    ![Image](../../../aiv_img/documents/reports/hidegrid3.png)

---

## <h4>Steps to Hide Grids in Exported Reports</h4>

1. Click the **Export Report** option from the report viewer toolbar.

    ![Image](../../../aiv_img/documents/reports/hidegrid4.png)

2. The **Export Report** dialog box will appear, as shown below.

    ![Image](../../../aiv_img/documents/reports/hidegrid5.png)

3. From the **Select a Module** dropdown, choose the desired export format — such as PDF or **XLS_SPUDSOFT**.

4. In the Page Range section, select one of the following options:

    - **All Pages** – Exports the complete report.
    - **Current Page** – Exports only the visible pages.
    - **Pages** – Allows you to specify a custom page range manually.

5. Enable the **Hide Grid** checkbox to remove gridlines from the exported Excel report. This option is available for XLSX, XLS, and XLS_SPUDSOFT formats.

6. Optionally, check the **Single Sheet** box if you want to export all report pages into one consolidated Excel sheet.

7. Click **SUBMIT** to export the report with the selected settings, or click **CANCEL** to close the dialog box without exporting.

---

