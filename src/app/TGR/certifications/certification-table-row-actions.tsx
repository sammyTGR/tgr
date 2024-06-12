// src/app/TGR/certifications/certification-table-row-actions.tsx
import { CertificationData } from "./columns";
import { supabase } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

const CertificationTableRowActions = ({
  certification,
  onUpdate,
}: {
  certification: CertificationData;
  onUpdate: (id: string, updates: Partial<CertificationData>) => void;
}) => {
  const handleUpdate = async (actionStatus: string) => {
    const { error } = await supabase
      .from("certifications")
      .update({ action_status: actionStatus })
      .eq("id", certification.id);

    if (!error) {
      onUpdate(certification.id, { action_status: actionStatus });
    } else {
      console.error("Error updating certification:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleUpdate("Renewal Started")}>
          Renewal Started
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdate("Submitted")}>
          Submitted
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdate("")}>
          Clear Status
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CertificationTableRowActions;
