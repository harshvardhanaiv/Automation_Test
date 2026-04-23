---
id: singlesheetoption
title: Single Sheet Options
sidebar_position: 16
---

AIV allows users to download Excel reports in different formats based on their needs. The **Single Sheet Option** provides flexibility by letting you choose whether the entire report should appear in a single sheet or be divided into multiple sheets. This feature is particularly useful when handling large datasets or when you want a consolidated view for analysis.

## <h4> Objective </h4> 

Understand how to use the Single Sheet Option during report downloads.

---

## <h4> Prerequisites </h4>

1. For this example, the report used is **Orders Payment.rptdesign**.

2. Download the required sample files from the link [singlesheetoption.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Single_sheet.zip)

3. Upload **Orders Payment.rptdesign** to the **Report Section** under the **Root** folder.

4. Refer to this <a href="../../.././common/upload" target="_blank">link</a> for detailed steps on uploading files in the application.

---

## <h4> Export Report with Single Sheet Checked </h4> 

1. Go to Hamburger <span style="display: inline-block; vertical-align: middle;">![Create icon](../../../aiv_img/documents/reports/hamburger.png)</span> icon > Documents > Report.  

2. Double-click the **Orders Payment.rptdesign** report. It will open in a new browser tab and automatically run the report.

:::tip
The Single Sheet option is available in **BIRT > reptdoc**, **Jasper > PHTML**, and **Pentaho > prptdoc** in AIV.
:::

3. At the top-left of the report, you will see five options: **Parameter Icon**, **TOC (Table of Content) Icon**, **Export Report Icon**, **Export Data Icon**, and **Print Icon**.

    ![Image](../../../aiv_img/documents/reports/singlesheet.png)

4. Click on the <span style="display: inline-block; vertical-align: middle;">![Create icon](../../../aiv_img/documents/reports/exportreporticon.png)</span> icon. The export window will appear, as shown below:

    ![Image](../../../aiv_img/documents/reports/singlesheet1.png)

5. In Export Report dialog box: 
    - Select **XLSX** from the dropdown
    - Under Page Range, choose **All Pages**.
    - Enable the **Single Sheet** option (Checked).

        ![Image](../../../aiv_img/documents/reports/singlesheet2.png)

6. As soon as you click <span style="display: inline-block; vertical-align: middle;">![Create icon](../../../aiv_img/documents/reports/submitbutton.png)</span> button, the file will begin downloading in **XLSX** format.

    ![Image](../../../aiv_img/documents/reports/singlesheet3.png)

7. You will see only one sheet, **Sheet0**, containing all the pages of the report combined into a single Excel sheet.

## <h4> Export Report with Single Sheet Unchecked </h4>   
    
1. Follow steps 1 to 4 above, as they are the same as for the checked option.

2. In Export Report dialog box: 
    - Select **XLSX** from the dropdown
    - Under Page Range, choose **All Pages**.
    - Keep the **Single Sheet** option unchecked.

        ![Image](../../../aiv_img/documents/reports/singlesheet4.png)

3. As soon as you click <span style="display: inline-block; vertical-align: middle;">![Create icon](../../../aiv_img/documents/reports/submitbutton.png)</span> button, the file will begin downloading in **XLSX** format.

    ![Image](../../../aiv_img/documents/reports/singlesheet5.png)

5. The report pages will appear in separate sheets within Excel. For example, if the **Orders Payment.rptdesign** report has 6 pages, the file will contain sheets named **Sheet0** to **Sheet5**. You can navigate through these sheets using the arrows or the horizontal dots at the bottom-left of the Excel window.
