---
id: schedule
title: Introduction
sidebar_position: 8
---

The **Schedule Tab** is used to define when and how a report should run. It automates report generation by allowing users to set execution times, retry options, and scheduling types.  

By default, the **Schedule Type** is set to **Time**, and users can select different **Frequency** options to determine when the report will execute.

## <h4> Objective </h4>

To understand how to configure the **Schedule Tab** to define when and how a report should execute.

---

## <h4> Prerequisites </h4>

1. For this example, the report used is **Order details.rptdesign**.

2. Download the required sample files from the link [report.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip)

3. Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.

4. Refer to this <a href="../../.././common/upload" target="_blank">link</a> for detailed steps on uploading files in the application.

---

## <h4> Steps to Configure the Schedule Tab </h4>

1. From the **Hamburger menu**, navigate to **Documents -> Reports**.

   ![Image](../../../aiv_img/documents/reports/parameter.png)

2. Open the desired report (for example, **Order details**) by double-clicking it.  
   When you open the report, the first screen displayed will be the <a href=".././parameter" target="_blank">**Parameter Tab**</a>.

3. After entering the required parameters, click on the **Schedule Tab** to define when and how the report should execute.

   ![Image](../../../aiv_img/documents/reports/rightnow2.png)

4. In the **Schedule Tab**, configure the following options as per your scheduling needs:

   | **Field** | **Description** |
   |------------|-----------------|
   | **Schedule Type** | Select the scheduling mode. Options include:<br>• <a href=".././timeschedule" target="_blank">**Time**</a> – Schedule the report based on a defined time (**Right Now**, **Once**, or **Recurring**).<br>• <a href=".././eventschedule" target="_blank">**Event**</a> – Runs the report when a predefined event occurs. |
   | **Frequency** | Defines when the report should run:<br>• <a href=".././rightnow" target="_blank">**Right Now**</a>   – Executes the report immediately.<br>• <a href=".././once" target="_blank">**Once**</a> – Runs the report a single time at a scheduled date and time.<br>• <a href=".././recurring" target="_blank">**Recurring**</a> – Executes the report repeatedly at a defined interval (e.g., hourly, daily, weekly). |
   | **On Failure Retry** | Specifies how many times the system should retry execution if the report fails. Options: **1**, **2**, or **3** retries. |
   | **Schedule After Every** | Determines the retry interval in case of a failure. Options include **5 mins**, **10 mins**, **15 mins**, **30 mins**, or **60 mins**. |

5. Once all fields are configured, proceed to the <a href=".././output" target="_blank">**Output Tab**</a> to define how the generated report will be stored or delivered.

---

:::note
If **Schedule Type = Time**, ensure you select the correct **Frequency** (Right Now, Once, or Recurring).  
If **Schedule Type = Event**, define the event in advance to trigger automatic report execution.
:::

---

## <h4> Next Steps </h4>

After configuring the schedule, proceed with the next tabs to complete the report setup:
   
- <a href=".././output" target="_blank">**Output Tab**</a>
- <a href=".././email" target="_blank">**Email Tab**</a>
