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
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";

interface Item {
  id: number;
  name: string;
  user_id: string;
  user_name: string;
  list_id: string;
}

export function EditItem({
  item,
  updateItem,
  deleteItem,
}: {
  item: Item;
  updateItem: (id: number, updatedItem: Partial<Item>) => void;
  deleteItem: (id: number) => void;
}) {
  const [name, setName] = useState(item.name);

  const handleSubmit = () => {
    if (name.trim() === "") {
      return;
    }
    updateItem(item.id, { name });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="linkHover2" size="icon">
          <Pencil1Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>Change Your List Item</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <Input
            id="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full">
            Submit
          </Button>
          <Button
            onClick={() => deleteItem(item.id)}
            className="w-full"
            variant="destructive"
          >
            <TrashIcon className="h-4 w-4" />
            Delete Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
