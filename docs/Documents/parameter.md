---
id: parameter
title: Parameter Tab
sidebar_position: 7
---

The **Parameter Tab** allows users to make reports dynamic and interactive by filtering or customizing the report output based on specific input values.  
For example, you can generate a report for a particular **Order Number**, **Date Range**, or **Region** without changing the report design.

---

## <h4> Objective </h4>

To understand how to enter parameter values before scheduling or running a report.

---

## <h4> Prerequisites </h4>

1. For this example, the report used is **Order details.rptdesign**.

2. Download the required sample files from the link [parameter.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip)

3. Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.

4. Refer to this <a href="../../.././common/upload" target="_blank">link</a> for detailed steps on uploading files in the application.

---

## <h4> Steps to Configure the Parameter Tab </h4>

1. From the **Hamburger menu**, navigate to **Documents -> Reports**.

   ![Image](../../../aiv_img/documents/reports/parameter.png)
 
2. Select any report that uses parameters. For this example, we are using **Order details report**.

3. In the **Parameter Tab**, specify the input values required to generate the report.  
   Parameters marked with an asterisk **(*)** are **mandatory** and must be filled before proceeding.

   **Example:**

   | **Parameter Name** | **Description** | **Example Value** |
   |---------------------|-----------------|-------------------|
   | OrderNumber* | Unique identifier for the order whose details you want to view. | 10100 |

   ![Image](../../../aiv_img/documents/reports/parameter1.png)

---

:::note
Reports with parameters require users to provide input values before execution.  
Ensure all mandatory fields (marked with *) are filled before proceeding.
:::

---

## <h4> Next Steps </h4>

After entering all required parameters, proceed with the next tab:

- <a href=".././schedule" target="_blank">**Schedule Tab**</a> 
- <a href=".././output" target="_blank">**Output Tab**</a>
- <a href=".././email" target="_blank">**Email Tab**</a>