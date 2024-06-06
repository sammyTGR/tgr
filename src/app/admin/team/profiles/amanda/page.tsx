/**
 * v0 by Vercel.
 * @see https://v0.dev/t/aNpMoCgx8pF
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Component() {
  const [activeTab, setActiveTab] = useState("notes");
  return (
    <Card className="h-full max-w-4xl mx-auto my-12">
      <header className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Avatar>
            <img src="/placeholder.svg" alt="Employee Avatar" />
            <AvatarFallback>AW</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">Amanda Weltch</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Executive Secretary, Operations
            </p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <Tabs
          defaultValue="notes"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="border-b border-gray-200 dark:border-gray-700">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="absences">Absences</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="growth">Growth Tracking</TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <div className="p-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="new-note">Add a new note</Label>
                <Textarea
                  id="new-note"
                  placeholder="Type your note here..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid gap-4">
                <div className="grid gap-1">
                  <div className="text-sm font-medium">Performance Review</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Exceeded expectations in Q1. Recommended for promotion.
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-sm font-medium">New Skills Learned</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Learned how to audit and navigate through AIM, DROS Support,
                    Fastbound.
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-sm font-medium">
                    Goal for Next Quarter
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Continue In-depth Learning In AIM To Start Training New
                    Hires And Refresher Training For Current Employees.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="absences">
            <div className="p-6">
              <Calendar className="w-full max-w-[500px] mx-auto" />
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <div className="p-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="new-note">Add a new note</Label>
                <Textarea
                  id="new-note"
                  placeholder="Type your note here..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid gap-4">
                <div className="grid gap-1">
                  <div className="text-sm font-medium">Performance Review</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Exceeded expectations in Q1. Recommended for promotion.
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-sm font-medium">New Skills Learned</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Learned how to audit and navigate through AIM, DROS Support,
                    Fastbound.
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-sm font-medium">
                    Goal for Next Quarter
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Continue In-depth Learning In AIM To Start Training New
                    Hires And Refresher Training For Current Employees.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="growth">
            <div className="p-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="performance-review">Performance Review</Label>
                <Textarea
                  id="performance-review"
                  placeholder="Enter performance review details..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="training-completed">Training Completed</Label>
                <Input
                  id="training-completed"
                  placeholder="Enter training details..."
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="goals">Goals</Label>
                <Textarea
                  id="goals"
                  placeholder="Enter goals..."
                  className="min-h-[100px]"
                />
              </div>
              <Button>Save</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
