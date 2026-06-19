# Output Tab
==========

The **Output Tab** allows users to define how and where a report output should be generated and stored.
You can specify the file name, output format, storage path, and automation options such as webhook or event triggers.

## Objective

To understand how to configure the output format, storage location, and additional delivery options for a scheduled report.

## Prerequisites

1.  For this example, the report used is **Order details.rptdesign**.
2.  Download the required sample files from the link [output.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip)
3.  Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.
4.  Refer to this [link](../../.././common/upload) for detailed steps on uploading files in the application.

## Steps to Configure the Output Tab

### Step 1: Accessing the Output Tab
To access the **Output Tab**, navigate to the report you want to configure and click on the "Schedule" tab. Then, scroll down to the bottom of the page and click on the "Output" tab.

![Image](../../../../screenshots/documents/reports/reports-daily-17-output-tab.png)

### Step 2: Configuring Output Settings
In this tab, you can configure the following settings:

#### **Field**            **Description**
Name          The name of the output file. By default, it displays the report name (e.g., _Order Details_).
Suffix        Allows you to add a suffix to the output file name for easier identification.
Format        Select the desired output format from the dropdown list.
Available formats:
• `rptdocument`
• `aiv-xlsx`
• `docx`
• `html`
• `pdf`
• `pptx`
• `xls`
• `xls_spudsoft`
• `xlsx`
Path          Specify the folder path where the generated report will be saved. You can browse or manually enter the output location (e.g., _/Output/Temp/_).
Webhook       Enable this option to send the output to a predefined webhook URL for automation or integration.
Delivery Path If enabled, allows the report output to be delivered to a specific destination path on the server system. The path is located under the repository/delivery folder. After the execution is complete, the output file is placed in this server location so that it can be accessed by other applications for further processing.
Replace Default every time you run the report, it replaces the last working version instead of creating a new one.
Event on Success/Event on Fail Select an event to be triggered automatically when the report completes successfully or fails to execute.

### Step 3: Verifying Output Settings
After configuring the output settings, click on the "Run" button to verify that the changes have been applied correctly. The output file will be generated and stored in the specified location.

![Image](../../../../screenshots/documents/reports/reports-daily-24-requests.png)

### Step 4: Next Steps
After configuring the output settings, proceed with the next tab:

*   [**Email Tab**](.././email)