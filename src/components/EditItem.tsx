import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pencil1Icon, TrashIcon, DotsVerticalIcon } from '@radix-ui/react-icons';

interface Item {
  id: number;
  name: string;
  user_id: string;
  user_name: string;
  list_id: string;
}

interface EditItemProps {
  item: Item;
  updateItem: (id: number, updatedItem: Partial<Item>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export function EditItem({ item, updateItem, deleteItem }: EditItemProps) {
  const [name, setName] = useState(item.name);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setName(item.name);
  }, [item.name]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim() === '') {
        // console.log("Name is empty, not updating");
        return;
      }
      try {
        await updateItem(item.id, { name });
        // console.log("Update function called successfully");
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Error updating item:', error);
      } finally {
        setIsDialogOpen(false);
      }
    },
    [item.id, name, updateItem]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteItem(item.id);
      // console.log("Delete function called successfully");
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }, [item.id, deleteItem]);

  const handleEditClick = useCallback(() => {
    setIsDialogOpen(true);
    setIsDropdownOpen(false);
  }, []);

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <DotsVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleEditClick}>
            <Pencil1Icon className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleDelete}>
            <TrashIcon className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Change Your List Item</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
