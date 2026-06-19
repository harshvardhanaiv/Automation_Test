Email Tab
=========

The **Email** tab is used to configure email notifications and delivery options for scheduled reports. It allows users to automatically send the generated report to selected recipients upon successful execution.

### Objective

To understand how to set up automatic email notifications and delivery options for scheduled reports.

### Prerequisites

Before configuring the Email tab, ensure you have uploaded a valid report design file (.rptdesign) to the **Report Section** under the **Root** folder. For this example, we'll use the **Order details.rptdesign** file. If you haven't already, download the required sample files from [this link](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip).

### Steps to Configure the Email Tab

#### Step 1: Navigate to the Report and Open the Schedule Tab
From the **Hamburger menu**, navigate to **Documents → Reports**. Open the desired report (for example, **Order Details**) and enter the required parameters in the **Parameter Tab**.

![Image](../../../../screenshots/documents/reports/parameter.1d5ac685_9wEnk.webp)

#### Step 2: Access the Email Tab
Navigate sequentially through the following tabs:
*   [**Schedule Tab**](.././schedule)
*   [**Output Tab**](.././output)
Open the **Email Tab** to configure email notifications and delivery options.

![Image](../../../../screenshots/documents/reports/rightnow4.b1b2b27c_Z2ubuwf.webp)

#### Step 3: Enable Email Notifications
Initially, only the **Email** checkbox will be visible. Enable the checkbox to reveal the full set of configuration options.

![Image](../../../../screenshots/documents/reports/email.854b5aa6_26zmWq.webp)

### Available Options (after enabling Email)
The following configuration options are available:

| Field | Description |
| --- | --- |
| **Attach Report** | Enable this option to attach the generated report to the email. |
| **Users / Roles** | Select specific users or roles from the dropdown who should receive the report. |
| **Enter email**\* | Specify one or more recipient email addresses separated by commas. This field is mandatory. |
| **Cc / Bcc** | Optionally enter email addresses to send a copy (Cc) or blind copy (Bcc) of the report. |
| **Email Template**\* | Choose the email template used for sending the report.   |
|  | • **None** – No template is applied.   |
|  | • **Default** – Uses the system’s default email layout.   |
|  | • **Success** – Uses a success message template for completed reports. |
| **Subject** | Specify the subject line for the email notification. |
| **Body** | Add a custom message or instructions to include in the email body. |
| **On Failure Retry** | Define how many times the system should retry sending the email in case of failure (e.g., **First**, **Second**, **Third**, **Fourth**). |
| **After Minutes** | Specify the interval (in minutes) between retries (e.g., **5 mins**, **10 mins**, **15 mins**, **30 mins**, **60 mins**). |

### Note

*   The **Enter email**\* and **Email Template**\* fields are mandatory when enabling email notifications.
*   Ensure that valid email addresses are entered and templates are properly configured in the system.

### Email Tab Example
The following example demonstrates a completed Email tab configuration:

![Image](../../../../screenshots/documents/reports/reports-daily-20-email-tab.png)

In this example, we've selected **Attach Report**, specified multiple recipient email addresses separated by commas in the **Enter email** field, and chosen an email template. We've also entered a subject line and added a custom message to the email body.

![Image](../../../../screenshots/documents/reports/reports-daily-21-email-fields.png)

The Email tab configuration options include To/Subject fields for specifying recipient email addresses and a subject line, respectively.

By following these steps and configuring the available options, you can set up automatic email notifications and delivery options for scheduled reports using the **Email** tab.