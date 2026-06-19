**Hide Report Options**
======================

The **Hide Report Options** feature in AIV allows users to restrict or hide specific report options when sharing a report with another user. This ensures controlled access during report execution for shared reports.

### Use Case
-------------

Consider a scenario where a user wants to share a report with a **Demo user**, but wishes to control which report options (such as Export or Print) are visible when the Demo user executes that report.

### Objectives
------------

Hide or restrict specific **report execution options** for other users.

### Prerequisites
-----------------

1.  For this example, we’ll use **Customers details.rptdesign**.
    Upload the required sample files from the link [hidereportoption.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Hide_report_option.zip)
2.  Download and upload the **Customers details.rptdesign** to the **Report Section** of the application.

### Steps to Hide Report Options
--------------------------------

#### Step 1: Select the Report
-----------------------------

*   Log in to your AIV account.
*   Navigate to the **Report Section** from the **Hamburger menu** by selecting **Documents -> Reports**
    ![Image](../../../../screenshots/documents/reports/reports-daily-08-context-menu.png)
*   Click on the report you want to share while controlling which options are available during its execution.

#### Step 2: Access Report Context Menu
------------------------------------

Right-click on the **Customer Details** report and select **Hide Options** from the context menu.
    ![Image](../../../../screenshots/documents/reports/hideoptions.58b55a59_IVDx0.webp)

#### Step 3: Hide Options Dialog Box
----------------------------------

The **Hide Options** dialog box will appear.
    ![Image](../../../../screenshots/documents/reports/hideoptions1.01290f46_2j7g5e.webp)
In this window, you can choose to share the report with specific **Users** or **Roles**. Use the radio buttons to toggle between Users and Roles.

#### Step 4: Select User
----------------------

From the **Available Users** list, select the **Demo user**, or type “Demo” in the **Search User** box to find them quickly.
    ![Image](../../../../screenshots/documents/reports/hideoptions2.cd59d2f6_Z1WnAoy.webp)

#### Step 5: Confirm Selection
---------------------------

Click the ![Hide Icon](../../../../screenshots/documents/reports/hidesettings.d6dbe88c_mGxAD.webp) **Hide** icon to confirm your selection and apply the settings.

#### Step 6: Hide Report Options in Settings Dialog Box
---------------------------------------------------

The **Settings** dialog box will appear. In the **Hide Options in Report Run** section, select the options you want to hide from the user (e.g., _Demo user_) during report execution.
    ![Image](../../../../screenshots/documents/reports/hideoptions3.4ed8821a_Z17R5Bg.webp)
Click **SUBMIT** to apply your changes.

#### Step 7: Share Report
----------------------

Click **SUBMIT** again. A confirmation popup will appear, indicating that the report was shared successfully.
    ![Image](../../../../screenshots/documents/reports/sharedsuccesfully.d1ab3fa9_Z1braz5.webp)

### Testing and Verification
---------------------------

Log out from the application, and then log in again using the **Demo user** credentials.

*   After logging in, navigate to the **Report Section** from the **Hamburger menu** by selecting **Documents -> Reports**
    ![Image](../../../../screenshots/documents/reports/demouser.9cb30dd3_Zj51Yx.webp)
*   The **Customer Details** report will appear in the **Report List** view.
    ![Image](../../../../screenshots/documents/reports/hideoptions4.b5a1c345_29HyXy.webp)
*   Double-click the **Customers details** report to open the **Schedule** window.

### Execution of Report
-------------------------

To execute a report immediately, click on the ![Run icon](../../../../screenshots/documents/reports/runbutton.350e82aa_uOOqc.webp) button. The report will execute and open in a new browser tab.
    Note: [Click here](.././timeschedule) to learn more about scheduling reports.

### Verification
--------------

After executing the report, verify that the Demo user can view only the three visible options while running the report.
    ![Image](../../../../screenshots/documents/reports/hideoptions5.6fa1e80b_1cRkFw.webp)

*   The Demo user will now see three report options at the top-left of the report viewer window: Export, Print, and Hide Options
*   In the example above, only three options are visible because the first user chose to hide two of them.