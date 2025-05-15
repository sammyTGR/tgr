import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function FormsAndReportsPage() {
  const sections = [
    {
      id: 'forms-guide',
      title: 'Forms Guide',
      content: `To view all forms & reports options:
        • Hover over the "Forms & Reports" tab in the navigation bar to view all available forms and reports
        • One of the forms available is the Certifications form, which is used to track employee certifications
        • The Range Walks & Repairs form is used to track range walks and repairs daily
        • The Submit Daily Deposits form is used to submit daily deposits
        • The Submit Special Orders form is used to submit special orders which are reviewed by Sam directly
        • The Rental Firearms Checklist form is used twice daily to track all rentals and returns of firearms as well as updating any that are sent to gunsmithing or are being rented out
        • The Newsletter form is used to sign customers up to our email blasts (This is connected to our Mailchimp account via API)
        • The Bulletins form is used to submit & view bulletins for all or select groups of employees after they clock in
        • The Patch Notes form is used to submit & view patch notes for all updates to the TGR application
        • The Submit Claimed Points form is used to submit claimed points for all employees and all vendors
        • The DROS Training form will be used as DROS training for employees being trained up to do sales and as needed for refresher training
        `,
    },
    {
      id: 'certifications',
      title: 'Certifications',
      content: `After opening the Certifications form:
        • You can filter for specific employees or certifications by using the search bars at the top of the table
        • To filter for specific columns to view in the table, click on the "Columns" dropdown menu to the right of the search bars
        • The table will automatically show "Start Renewal Process" under the Status column for any certifications that are due for renewal
        • COE renewal notifications are set to show 60 days before the expiration date so that employees can renew their certifications in time, all others are set to show 30 days before the expiration date
        • To add a new certification, click on "Add A Certificate" button under the search bars
        • Click the actions button to the far right of a row to edit or delete a certification, set a status for any certifications that are due for renewal, or to remove a status that was previously set
        • Use the pagination at the bottom of the table to navigate through the certifications
        `,
    },
    {
      id: 'range-walks-and-repairs',
      title: 'Range Walks & Repairs',
      content: `After opening the Range Walks & Repairs form:
        • The Range Walks & Repairs table will show all range walks that are done every evening with the closing crew, as well as all repairs to those problematic lanes that were reported
        • To submit a range walk, click on the "Submit Daily Range Walk" button in the Range Walk card
        • To submit a repair, click on the "Enter Repair Notes" button in the Repair Notes card
        • You can search for specific range walks by employee name or by the date of the range walk in the search bars at the top of the table
        • Use the pagination at the bottom of the table to navigate through the range walks and repairs
        `,
    },
    {
      id: 'daily-deposits',
      title: 'Daily Deposits',
      content: `After opening the daily deposits form:
        • There are tabs to enter daily deposits for each register, which will automatically calculate each denomination's total per row, and the total to deposit for that register
        • To clear a specific register's daily deposits, click on the "Clear Current Register" button at the bottom of each register's table
        • Once all registers have been counted and all registers contain the minimum amount of $300, they can all be submitted by clicking the "Submit Final" button at the bottom of the table
        `,
    },
    {
      id: 'special-orders',
      title: 'Special Orders',
      content: `After opening the special orders form:
        • Fill out the form to submit a special order request that notifies Sam directly so that he can review and email the customer directly
        `,
    },
    {
      id: 'rental-firearms-checklist',
      title: 'Rental Firearms Checklist',
      content: `After opening the rental firearms checklist form:
          • The form will show the full, current list of all rental firearms with any notes to indicate if specific firearms are sitting with the gunsmith or if they are rented out at the moment
          • You can search for specific firearms by entering any part of the firearm's make, model or serial number in the search bar, or by the set Note under the Checklist Notes column with the dropdown menu, or filtering which Columns you want to view with the "Columns" dropdown menu at the top of the table
          • Click on the action button to the far right of a row to "Verify Firearm" which will show a dialog box to confirm the condition and status of the firearm, or to unverify a firearm if it needs to be sent to the gunsmith or needs to be rented back out, or to mark the firearm as being rented out, or with the gunsmith
          • Admins will see options to "Edit Firearm" or "Delete Firearm" in the actions menu
          • To delete a rental firearm, click on the "Delete" button in the top right corner of the form
          • Admins will also see an option to "Add Firearm" which will show a dialog box to add a new rental firearm to the list
          • Clicking on the "Submit Checklist" button at the very top of the page will submit the entire checklist after all firearms have been verified, with the exception of any firearms that are indicated "With Gunsmith" in the Checklist Notes column
          `,
    },
    {
      id: 'newsletter',
      title: 'Newsletter',
      content: `After opening the newsletter form:
          • Fill out the form to submit a newsletter signup which will add the customer to our email blasts list
          `,
    },
    {
      id: 'bulletins',
      title: 'Bulletins',
      content: `After opening the bulletins form:
          • The Bulletins tab will show all of the posted bulletins for all employees
          • Admins will see another tab for "Acknowledgements" which will show all of the bulletins that have been acknowledged by employees
          • Admins will also see a button to "Create Bulletin" which will show a dialog box to create a new bulletins
          `,
    },
    {
      id: 'patch-notes',
      title: 'Patch Notes',
      content: `After opening the patch notes form:
          • The Patch Notes page will show all of the patch notes that have been posted for the TGR application
          • Only the developer can submit patch notes, and they will be shown here after they are submitted
          `,
    },
    {
      id: 'claimed-points',
      title: 'Claimed Points',
      content: `After opening the claimed points form:
          • Complete all fields to submit tracking for your claimed points that are used for any vendor
          • This form is used to keep a history of who hs claimed points for specific firearms that can be used in case there are any discrepancies or issues with claimed points
          `,
    },
    {
      id: 'dros-training',
      title: 'DROS Training',
      content: `After opening the DROS Training page:
          • This page is made to emulate the actual DROS Entry System, and is used to train employees up to do sales and as needed for refresher training
          • Select the type of transaction you want the employee to submit, and have the employee fill out the DROS
          `,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <Link href="/support">
        <Button variant="ghost" className="mb-6">
          ← Back to Support Center
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-2">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-sm hover:text-primary transition-colors"
                >
                  {section.title}
                </Link>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <ScrollArea className="lg:col-span-3">
          <div className="space-y-8">
            <h1 className="text-4xl font-bold mb-4">Forms & Reports Guide</h1>
            <p className="text-muted-foreground">
              Utilize this guide to help you navigate through the forms and reports process.
            </p>

            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-16">
                <Card>
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{section.content}</p>
                  </CardContent>
                </Card>
              </section>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
