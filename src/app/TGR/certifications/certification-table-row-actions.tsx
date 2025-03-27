import { CertificationData } from "./types";
import { supabase } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { PopoverForm } from "./PopoverForm";
import { toast } from "sonner";

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

  const handleDelete = async () => {
    const { error } = await supabase
      .from("certifications")
      .delete()
      .eq("id", certification.id);

    if (error) {
      console.error("Error deleting certification:", error);
      toast.error("Failed to delete certification.");
    } else {
      toast.success("Certification deleted successfully.");
      onUpdate(certification.id, {});
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

        <RoleBasedWrapper allowedRoles={["admin", "super admin", "dev", "ceo"]}>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Edit Certificate</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <PopoverForm
                onSubmit={onUpdate}
                buttonText="Edit Certificate"
                placeholder="Edit the certificate details"
                formType="editCertificate"
                employees={[]}
                initialData={certification}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={handleDelete}>
            Delete Certificate
          </DropdownMenuItem>
        </RoleBasedWrapper>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CertificationTableRowActions;
