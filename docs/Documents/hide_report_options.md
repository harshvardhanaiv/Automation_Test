---
id: hidereportoptions
title: Hide Report Options
sidebar_position: 15
---

The **Hide Report Options** feature allows users to restrict or hide specific report options when sharing a report with another user. This ensures controlled access during report execution for shared reports.

---

## <h4>Use Case</h4>

Consider a scenario where a user wants to share a report with a **Demo user**, but wishes to control which report options (such as Export or Print) are visible when the Demo user executes that report.

---

## <h4>Objectives</h4>

Hide or restrict specific **report execution options** for other users.

---

## <h4>Prerequisites</h4>

1. For this example, we’ll use **Customers details.rptdesign**.

2. Download the required sample files from the link [hidereportoption.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Hide_report_option.zip) 

3. Upload the **Customers details.rptdesign** to the **Report Section** of the application.  .

4. For detailed steps on uploading reports, refer to this <a href="../../.././common/upload" target="_blank">link</a>.

---

:::note
It is necessary to share the report with a specific user or role before applying the **Hide Option** for that user/role.
:::

## <h4>Steps to Hide Report Options</h4>

1. Click on the report you want to share while controlling which options are available during its execution. 

   :::tip
   The **Hide Report Options** feature is supported for reports created in:
   - **BIRT (.rptdoc)**
   - **Jasper (.phtml)**
   - **Pentaho (.prptdoc)**
   within AIV.
   :::                                               

2. Right-click the **Customer Details** report and select **Hide Options** from the context menu.

   ![Image](../../../aiv_img/documents/reports/hideoptions.png)

3. The **Hide Options** dialog box will appear.

   ![Image](../../../aiv_img/documents/reports/hideoptions1.png)

4. In this window, you can choose to share the report with specific **Users** or **Roles**. Use the radio buttons to toggle between Users and Roles.

5. From the **Available Users** list, select the **Demo user**, or type “Demo” in the **Search User** box to find them quickly.

   ![Image](../../../aiv_img/documents/reports/hideoptions2.png)

6. Click the <span style="display: inline-block; vertical-align: middle;">![Hide Icon](../../../aiv_img/documents/reports/hidesettings.png)</span> **Hide** icon to confirm your selection and apply the settings.

7. The **Settings** dialog box will appear. In the **Hide Options in Report Run** section, select the options you want to hide from the user (e.g., *Demo user*) during report execution. Click **SUBMIT** to apply your changes. 

   ![Image](../../../aiv_img/documents/reports/hideoptions3.png)

8. Click **SUBMIT** again. A confirmation popup will appear, indicating that the report was **shared successfully**.

   ![Image](../../../aiv_img/documents/reports/sharedsuccesfully.png)

9. Log out from the application, and then log in again using the **Demo user** credentials.

10. After logging in, navigate to the **Report Section** from the **Hamburger menu** by selecting **Documents -> Reports**.

    ![Image](../../../aiv_img/documents/reports/demouser.png)

11. The **Customer Details** report will appear in the **Report List** view.

    ![Image](../../../aiv_img/documents/reports/hideoptions4.png)

12. Double-click the **Customers details** report to open the **Schedule** window.

   :::note
   <a href=".././timeschedule" target="_blank">Click here</a> to learn more about scheduling reports.
   :::

13. To execute a report immediately, click on the <span style="display:inline-block; vertical-align:middle;">![Run icon](../../../aiv_img/documents/reports/runbutton.png)</span> button. The report will execute and open in a new browser tab.

14. The Demo user will now see three report options at the top-left of the report viewer window:

   ![Image](../../../aiv_img/documents/reports/hideoptions5.png)

15. In the example above, only three options are visible because the first user chose to hide two of them.
In the example above, only three options are visible because the first user choose to hide the **Hide Export Data Icon** and **Hide Print Icon**.

21. As a result, the Demo user can view only the three visible options while running the report.

---
