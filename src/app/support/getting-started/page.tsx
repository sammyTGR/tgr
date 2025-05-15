import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function GettingStartedPage() {
  const sections = [
    {
      id: 'dashboard-overview',
      title: 'Dashboards Overview',
      content: `The dashboard provides a comprehensive view of each user role's activities. You'll find:
        • All admin roles or higher will see the admin dashboard
        • All user roles for employees will see their user profiles
        • All landing pages will have tabs for common actions and insights
        • All user roles for employees will see the bulletin board after logging in with the option to view their profile pages to review quarterly reviews and current audits for sales staff
        • Admin roles or higher will see reporting & certification status, summary statistics and key metrics for daily sales, manage their tasks with to-dos, and more
        • Navigation menu for accessing different pages and features`,
    },
    {
      id: 'navbar-overview',
      title: 'Navigation Sidebar Overview',
      content: `The navigation sidebar provides access to all pages and features allowed for each role:
        • All admin roles or higher will see Auditing, Scheduling, Forms, and Reporting
        • All user roles for employees will see DROS Support, Forms and Schedules
        • All users can view bulletin board posts
        • All users can view patch notes left by developers to see all updates to the application
        • Admins can manage user profiles to view create & edit notes, attendance, and performance reviews
        • Admins can manage all employees' schedules, time off requests, and timesheets
        • Admins can view and manage all submitted daily reports such as range walks, checklists, daily deposits, and more
        • Admins can submit their own posts to the bulletin board
        • Admins can view and create audits, view sales performance, and access auditing guidelines
        • Admins can view and manage the rental firearms checklist
        `,
    },
    // {
    //   id: "first-audit",
    //   title: "Creating Your First Audit",
    //   content: `To create your first audit:
    //     1. Click the "New Audit" button in the top navigation
    //     2. Select the audit type from the available templates
    //     3. Fill in the required information
    //     4. Save or submit the audit for review`,
    // },
    {
      id: 'navigation',
      title: 'Navigating the TGR Application',
      content: `The TGR Application features an intuitive navigation system:
        • Use the navigation sidebar to access different sections
        • The user profile dropdown menu located at the bottom of the sidebar contains quick actions and user settings and access to the profile page
        • Click on the double arrows at the top of the sidebar to expand or collapse the sidebar menu or press control + b on your keyboard`,
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
            <h1 className="text-4xl font-bold mb-4">Getting Started Guide</h1>
            <p className="text-muted-foreground">
              Welcome to the TGR staff management application! This guide will help you understand
              the basics and get you started with the TGR application.
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
