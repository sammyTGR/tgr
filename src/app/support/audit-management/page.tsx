import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function AuditManagementPage() {
  const sections = [
    {
      id: 'enter-audit',
      title: 'Entering an Audit',
      content: `To enter an audit:
        • First navigate to the audit management page by expanding the "Auditing" tab in the navigation sidebar then clicking on "Auditing & Sales"
        • Click the "Submit Audits" tab in the page tabs list
        • Fill in all fields as accurately as possible since each audit is counted towards the monthly sales performance of the employee
        • For the Audit Category field, if you can't find the exact category, select the option that best describes the general category of the audit
        • In Auditing Details, enter each unique audit detail for the selected Transaction Type, Audit Location & Audit Category in individual lines, each line is saved as a unique audit using the same Transaction Type, Audit Location and Audit Category
        • For any changes in Transaction Type, Audit Location or Audit Category, you will need to create a new audit by clicking "Add Another Audit"
        • If there is an audit that is not needed, click on "Remove Audit" to remove that particular audit
        • To submit all audits, click on "Submit Audit" at the bottom of the page
        `,
    },
    {
      id: 'review-audits',
      title: 'Reviewing Audits',
      content: `To review audits:
        • From the "Auditing & Sales" page, click the "Review Audits" tab in the page tabs list
        • You can search for specific audits by utilizing the search bars at the top of the page
        • Filter which columns are visible by clicking on the Columns dropdown menu to the right of the search bars
        • Utilize the pagination at the bottom of the page to navigate through the audits and view more or less audits per page
        `,
    },
    {
      id: 'sales-performance',
      title: 'Sales Performance',
      content: `To view sales performance:
        • From the "Auditing & Sales" page, click the "Sales Performance" tab in the page tabs list
        • If you want to review sales performance for a specific employee, click on the employee's name from the dropdown menu under "Sales Rep"
        • If you want to review sales performance for all employees, click on the "Show All Employees" toggle button under "Sales Rep"
        • Select the date within the month that you want to review sales performance for
        • If you want to review for the entire month, click on the last day of the month
        • Viewing all employees will show you a table with results of the monthly sales contest, listing the lead employee at the top, and the lowest performing employee at the bottom
        • The table will show the employee's name, their total sales for the month, and their weighted score for the month
        • At the bottom of the table, you will see employee's greyed out with a reasoning under the Status column for why they did not qualify for the monthly sales contest
        • There are clear definitions of what defines a Minor and Major mistake
        • If you want to change between viewing all employees or a specific employee, click on the "Clear All Selections" button to reset the view
        `,
    },
    {
      id: 'audit-guidelines',
      title: 'Audit Guidelines',
      content: `To view audit guidelines:
        • From the "Auditing & Sales" page, click the "Audit Guidelines" tab in the page tabs list
        • The page will show a list of all the audit guidelines that are currently established
        • Click on the down caret button to view the full audit guideline details for each card
        • Click on the "Add Guideline" button to add a new audit guideline
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
            <h1 className="text-4xl font-bold mb-4">Audit Management Guide</h1>
            <p className="text-muted-foreground">
              Utilize this guide to help you navigate through the audit management process.
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
