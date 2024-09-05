"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type OnboardingData = {
  name: string;
  email: string;
  companySize: string;
  role: string;
  goals: string[];
  additionalInfo: string;
};

const initialData: OnboardingData = {
  name: "",
  email: "",
  companySize: "",
  role: "",
  goals: [],
  additionalInfo: "",
};

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = (fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const isStepComplete = () => {
    switch (step) {
      case 1:
        return data.name.trim() !== "" && data.email.trim() !== "";
      case 2:
        return data.companySize !== "" && data.role !== "";
      case 3:
        return data.goals.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => updateData({ name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => updateData({ email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Size</Label>
              <Select
                value={data.companySize}
                onValueChange={(value) => updateData({ companySize: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your Role</Label>
              <RadioGroup
                value={data.role}
                onValueChange={(value) => updateData({ role: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual">Individual Contributor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manager" id="manager" />
                  <Label htmlFor="manager">Manager</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="executive" id="executive" />
                  <Label htmlFor="executive">Executive</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Label>What are your main goals? (Select all that apply)</Label>
            <div className="space-y-2">
              {[
                "Increase Productivity",
                "Improve Collaboration",
                "Streamline Processes",
                "Reduce Costs",
                "Enhance Security",
              ].map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={goal}
                    checked={data.goals.includes(goal)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateData({ goals: [...data.goals, goal] });
                      } else {
                        updateData({
                          goals: data.goals.filter((g) => g !== goal),
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor={goal}>{goal}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">
                Any additional information you'd like to share?
              </Label>
              <Textarea
                id="additionalInfo"
                value={data.additionalInfo}
                onChange={(e) => updateData({ additionalInfo: e.target.value })}
                placeholder="Tell us more about your needs..."
                rows={4}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-lg">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-1/4 h-2 rounded-full ${
                i <= step ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Step {step} of 4
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {renderStep()}

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handlePrev}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          )}
          {step < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!isStepComplete()}
              className="ml-auto"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={() => console.log("Form submitted:", data)}
              disabled={!isStepComplete()}
              className="ml-auto"
            >
              Complete <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
