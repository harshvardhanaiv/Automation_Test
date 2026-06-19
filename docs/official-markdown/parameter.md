Parameter Tab
=============

The **Parameter Tab** allows users to make reports dynamic and interactive by filtering or customizing the report output based on specific input values.  
For example, you can generate a report for a particular **Order Number**, **Date Range**, or **Region** without changing the report design.

* * *

#### Objective

To understand how to enter parameter values before scheduling or running a report.

* * *

#### Prerequisites

1.  For this example, the report used is **Order details.rptdesign**.
    
2.  Download the required sample files from the link [parameter.zip](https://aivhub.com/vinit/v6_docs_zipfiles/Report.zip)
    
3.  Upload **Order details.rptdesign** to the **Report Section** under the **Root** folder.
    
4.  Refer to this [link](../../.././common/upload) for detailed steps on uploading files in the application.
    

* * *

#### Steps to Configure the Parameter Tab

1.  From the **Hamburger menu**, navigate to **Documents -> Reports**.
    
    ![Image](/_astro/parameter.1d5ac685_9wEnk.webp)
    
2.  Select any report that uses parameters. For this example, we are using **Order details report**.
    
3.  In the **Parameter Tab**, specify the input values required to generate the report.  
    Parameters marked with an asterisk **(\*)** are **mandatory** and must be filled before proceeding.
    
    **Example:**
    
    **Parameter Name**
    
    **Description**
    
    **Example Value**
    
    OrderNumber\*
    
    Unique identifier for the order whose details you want to view.
    
    10100
    
    ![Image](/_astro/parameter1.9c5afa08_iAvwu.webp)
    

* * *

Note

Reports with parameters require users to provide input values before execution.  
Ensure all mandatory fields (marked with \*) are filled before proceeding.

* * *

#### Next Steps

After entering all required parameters, proceed with the next tab:

*   [**Schedule Tab**](.././schedule)
*   [**Output Tab**](.././output)
*   [**Email Tab**](.././email)

[Previous  
Introduction](/aiv/documents/report/introduction/) [Next  
Introduction](/aiv/documents/report/schedule/)