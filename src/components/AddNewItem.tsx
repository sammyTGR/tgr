import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import React from "react";
import { PlusIcon } from "@radix-ui/react-icons";

export function AddNewItem({
  addNewItem,
}: {
  addNewItem: (name: string) => void;
}) {
  const [itemName, setItemName] = React.useState("");

  const handleSubmit = () => {
    if (itemName.trim() === "") {
      return;
    }
    addNewItem(itemName);
    setItemName("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>You Can Drag Your Items To Different Lists</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <Input
            id="name"
            value={itemName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setItemName(e.target.value)
            }
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full">
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
