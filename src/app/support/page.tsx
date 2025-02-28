import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SupportPage() {
  const supportSections = [
    {
      title: "Getting Started",
      description: "Learn the basics of navigating and using the dashboard",
      href: "/support/getting-started",
    },
    {
      title: "Audit Management",
      description: "How to create, edit, and manage audits effectively",
      href: "/support/audit-management",
    },
    {
      title: "User Guide",
      description: "Detailed instructions for all user-related features",
      href: "/support/user-guide",
    },
    {
      title: "Reports & Analytics",
      description: "Understanding and utilizing reporting features",
      href: "/support/reports",
    },
    {
      title: "FAQ",
      description: "Frequently asked questions and troubleshooting",
      href: "/support/faq",
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Support Center</h1>
        <p className="text-muted-foreground">
          Welcome to our support center. Find detailed guides and documentation
          to help you make the most of our platform.
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportSections.map((section) => (
            <Link href={section.href} key={section.title}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
