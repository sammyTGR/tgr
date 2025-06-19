import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function DrosGuidePage() {
  const sections = [
    {
      id: 'dros-nav-guide',
      title: 'DROS Navigation Bar',
      content: `To view the DROS support navigation bar:
        • First navigate to the DROS Guidance page by expanding the "DROS Support" tab in the sidebar then clicking on "DROS Guidance"
        • If you are an admin, expand the "Auditing" tab on the sidebar, then click the "DROS Guide" link
        • The navigation bar is located at the top of any tab within the "DROS Guidance" page
        • This navigation bar is used to view additional details about the each corresponding section of the DROS process 
        • Forms Of ID will outline details on what forms of ID are accepted and how to identify them as well as the required supporting documents needed for each form of ID
        • Proof Of Residence will outline details on the forms of supporting documents needed for proof of residence or the address correction if they have recently moved
        • 4473 | Fastbound will outline details on how to delivery a firearm that has been delayed
        • DROS Exemptions Guide will outline details on how to enter exemptions in DROS for all agencies, departments, and organizations that qualify
        • Ammo Purchases will outline details on address corrections accepted, the required supporting documents needed , and the required supporting documents needed for an out of state license
        • All Non-U.S. Citizens Info will outline details on DROS exemptions for student & work visas, and information on green cards vs submitted permanent residency & registered alien cards
        • Discount Programs will outline details on programs such as Springfield Armory's FIRSTLINE & Glock's Blue Label programs
        `,
    },
    {
      id: 'dros-guide',
      title: 'DROS Guide',
      content: `To view the DROS support page:
        • From the "DROS Guidance" page, click the "DROS Guide" tab in the page tabs list
        • Start by selecting the type of firearm you are submitting a DROS for
        • Continue by selecting the approrpriate dropdown options
        • After all available dropdown options for the type of DROS are selected, the required documents will be shown at the bottom of the page
        `,
    },

    {
      id: 'banned-assault-weapons',
      title: 'Banned Assault Weapons',
      content: `To view the list of banned assault weapons:
        • From the "DROS Guidance" page, click the "Banned Assault Weapons" tab in the page tabs list
        • You can search for specific audits by utilizing the search bars at the top of the page
        • Filter which columns are visible by clicking on the Columns dropdown menu to the right of the search bars
        • Utilize the pagination at the bottom of the page to navigate through the audits and view more or less audits per page
        `,
    },
    {
      id: 'approved-devices',
      title: 'Approved Devices',
      content: `To view the list of approved FSDs:
        • From the "DROS Guidance" page, click the "Approved Devices" tab in the page tabs list
        • You can search for specific devices by utilizing the search bars at the top of the page
        • Utilize the pagination at the bottom of the page to navigate through the devices and view more or less devices per page
        `,
    },
    {
      id: 'oem-fsd-info',
      title: 'OEM FSD Info',
      content: `To view the list of OEM FSDs:
        • From the "DROS Guidance" page, click the "OEM FSD Info" tab in the page tabs list
        `,
    },
    // {
    //   id: "dros-nav-guide",
    //   title: "DROS Navigation Bar",
    //   content: `To view the DROS support navigation bar:
    //     • The navigation bar is located at the top of any tab within the "DROS Guidance" page
    //     • This navigation bar is used to view additional details about the each corresponding section of the DROS process
    //     • Forms Of ID will outline details on what forms of ID are accepted and how to identify them as well as the required supporting documents needed for each form of ID
    //     • Proof Of Residence will outline details on the forms of supporting documents needed for proof of residence or the address correction if they have recently moved
    //     • 4473 | Fastbound will outline details on how to delivery a firearm that has been delayed
    //     • DROS Exemptions Guide will outline details on how to enter exemptions in DROS for all agencies, departments, and organizations that qualify
    //     • Ammo Purchases will outline details on address corrections accepted, the required supporting documents needed , and the required supporting documents needed for an out of state license
    //     • All Non-U.S. Citizens Info will outline details on DROS exemptions for student & work visas, and information on green cards vs submitted permanent residency & registered alien cards
    //     • Discount Programs will outline details on programs such as Springfield Armory's FIRSTLINE & Glock's Blue Label programs
    //     `,
    // },
    // {
    //   id: "audit-guidelines",
    //   title: "Audit Guidelines",
    //   content: `To view audit guidelines:
    //     • First navigate to the DROS Guidance page by expanding the "DROS Support" tab in the sidebar then clicking on "Submit & Review Audits"
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
            <h1 className="text-4xl font-bold mb-4">DROS Guidance Guide</h1>
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
