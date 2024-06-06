"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";

const title = "Generate Schedules";

interface Employee {
  id: number;
  name: string;
}

interface ScheduleTemplate {
  id: number;
  date: string;
  shift: string;
  status: string;
}

export default function ScheduleGeneratorPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const { role, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
    fetchTemplates();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("*");
    if (error) {
      console.error("Error fetching employees:", error);
    } else {
      setEmployees(data);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("referenced_schedules")
      .select("*");
    if (error) {
      console.error("Error fetching schedule templates:", error);
    } else {
      setTemplates(data);
    }
  };

  const generateSchedules = async () => {
    try {
      const { error: scheduleError } = await supabase.rpc(
        "generate_schedules_for_all_employees",
        {
          templates: JSON.stringify(templates),
        }
      );

      if (scheduleError) {
        console.error("Error generating schedules:", scheduleError);
      } else {
        console.log("Schedules generated successfully");
        router.push("/admin/schedules"); // Redirect to schedules page after generation
      }
    } catch (error) {
      console.error("Unexpected error generating schedules:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (role !== "admin" && role !== "super admin") {
    router.push("/"); // Redirect to home or another page if the user is not authorized
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-6">
        <TextGenerateEffect words={title} />
      </h1>
      <div className="space-y-4">
        <Button onClick={generateSchedules} variant="outline">
          Generate Schedules for All Employees
        </Button>
      </div>
    </div>
  );
}
