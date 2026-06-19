Parameter Tab
=============

The **Parameter Tab** is a crucial part of making reports dynamic and interactive in AIV (Analytics Intelligence Visualization). It allows users to filter or customize report output based on specific input values, enhancing the overall reporting experience.

Objective
----------

To understand how to enter parameter values before scheduling or running a report using the Parameter Tab.

Prerequisites
------------

Before configuring the Parameter Tab, ensure you have:

*   The **Order details.rptdesign** report uploaded to the **Report Section** under the **Root** folder.
*   Downloaded and extracted the required sample files from [parameter.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip).
*   Refer to the [upload documentation](../../.././common/upload) for detailed steps on uploading files in the application.

Steps to Configure the Parameter Tab
------------------------------------

### Accessing the Parameter Tab

1.  Navigate to the **Hamburger menu** and select **Documents -> Reports**.
    ![Image](../../../../screenshots/documents/reports/reports-daily-10-scheduler.png)
2.  Choose any report that uses parameters, such as **Order details report**.

### Specifying Input Values in the Parameter Tab

1.  In the **Parameter Tab**, enter the required input values to generate the report. Parameters marked with an asterisk \* are mandatory and must be filled before proceeding.
    *   For example, to view the details of a specific order:
        ***OrderNumber***: Unique identifier for the order (e.g., 10100).
        ![Image](../../../../screenshots/documents/reports/reports-daily-12-param-tab.png)
2.  Ensure all mandatory fields are filled before proceeding.

Note
----

Reports with parameters require users to provide input values before execution. It is essential to fill all mandatory fields marked with an asterisk \* before moving forward.

Next Steps
------------

After entering all required parameters, proceed to the next tab:

*   [**Schedule Tab**](.././schedule)
*   [**Output Tab**](.././output)
*   [**Email Tab**](.././email)