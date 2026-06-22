---
id: rightnow
title: Schedule Reports by Time - Right Now
sidebar_position: 10
---

The **Schedule Reports by Time – Right Now** feature allows you to generate a report output **immediately** after scheduling.  

This document explains how to configure and execute reports using the **Right Now** scheduling option.

:::note
**Right Now** scheduling follows a uniform process throughout the application.  
You can apply this procedure anywhere scheduling is supported.
:::

---

**Right Now :** This video explains Schedule Reports by Time - Right Now within the application.

<iframe style="height:400px; width:550px;" src="https://www.youtube.com/embed/EOyHqZi3X_o?si=OxnIhPL2GgRwFsC4" title="Reports" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---

## <h4> Objective </h4>

To schedule and execute a report instantly using the **Right Now** scheduling option.

---

## <h4> Prerequisites </h4>

1. For this example, the report used is **Order details.rptdesign**.

2. Download the required sample files from the link [report.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip)

3. Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.

4. Refer to this <a href="../../.././common/upload" target="_blank">link</a> for detailed steps on uploading files in the application.

---

## <h4> Steps to Schedule a Report using the Right Now Option </h4>

1. We will be using **Order details Report** in this example.

2. There are two ways to open a report for scheduling:   

   I. By clicking on the desired output format option (for example: **rptdocument**, **XLSX**, **DOCX**, **PDF**, etc.) as shown in the image below.  
   
   ![Image](../../../aiv_img/documents/reports/rightnow.png) 

   These icons allow you to directly schedule the report in the selected format.  

   II. Double-click the desired report name to open it for scheduling.  

3. After opening the **Order details Report** using either of the above methods, the **Parameters** tab will open by default.

---

4. **Parameter Tab**

    - Use the <a href=".././parameter" target="_blank">**Parameter Tab**</a> to provide the required input values for generating the report.  
    - Parameters marked with an asterisk **(*)** are mandatory.  
    - After entering all parameters, click on the **Schedule Tab**.

---

5. **Schedule Tab**

    I. **Schedule Type** – Select **Time** from the dropdown list to schedule the report based on time.  

    II. **Frequency** – Choose **Right Now** from the available options (**Right Now**, **Once**, **Recurring**).  
    - When you select **Right Now**, the system prepares the report for **immediate execution**.  
    - No additional date or time selection is required.

    III. **On Failure Retry** – Define retry conditions in case the report fails to execute.  
    - **Retry Count** – Number of times the system should retry (e.g., 1, 2, or 3).  
    - **Schedule After Every** – Time interval between retries (e.g., 5 mins, 10 mins).  

        ![Image](../../../aiv_img/documents/reports/rightnow2.png)

    This ensures that even if a temporary issue occurs, the system automatically retries the execution.

---

6. **Output Tab**

    - Use the <a href=".././output" target="_blank">**Output Tab**</a> to define the report’s **output format**, **file name**, and **storage location**.  
    - For example, you can generate the report in **PDF**, **XLSX**, or **DOCX** format.

---

7. **Email Tab**

    - Use the <a href=".././email" target="_blank">**Email Tab**</a> to configure **recipients**, **email subject**, and **attachments** for the automatic delivery of the generated report.

---

8. **Final Execution**

    - After configuring all required tabs (**Parameter**, **Schedule**, **Output**, and **Email**), you are ready to execute the report.

    - At the bottom of the scheduling window, the following buttons are available:

        | **Button** | **Description** |
        |-------------|-----------------|
        | **RUN** | Executes the report immediately according to your configuration. |
        | **SAVE AS QUICKRUN** | Saves the current report setup, including selected parameters, for quick and easy future execution. To know more, see <a href="../../../documents/quick_run/introduction" target="_blank">Quick Run</a> <br>|
        | **CANCEL** | Cancels the scheduling process and closes the window. |

        ![Image](../../../aiv_img/documents/reports/rightnow5.png)

9. Click **RUN** to execute the report instantly. Once completed, the output will either open in a new tab or display a download prompt, depending on the selected format (e.g., **PDF**, **XLSX**, or **DOCX**).

    ![Image](../../../aiv_img/documents/reports/rightnow6.png)

10. You can monitor the report execution status in the **Request** section of the application.  

    - This section displays reports that are **Completed**, **Running**, **Failed**, or **Scheduled** for future execution.  
    - In case of failure, the error reason will be displayed for troubleshooting.

---

## <h4> Related Topics </h4>

- <a href=".././once" target="_blank">Schedule Reports by Time – Once</a> <br>
- <a href=".././recurring" target="_blank">Schedule Reports by Time – Recurring</a> <br>


