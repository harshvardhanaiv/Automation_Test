Single Sheet Options
====================

AIV allows users to download Excel reports in different formats based on their needs. The **Single Sheet Option** provides flexibility by letting you choose whether the entire report should appear in a single sheet or be divided into multiple sheets. This feature is particularly useful when handling large datasets or when you want a consolidated view for analysis.

#### Objective

Understand how to use the Single Sheet Option during report downloads.

* * *

#### Prerequisites

1.  For this example, the report used is **Orders Payment.rptdesign**.
    
2.  Download the required sample files from the link [singlesheetoption.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Single_sheet.zip)
    
3.  Upload **Orders Payment.rptdesign** to the **Report Section** under the **Root** folder.
    
4.  Refer to this [link](../../.././common/upload) for detailed steps on uploading files in the application.
    

* * *

#### Export Report with Single Sheet Checked

1.  Go to Hamburger ![Create icon](/_astro/hamburger.8b1c425a_1nYq8T.webp) icon > Documents > Report.
    
2.  Double-click the **Orders Payment.rptdesign** report. It will open in a new browser tab and automatically run the report.
    

Tip

The Single Sheet option is available in **BIRT > reptdoc**, **Jasper > PHTML**, and **Pentaho > prptdoc** in AIV.

3.  At the top-left of the report, you will see five options: **Parameter Icon**, **TOC (Table of Content) Icon**, **Export Report Icon**, **Export Data Icon**, and **Print Icon**.
    
    ![Image](/_astro/singlesheet.7c0c027e_axxUB.webp)
    
4.  Click on the ![Create icon](/_astro/exportreporticon.e22ae709_6RxUi.webp) icon. The export window will appear, as shown below:
    
    ![Image](/_astro/singlesheet1.73ef7dce_3DrID.webp)
    
5.  In Export Report dialog box:
    
    *   Select **XLSX** from the dropdown
        
    *   Under Page Range, choose **All Pages**.
        
    *   Enable the **Single Sheet** option (Checked).
        
        ![Image](/_astro/singlesheet2.01084e73_2cLxBP.webp)
        
6.  As soon as you click ![Create icon](/_astro/submitbutton.e57c795d_ZasYIO.webp) button, the file will begin downloading in **XLSX** format.
    
    ![Image](/_astro/singlesheet3.559c90c8_ZkOnwV.webp)
    
7.  You will see only one sheet, **Sheet0**, containing all the pages of the report combined into a single Excel sheet.
    

#### Export Report with Single Sheet Unchecked

1.  Follow steps 1 to 4 above, as they are the same as for the checked option.
    
2.  In Export Report dialog box:
    
    *   Select **XLSX** from the dropdown
        
    *   Under Page Range, choose **All Pages**.
        
    *   Keep the **Single Sheet** option unchecked.
        
        ![Image](/_astro/singlesheet4.ce327343_Z18yFw7.webp)
        
3.  As soon as you click ![Create icon](/_astro/submitbutton.e57c795d_ZasYIO.webp) button, the file will begin downloading in **XLSX** format.
    
    ![Image](/_astro/singlesheet5.0393e6bf_ZBoMup.webp)
    
4.  The report pages will appear in separate sheets within Excel. For example, if the **Orders Payment.rptdesign** report has 6 pages, the file will contain sheets named **Sheet0** to **Sheet5**. You can navigate through these sheets using the arrows or the horizontal dots at the bottom-left of the Excel window.
    

[Previous  
Hide Report Options](/aiv/documents/report/hide_report_options/) [Next  
Introduction](/aiv/documents/merge_report/introduction/)