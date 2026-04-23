---
id: once
title: Schedule Reports by Time - Once
sidebar_position: 11
---

The **Schedule Reports by Time – Once** feature allows you to execute a report **at a specific future date and time only once**.  

This document explains how to configure and execute reports using the **Once** scheduling option.

:::note
**Once** scheduling lets you define a single date and time for report execution.  
After it runs at the scheduled time, it will **not repeat automatically**.
:::

---

**Once :** This video explains Schedule Reports by Time - Once within the application.

<iframe style="height:400px; width:550px;" src="https://www.youtube.com/embed/fbHhEPKWQws?si=iPdj66IggP6IFVnU" title="Reports" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---

## <h4> Objective </h4>

To schedule and execute a report **once** at a predefined future time using the **Once** scheduling option.

---

## <h4> Prerequisites </h4>

1. For this example, the report used is **Order details.rptdesign**.

2. Download the required sample files from the link [report.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip)

3. Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.

4. Refer to this <a href="../../.././common/upload" target="_blank">link</a> for detailed steps on uploading files in the application.


---

## <h4> Steps to Schedule a Report using the Once Option </h4>

1. We will be using **Order details Report** in this example.

2. There are two ways to open a report for scheduling:   

   I. By clicking on the desired output format option (for example: **rptdocument**, **XLSX**, **DOCX**, **PDF**, etc.) as shown in the image below.  

   ![Image](../../../aiv_img/documents/reports/rightnow.png)

   These icons allow you to directly schedule the report in the selected format.   

   II. Double-click the desired report name to open it for scheduling.  

3. After opening the **Order Details Report**, the **Parameter Tab** will open by default.

---

4. **Parameter Tab**

    - Use the <a href=".././parameter" target="_blank">**Parameter Tab**</a> to provide the required input values for generating the report.  
    - Parameters marked with an asterisk **(*)** are mandatory.  
    - After entering all parameters, click on the **Schedule Tab**.

---

5. **Schedule Tab**

   In the **Schedule Tab**, you define **when** the report should execute.

   ### <h5>Steps to Configure the Schedule Tab:</h5>

   I. **Schedule Type** – Select **Time** from the dropdown list to schedule the report based on a time condition.  

   II. **Frequency** – Choose **Once** from the available options (**Right Now**, **Once**, **Recurring**).  
   - This option allows you to define an exact **date and time** for one-time report execution.  
   - After the report executes, it will **not run again** unless re-scheduled manually.

   III. **Start Time*** – Select the **date and time** at which the report should execute.  
   - The system displays a confirmation message indicating when the execution will start.  
   - The **timezone** (for example: *Asia/Calcutta*) is automatically displayed below the field.

   IV. **On Failure Retry** – Define the retry mechanism if the report fails to execute.  
   - **Retry Count** – Number of times the system should retry in case of failure (e.g., 1, 2, or 3 times).  
   - **Schedule After Every** – Time interval between retries (e.g., 5 mins, 10 mins, etc.).  
   - This ensures automatic retrying in case of temporary system or network errors.

   V. **Output Owner** –  Displays or allows you to select the user who will own the generated report (for example: Admin).  
   - The report will appear under this user’s scheduled outputs in the system.

        ![Image](../../../aiv_img/documents/reports/once.png)

   VI. **Share** – Enable this checkbox if you want to share the scheduled report with other users or roles.  
   Once checked, additional configuration options appear as shown below.  

   - **Users / Roles** – Select whether you want to share the report with specific **Users** or **Roles**.  
   - **Search User** – Use this field to quickly find a specific user by name.  
   - **Visibility** – Set the visibility level for the scheduled report:  
      - **Private** – The report remains hidden from recipients, even if the containing folder is shared.
      - **Internal** – The report is visible only to internal user of the organisation. 
      - **Public** – The report is visible to all users without restrictions.
   - **Available Users** – Displays all users in the system.  
      - You can select one or more users by checking the boxes beside their names.
   - **Available Roles** – Displays all roles in the system.  
      - You can select one or more roles by checking the boxes beside their names.   
   - **Selected** – Displays the list of users or roles who will have access to this scheduled report.  

      ![Image](../../../aiv_img/documents/reports/once1.png)

   After configuring all the above options, click on the **Output Tab**.

---
6. **Output Tab**

    - Use the <a href=".././output" target="_blank">**Output Tab**</a> to define the report’s **output format**, **file name**, and **storage location**.  
    - For example, you can generate the report in **PDF**, **XLSX**, or **DOCX** format.

    After defining output settings, click on the **Email Tab** if you want to send the report via email after execution.
---

7. **Email Tab**

    - Use the <a href=".././email" target="_blank">**Email Tab**</a> to configure **recipients**, **email subject**, and **attachments** for the automatic delivery of the generated report.

---

8. **Final Execution**

   After configuring all the required tabs (**Parameter**, **Schedule**, **Output**, and **Email**), you are ready to execute or save the scheduled report.

   At the bottom of the scheduling window, the following buttons are available:

   | **Button** | **Description** |
   |-------------|-----------------|
   | **RUN** | Executes the report as per your configured schedule (at the specified date and time). |
   | **SAVE AS QUICKRUN** | Saves your current configuration for quick future runs without re-entering parameters. |
   | **CANCEL** | Cancels the scheduling process and closes the window without saving. |

   ![Image](../../../aiv_img/documents/reports/rightnow5.png)

   - When you click **RUN**, the report will be queued and executed **at the Start Time** you selected earlier.  
   - Once the report runs, you can check the execution status in the **Request** section of the application.

---

9. **Monitor Execution Status**

   - The **Request** section shows all reports that are **Completed**, **Running**, **Failed**, or **Scheduled**.  
   - You can view detailed status, progress, and logs.  
   - If the report fails, the **error message** or reason for failure will be displayed for troubleshooting.  

---

## <h4> Related Topics </h4>

- <a href=".././rightnow" target="_blank">Schedule Reports by Time – Right Now</a> <br>
- <a href=".././recurring" target="_blank">Schedule Reports by Time – Recurring</a> <br>

