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
import React, { useState } from "react";
import { PlusIcon } from "@radix-ui/react-icons";

export function AddNewList({
  addNewList,
}: {
  addNewList: (name: string) => void;
}) {
  const [listName, setListName] = useState("");

  const handleSubmit = () => {
    if (listName.trim() === "") {
      return;
    }
    addNewList(listName);
    setListName("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="linkHover1" size="icon">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Add New List</DialogTitle>
          <DialogDescription>Enter the details of your list</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <Input
            id="name"
            value={listName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setListName(e.target.value)
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
