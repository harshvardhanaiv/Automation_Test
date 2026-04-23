---
id: schedulereportsbyevent
title: Schedule Reports by Event
sidebar_position: 13
---

The **Schedule Reports by Event** feature allows users to automatically schedule a report to run whenever a specific event is triggered. This functionality supports event-based scheduling, enabling reports to be executed seamlessly as part of workflow automation.
 
This document explains how to schedule a report using event-based scheduling.
 
**Benefits:**
- Enables automatic execution of reports based on specific events.
- Supports workflow automation, reducing manual intervention.
- Ensures timely and accurate report generation.
- Improves efficiency and consistency in reporting processes.

---

**Schedule Reports by Event:** This video explains how to schedule report by event within the application.

<iframe style="height:400px; width:550px;" src="https://www.youtube.com/embed/53_jomXWZMU?si=mpeiDZMb-Wy2l5f4" title="Hide Grid in Report" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---
## <h4>Objective</h4>

To schedule a report using **event-based scheduling**.

---

## <h4>Prerequisites</h4>

1. For this example, the reports used are **Order details.rptdesign** and **Orders Payment.rptdesign**.

2. Download the required sample files from the link [create_event.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Create_event.zip)

3. Upload **Order details.rptdesign** and **Orders Payment.rptdesign** to the **Report** section under the **Root** folder.

4. Refer to this <a href="../../.././common/upload" target="_blank">link</a> for detailed steps on uploading files in the application.

5. Use the same procedure to upload both reports.

---

## <h4>Steps for Event Scheduling</h4>

1. In this example, we will use **Orders Payment.rptdesign**.

2. There are two ways to open a report for scheduling:

   I. By clicking on the desired output format icon (for example: **rptdocument**, **XLSX**, **DOCX**, **PDF**, etc.), as shown below.  

   ![Image](../../../aiv_img/documents/reports/reports.png)  

   These icons allow you to directly schedule the report in the selected format. 

   II. Double-click the desired report name to open it for scheduling.

3. After opening the **Orders Payment** report using either method, the **Parameters** tab will open by default.

4. Parameters Tab

   - Use the <a href=".././parameter" target="_blank">**Parameter Tab**</a> to provide the required input values for generating the report.  
   - Parameters marked with an asterisk **(*)** are mandatory.  
   - After entering all parameters, click the **Schedule** tab.

5. Schedule Tab

   I. In **Schedule Type**, select **Event** from the dropdown list to schedule the report based on an event trigger.

   ![Image](../../../aiv_img/documents/reports/createevent.png)

   :::info
   Click on <span style="display: inline-block; vertical-align: middle;">![i Icon](../../../aiv_img/documents/reports/icon.png)</span> to view additional information about events.

      ```
      Call Event Externally.

      To call an event externally, a REST request must be sent from outside.

      Request Url: https://aiv.test.oneaiv.com:8086/rest/event/trigger
      The URL must include the following headers:
      owner: The owner of the event.
      For example: owner = 'Admin'

      number: The event number.
      For example: number = 123

      deptCode: Your department code.
      For example: deptCode = 'Default'.

      The request type must be a GET request.
      ```
   :::

   II. If the event is not yet created, click the <span style="display: inline-block; vertical-align: middle;">![Create / Manage Events Icon](../../../aiv_img/documents/reports/createeventicon.png)</span> icon next to **Trigger On Events** to open the dialog box, as shown below.

      ![Image](../../../aiv_img/documents/reports/createevent1.png)

   III. **Fill in the Event Details**

      | Field | Description | 
      |--------|--------------|
      | **Event Number** | A unique number to identify the event. |
      | **Event Type** | Enter the type of event in the textbox (e.g., Report, Email). |
      | **Event Description** | A short description of when or why the event is triggered. |

      ![Image](../../../aiv_img/documents/reports/createevent2.png)

   IV. **Configure Email Notification (Optional)**: Enable the **Event Mail** checkbox if you want to send an email notification when the event is triggered. Once enabled, the following fields will appear:

      | Field | Description |
      |--------|-------------|
      | **Users / Roles** | Select users or roles who should receive the report. |
      | **Enter Email*** | Enter one or more email addresses separated by commas. This is a mandatory field. |
      | **Email Template** | Choose an email template.<br><br>**Options:**<br>• **None** – No template<br>• **Default** – System default layout<br>• **Success** – Template for successful executions |
      | **Subject** | Email subject line. |
      | **Body** | Custom email message. |

   V. Click <span style="display: inline-block; vertical-align: middle;">![submitbutton](../../../aiv_img/documents/reports/submitbutton.png)</span> button to create the event. A confirmation message will appear.

   ![Image](../../../aiv_img/documents/reports/eventcreatedsuccesfully.png)

   VI. Now, from the **Trigger On Events** dropdown, select the event you just created.

      ![Image](../../../aiv_img/documents/reports/createevent3.png)

      :::note
      Click on <span style="display: inline-block; vertical-align: middle;">![editbutton](../../../aiv_img/documents/reports/editbutton.png)</span> to edit an existing event, or <span style="display: inline-block; vertical-align: middle;">![deletebutton](../../../aiv_img/documents/reports/deleteevent.png)</span> to delete an event.
      :::

   VII. In **Output Owner**, select the user who will own the generated report output, which will be created at the specified output path after execution.

      :::note
      Make sure the output path folder is shared. Otherwise, the report will appear in the folder only if the user has the same path; if not, the user will need to locate it using the search box at the top-right corner.
      :::

   VIII. In **Share**, enable this checkbox to share the scheduled report with other users or roles. This allows you to choose Users/Roles, search for specific users or roles, set visibility levels (Private, Internal, Public), view all available users or roles, and select who should have access to the scheduled report.

      - **Users / Roles** – Choose whether to share the report with specific **Users** or **Roles**.  
      - **Search User** – Search for specific users or roles
      - **Visibility** – Set the visibility level for the scheduled report:  
         - **Private** – The report remains hidden from recipients, even if the containing folder is shared.  
         - **Internal** – The report is visible only to internal users of the organisation.
         - **Public** – The report is visible to all users without restrictions.
      - **Available Users or Roles** – Displays all users or roles in the system. Select one or more users or roles by checking the boxes beside their names.  
      - **Selected** – Displays the list of users or roles who will have access to this scheduled report. 

6. Go to the **Output** tab, set the **Name** as **Orders_Payment_Report**.

      ![Image](../../../aiv_img/documents/reports/createevent4.png)

7. Click <span style="display: inline-block; vertical-align: middle;">![runbutton](../../../aiv_img/documents/reports/runbutton.png)</span> button. A confirmation message will appear.

      ![Image](../../../aiv_img/documents/reports/eventupdated.png)

8. Go to Hamburger <span style="display: inline-block; vertical-align: middle;">![Create icon](../../../aiv_img/documents/reports/hamburger.png)</span> icon > Request Section > Requests.

   ![Image](../../../aiv_img/documents/reports/requests.png)

9. Navigate to **Waiting for Event**. You will see the report listed there.

      ![Image](../../../aiv_img/documents/reports/waitingforevent.png)

      :::note
      Any report using the event must be deleted manually from the **Waiting for Event** list under the **Request** section.
      :::   

10. You can trigger an event with another report as follows:

      I. Open the report **Order Details.rptdesign**, go to the **Schedule** tab, and select **Once** in the **Frequency** option. 

      ![Image](../../../aiv_img/documents/reports/createevent5.png)

      :::note
      Event scheduling is available only for **Once** and **Recurring** frequencies.
      :::

      II. Go to the **Output** tab and set the **Name** as **Order_Details_Report**. Under **Event on Success**, select the event you created earlier (in this example, 10108). For **Event on Failure**, select **None**.

      ![Image](../../../aiv_img/documents/reports/createevent6.png)

      III. Click <span style="display: inline-block; vertical-align: middle;">![runbutton](../../../aiv_img/documents/reports/runbutton.png)</span> button. A message will appear.

      ![Image](../../../aiv_img/documents/reports/requestadded.png)

11. When the **Order_Details_Report** is executed at the scheduled time, it automatically triggers the **Orders_Payment_Report**. The generated files for both reports will be available in the output path configured during scheduling (in this case, **output/temp**).

## <h4>Related Topics</h4>

- <a href=".././timeschedule" target="_blank">Schedule Reports by Time</a>
