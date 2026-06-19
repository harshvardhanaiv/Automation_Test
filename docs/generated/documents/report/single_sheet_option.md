# Single Sheet Options for AIV Reports
=====================================

AIV allows users to download Excel reports in different formats based on their needs. The **Single Sheet Option** provides flexibility by letting you choose whether the entire report should appear in a single sheet or be divided into multiple sheets.

## Objective

This user guide will help you understand how to use the Single Sheet Option during report downloads in AIV.

## Prerequisites

To follow this example, ensure you have:

*   The **Orders Payment.rptdesign** report.
*   Downloaded the required sample files from [singlesheetoption.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Single_sheet.zip).
*   Uploaded **Orders Payment.rptdesign** to the **Report Section** under the **Root** folder.

Refer to this [link](../../.././common/upload) for detailed steps on uploading files in AIV.

## Export Report with Single Sheet Checked

1.  Go to Hamburger ![Create icon](../../../../screenshots/documents/reports/hamburger-icon.png) icon > Documents > Report.
2.  Double-click the **Orders Payment.rptdesign** report. It will open in a new browser tab and automatically run the report.

    **Note**: The Single Sheet option is available in **BIRT > reptdoc**, **Jasper > PHTML**, and **Pentaho > prptdoc** in AIV.

3.  At the top-left of the report, you will see five options: **Parameter Icon**, **TOC (Table of Content) Icon**, **Export Report Icon**, **Export Data Icon**, and **Print Icon**.
    ![Image](../../../../screenshots/documents/reports/singlesheet-options.png)

4.  Click on the ![Create icon](../../../../screenshots/documents/reports/export-report-icon.png) icon. The export window will appear, as shown below:
    ![Image](../../../../screenshots/documents/reports/singlesheet-export-window.png)

5.  In Export Report dialog box:

    *   Select **XLSX** from the dropdown.
    *   Under Page Range, choose **All Pages**.
    *   Enable the **Single Sheet** option (Checked).
        ![Image](../../../../screenshots/documents/reports/singlesheet-checked-option.png)

6.  As soon as you click ![Create icon](../../../../screenshots/documents/reports/submit-button.png) button, the file will begin downloading in **XLSX** format.
    ![Image](../../../../screenshots/documents/reports/singlesheet-download-started.png)

7.  You will see only one sheet, **Sheet0**, containing all the pages of the report combined into a single Excel sheet.

## Export Report with Single Sheet Unchecked

1.  Follow steps 1 to 4 above, as they are the same as for the checked option.
2.  In Export Report dialog box:

    *   Select **XLSX** from the dropdown.
    *   Under Page Range, choose **All Pages**.
    *   Keep the **Single Sheet** option unchecked.
        ![Image](../../../../screenshots/documents/reports/singlesheet-unchecked-option.png)

3.  As soon as you click ![Create icon](../../../../screenshots/documents/reports/submit-button.png) button, the file will begin downloading in **XLSX** format.
    ![Image](../../../../screenshots/documents/reports/singlesheet-download-started.png)

4.  The report pages will appear in separate sheets within Excel. For example, if the **Orders Payment.rptdesign** report has 6 pages, the file will contain sheets named **Sheet0** to **Sheet5**. You can navigate through these sheets using the arrows or the horizontal dots at the bottom-left of the Excel window.

This concludes the user guide for Single Sheet Options in AIV Reports. If you have any further questions or need assistance, please don't hesitate to reach out.