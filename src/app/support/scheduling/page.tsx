import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

export default function SchedulingPage() {
  const sections = [
    {
      id: "scheduling-guide",
      title: "Scheduling Guide",
      content: `To view schedules & admin options:
        • First navigate to the scheduling page by hovering over the "Scheduling" tab in the navigation bar
        • All user roles can click on "Team Calendar" to view the team calendar
        • Admins will see additional options to view time off requests and to create and manage schedules as well as time clock entries
        • After clicking into Team Calendar, you'll see the team's schedule 1 week at a time
        • To submit a time off request, click on the "Request Time Off" button
        • Fill out all fields of the time off request form, including who you have swapped schedules with to cover for your shift during your time off
        `,
    },
    {
      id: "manage-schedules",
      title: "Manage Schedules & Timesheets",
      content: `After opening the manage schedules & timesheets page:
        • The Scheduling tab will show you all of the employee's schedules as well as the action cards to create and delete schedules from the Team Calendar for individual and all employees
        • To genereate a schedule in the Team Calendar for an individual employee, select the employee's name from the dropdown menu in the Generate A Single Schedule card
        • To generate schedules for all employees in the Team Calendar, click the "Select # Of Weeks" button in the Generate All Schedules card, then enter the number of weeks you want to generate schedules out for
        • Under the Schedule Management section, you can add, update and delete schedules for individual employees from the Team Calendar
        • To add a schedule, click on the "Add Unscheduled Shift" button in the Add A Shift card - this is to be used if an employee is coming in to work an unscheduled shift for situations such as filling in for another employee or if an employee is coming in to work an unscheduled shift due to an emergency
        • To update a schedule, click on the "Update An Existing Shift" button in the Update A Shift card - this is to be used if an employee is already scheduled to work on a given day, but you want to change their shift
        • To delete a scheduled shift, select the employee's name from the dropdown menu in the Clear A Schedule card
        • To view a timesheet, click on the "View Timesheet" button in the Schedule Management section
        • To edit a timesheet, click on the "Edit Timesheet" button in the Schedule Management section
        • To view employee's schedules, you can search for a specific employee from the search bar at the top of the Work Schedules table
        • Use the pagination at the bottom of the Work Schedules table to navigate through the schedules, advancing a page goes to the next employee's schedule and going to the previous page goes to the previous employee's schedule
        `,
    },
    {
      id: "timesheets",
      title: "Managing Timesheets",
      content: `To review timesheets and time clock entries:
        • The Timesheets tab will show all timesheets for all employees with action cards to enter timesheet entries for individual employees that forgot to clock in, and review existing timesheet entries for all employees
        • To enter a timesheet entry for an employee that forgot to clock in, click on the "Add Timesheet Entry" button in the "Add Timesheet Entry" card
        • You can search for specific employees by selecting the employee's name from the dropdown menu under "Select employee"
        • You can filter for specific date ranges by clicking on "Pick a date range" then selecting the start and end dates you wish to filter for
        • You can export your current filtered view by click on "Export to Excel"
        • You can expand all rows to view every timesheet entry for all employees by clicking on "Expand All"
        • You can collapse all rows to hide all timesheet entries for all employees by clicking on "Collapse All"
        • You can toggle the switch to view the Total Hours in either Hours : Minutes or Decimal format
        • The timesheets table will show you the summary of current pay period's timesheets by default
        • The Lunch Start, Lunch End, and Overtime columns are color coded to help you quickly identify late lunches, lunches that are under the required 30 minutes, and if an employee has worked any unapproved Overtime
           - Green: Lunch was started within 5 hours after the shift started | Lunch was taken for 30 minutes or more
           - Yellow: Lunch was started between 5 and 6 hours after the shift started
           - Orange: Lunch was started between 5.5 and 6 hours after the shift started
           - Red: Lunch was started more than 6 hours after the shift started | Lunch was not taken for a minimum of 30 minutes | Overtime was worked
        • Click on an employee's name or row will expand to show you each daily timesheet entry
        • Clicking on the Actions button to the far right will allow you to edit times for the day, or delete the timesheet entry for the day
        `,
    },
    {
      id: "timeoff-review",
      title: "Time Off Review",
      content: `To review time off requests:
        • First navigate to the time off review page by hovering over the "Scheduling" tab in the navigation bar then clicking on "Review Time Off Requests"
        • All requests will be listed starting with the earliest request at the top and the latest request at the bottom
        • The "Details" tab will show you the start and end date range for the request, the reason for the request and details that should list who they have covering for their shift
        • The "Use Sick Or Vacation" tab will show you the available sick time for hourly employees and the available vacation time for salaried employees
        • The "Actions" tab will show you the action buttons to approve, deny or mark the request as a duplicate to remove it
        • In the "Actions" tab, it is very important to select the correct action for the request as this action will be automatically applied to the employee's time off request and will trigger automated emails to send to the employee and update their schedule, calendar and timesheet with the action selected
        • Clicking on "Approve" without selecting to use vacation or sick time, will trigger an email to the employee with the approval, as well as updating the employee's schedule and the team calendar to reflect the approval, and it will insert a fake schedule into the employee_vto_events database table to show for the appropriate hours of VTO that need to show in the Timesheets table
        • Clicking on "Custom Approval" without selecting to use vacation or sick time, will trigger the same events, but you get to set what text is shown in the team calendar
        • Clicking on "Deny" will trigger an email to the employee with the denial, and it will update the request so that it is removed from the list, nothing will change in the team calendar
        • Clicking on "Called Out" will trigger an email to the employee with the called out status, as well as updating the employee's schedule and the team calendar to reflect the approval, and it will insert a fake schedule into the employee_vto_events database table to show for the appropriate hours of VTO that need to show in the Timesheets table
        • Clicking on "Early Leave" will trigger an email to the employee with the early leave approval, and you will be prompted to enter the time they are approved to leave for the day, which will update the employee's schedule and the team calendar to reflect the approved time 
        • Clicking on "Duplicate" will remove the request from the list, nothing will change in the team calendar
        `,
    },
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
            <h1 className="text-4xl font-bold mb-4">Scheduling Guide</h1>
            <p className="text-muted-foreground">
              Utilize this guide to help you navigate through the scheduling
              process.
            </p>

            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-16"
              >
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
