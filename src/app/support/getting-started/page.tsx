import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

export default function GettingStartedPage() {
  const sections = [
    {
      id: "dashboard-overview",
      title: "Dashboard Overview",
      content: `The dashboard provides a comprehensive view of each user role's activities. You'll find:
        • All admin roles or higher will see the admin dashboard
        • All user roles or higher will see their user profiles
        • All landing pages will have tabs for common actions and insights
        • Admin roles or higher will see summary statistics and key metrics
        • Navigation menu for accessing different pages and features`,
    },
    {
      id: "navbar-overview",
      title: "Navigation Bar Overview",
      content: `The navigation bar provides access to all pages and features allowed for each role:
        • All admin roles or higher will see Auditing, Scheduling, Forms, and Reporting
        • All user roles or higher will see DROS Support, Forms and Schedules
        • Admins can manage user profiles to show notes, attendance, and performance reviews
        • Admins can manage all employees' schedules, time off requests, and timesheets
        • Admins can view and manage all submitted daily reports such as range walks, checklists, daily deposits, and more
        • All users can view bulletin board posts and admins can submit their own posts
        • Admins can view and create audits, view sales performance, and access auditing guidelines
        `,
    },
    {
      id: "first-audit",
      title: "Creating Your First Audit",
      content: `To create your first audit:
        1. Click the "New Audit" button in the top navigation
        2. Select the audit type from the available templates
        3. Fill in the required information
        4. Save or submit the audit for review`,
    },
    {
      id: "navigation",
      title: "Navigating the Platform",
      content: `Our platform features an intuitive navigation system:
        • Use the sidebar menu to access different sections
        • The top bar contains quick actions and user settings
        • Breadcrumbs help you track your location
        • Search functionality is available throughout the platform`,
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
              Welcome to our platform! This guide will help you understand the
              basics and get you started with your audit management journey.
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
