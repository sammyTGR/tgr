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

interface List {
  id: string;
  title: string;
  items: any[];
}

export function EditListTitle({
  list,
  updateListTitle,
  deleteList,
}: {
  list: List;
  updateListTitle: (id: string, title: string) => void;
  deleteList: (id: string | number) => void;
}) {
  const [title, setTitle] = useState(list.title);

  const handleSubmit = () => {
    if (title.trim() === "") {
      return;
    }
    updateListTitle(list.id, title);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil1Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Edit List Title</DialogTitle>
          <DialogDescription>
            Enter the new title for your list
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <Input
            id="title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full">
            Submit
          </Button>
          <Button
            onClick={() => deleteList(list.id)}
            className="w-full"
            variant="destructive"
          >
            <TrashIcon className="h-4 w-4" />
            Delete List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
