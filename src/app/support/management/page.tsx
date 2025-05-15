import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function ManagementPage() {
  const sections = [
    {
      id: 'staff-profiles',
      title: 'Staff Profiles',
      content: `After opening the staff profiles page:
        • First navigate to the staff profiles page by hovering over the "Management" tab in the navigation bar then clicking on "Staff Profiles"
        • You can filter for specific employees by utilizing the search bar at the top of the page
        • Once you've opened a specific employee's profile, you can view their profile information, including their daily briefing notes, general notes about the employee, attendance, reviews, tracking, sales, audits and performance
        • To submit a performance review, click on the "Reviews" tab in the page tabs list, then click on "Add Review"
        • Once you've added a review, you can click the "View" button to review it, or the pencil icon to edit it, or the trash icon to delete it
        • If you are ready to sit down with the employee to discuss the review, click on the "Publish" button, which allows the employee to view their review from their own profile
        `,
    },
    {
      id: 'weekly-updates',
      title: 'Weekly Updates',
      content: `After opening the weekly updates page:
        • There will be 3 tabs, the "Team Updates" tab will show all employee's weekly agenda items, the "Edit Your Notes" tab will allow you to enter your agenda items, and the "Discussed Topics" tab will show a history of all discussed agenda notes
        • If it is your first time opening the page, you will need to click on the "Add Yourself" button to create your profile
        • You will need to click the "Edit Your Notes" tab to enter your agenda items, don't forget to click the "Save Changes" button to have your items show in the "Team Updates" tab
        • Fropm the "Team Updates" tab, you can select each individual item for the current manager's review during the meeting to see the "Actions" button appear, then click on either the "Mark As Discussed" or "Remove" to remove the item if it was not discussed
        • From the "Discussed Topics" tab, you can click on any individual row to see the "Actions" button appear, then click on "Remove" to delete the item from the history
        `,
    },
    // {
    //   id: "sales-performance",
    //   title: "Sales Performance",
    //   content: `To view sales performance:
    //     • First navigate to the audit management page by hovering over the "Auditing" tab in the navigation bar then clicking on "Submit & Review Audits"
    //     • Click the "Sales Performance" tab in the page tabs list
    //     • If you want to review sales performance for a specific employee, click on the employee's name from the dropdown menu under "Sales Rep"
    //     • If you want to review sales performance for all employees, click on the "Show All Employees" toggle button under "Sales Rep"
    //     • Select the date within the month that you want to review sales performance for
    //     • If you want to review for the entire month, click on the last day of the month
    //     • Viewing all employees will show you a table with results of the monthly sales contest, listing the lead employee at the top, and the lowest performing employee at the bottom
    //     • The table will show the employee's name, their total sales for the month, and their weighted score for the month
    //     • At the bottom of the table, you will see employee's greyed out with a reasoning under the Status column for why they did not qualify for the monthly sales contest
    //     • There are clear definitions of what defines a Minor and Major mistake
    //     • If you want to change between viewing all employees or a specific employee, click on the "Clear All Selections" button to reset the view
    //     `,
    // },
    // {
    //   id: "audit-guidelines",
    //   title: "Audit Guidelines",
    //   content: `To view audit guidelines:
    //     • First navigate to the audit management page by hovering over the "Auditing" tab in the navigation bar then clicking on "Submit & Review Audits"
    //     • Click the "Audit Guidelines" tab in the page tabs list
    //     • The page will show a list of all the audit guidelines that are currently established
    //     • Click on the down caret button to view the full audit guideline details for each card
    //     • Click on the "Add Guideline" button to add a new audit guideline
    //     `,
    // },
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
            <h1 className="text-4xl font-bold mb-4">Management Guide</h1>
            <p className="text-muted-foreground">
              Utilize this guide to help you navigate through the management processes.
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
