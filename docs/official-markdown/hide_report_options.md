Hide Report Options
===================

The **Hide Report Options** feature allows users to restrict or hide specific report options when sharing a report with another user. This ensures controlled access during report execution for shared reports.

* * *

#### Use Case

Consider a scenario where a user wants to share a report with a **Demo user**, but wishes to control which report options (such as Export or Print) are visible when the Demo user executes that report.

* * *

#### Objectives

Hide or restrict specific **report execution options** for other users.

* * *

#### Prerequisites

1.  For this example, we’ll use **Customers details.rptdesign**.
    
2.  Download the required sample files from the link [hidereportoption.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Hide_report_option.zip)
    
3.  Upload the **Customers details.rptdesign** to the **Report Section** of the application. .
    
4.  For detailed steps on uploading reports, refer to this [link](../../.././common/upload).
    

* * *

Note

It is necessary to share the report with a specific user or role before applying the **Hide Option** for that user/role.

#### Steps to Hide Report Options

1.  Click on the report you want to share while controlling which options are available during its execution.
    
    Tip
    
    The **Hide Report Options** feature is supported for reports created in:
    
    *   **BIRT (.rptdoc)**
    *   **Jasper (.phtml)**
    *   **Pentaho (.prptdoc)** within AIV.
    
2.  Right-click the **Customer Details** report and select **Hide Options** from the context menu.
    
    ![Image](/_astro/hideoptions.58b55a59_IVDx0.webp)
    
3.  The **Hide Options** dialog box will appear.
    
    ![Image](/_astro/hideoptions1.01290f46_2j7g5e.webp)
    
4.  In this window, you can choose to share the report with specific **Users** or **Roles**. Use the radio buttons to toggle between Users and Roles.
    
5.  From the **Available Users** list, select the **Demo user**, or type “Demo” in the **Search User** box to find them quickly.
    
    ![Image](/_astro/hideoptions2.cd59d2f6_Z1WnAoy.webp)
    
6.  Click the ![Hide Icon](/_astro/hidesettings.d6dbe88c_mGxAD.webp) **Hide** icon to confirm your selection and apply the settings.
    
7.  The **Settings** dialog box will appear. In the **Hide Options in Report Run** section, select the options you want to hide from the user (e.g., _Demo user_) during report execution. Click **SUBMIT** to apply your changes.
    
    ![Image](/_astro/hideoptions3.4ed8821a_Z17R5Bg.webp)
    
8.  Click **SUBMIT** again. A confirmation popup will appear, indicating that the report was **shared successfully**.
    
    ![Image](/_astro/sharedsuccesfully.d1ab3fa9_Z1braz5.webp)
    
9.  Log out from the application, and then log in again using the **Demo user** credentials.
    
10.  After logging in, navigate to the **Report Section** from the **Hamburger menu** by selecting **Documents -> Reports**.
     
     ![Image](/_astro/demouser.9cb30dd3_Zj51Yx.webp)
     
11.  The **Customer Details** report will appear in the **Report List** view.
     
     ![Image](/_astro/hideoptions4.b5a1c345_29HyXy.webp)
     
12.  Double-click the **Customers details** report to open the **Schedule** window.
     

Note

[Click here](.././timeschedule) to learn more about scheduling reports.

13.  To execute a report immediately, click on the ![Run icon](/_astro/runbutton.350e82aa_uOOqc.webp) button. The report will execute and open in a new browser tab.
     
14.  The Demo user will now see three report options at the top-left of the report viewer window:
     

![Image](/_astro/hideoptions5.6fa1e80b_1cRkFw.webp)

15.  In the example above, only three options are visible because the first user chose to hide two of them. In the example above, only three options are visible because the first user choose to hide the **Hide Export Data Icon** and **Hide Print Icon**.
     
16.  As a result, the Demo user can view only the three visible options while running the report.
     

* * *

[Previous  
Hide Grid in Report Export](/aiv/documents/report/hide_grid_reportexport/) [Next  
Single Sheet Option](/aiv/documents/report/single_sheet_option/)