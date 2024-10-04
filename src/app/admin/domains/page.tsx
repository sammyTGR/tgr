// src/app/admin/domains/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Domain {
  id: number;
  domain: string;
}

export default function ManageEmployeeDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  async function fetchDomains() {
    const { data, error } = await supabase
      .from("employee_domains")
      .select("*")
      .order("domain");

    if (error) {
      //console.("Error fetching domains:", error.message);
    } else {
      setDomains(data as Domain[]);
    }
  }

  async function addDomain() {
    const { error } = await supabase
      .from("employee_domains")
      .insert({ domain: newDomain.toLowerCase() });

    if (error) {
      //console.("Error adding domain:", error.message);
    } else {
      setNewDomain("");
      fetchDomains();
    }
  }

  async function updateDomain() {
    if (!editingDomain) return;

    const { error } = await supabase
      .from("employee_domains")
      .update({ domain: editingDomain.domain.toLowerCase() })
      .eq("id", editingDomain.id);

    if (error) {
      //console.("Error updating domain:", error.message);
    } else {
      setEditingDomain(null);
      fetchDomains();
    }
  }

  async function deleteDomain(id: number) {
    const { error } = await supabase
      .from("employee_domains")
      .delete()
      .eq("id", id);

    if (error) {
      //console.("Error deleting domain:", error.message);
    } else {
      fetchDomains();
    }
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Manage Employee Domains</CardTitle>
          <CardDescription>
            Add, edit, or remove domains for employee email addresses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="Enter new domain"
              className="flex-grow"
            />
            <Button variant="outline" onClick={addDomain}>
              Add Domain
            </Button>
          </div>

          <ul className="space-y-2">
            {domains.map((domain) => (
              <li key={domain.id} className="flex items-center space-x-2">
                {editingDomain && editingDomain.id === domain.id ? (
                  <>
                    <Input
                      type="text"
                      value={editingDomain.domain}
                      onChange={(e) =>
                        setEditingDomain({
                          ...editingDomain,
                          domain: e.target.value,
                        })
                      }
                      className="flex-grow"
                    />
                    <Button onClick={updateDomain} variant="outline">
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingDomain(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-grow">{domain.domain}</span>
                    <Button
                      onClick={() => setEditingDomain(domain)}
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => deleteDomain(domain.id)}
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
