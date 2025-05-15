import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pencil1Icon, TrashIcon, DotsVerticalIcon, EraserIcon } from '@radix-ui/react-icons';

interface List {
  id: string;
  title: string;
  items: any[];
}

interface EditListTitleProps {
  list: List;
  updateListTitle: (id: string, title: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  clearList: (id: string) => Promise<void>;
}

export function EditListTitle({
  list,
  updateListTitle,
  deleteList,
  clearList,
}: EditListTitleProps) {
  const [title, setTitle] = useState(list.title);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (title.trim() === '') {
        return;
      }
      try {
        await updateListTitle(list.id, title);
        // console.log("List title updated successfully");
      } catch (error) {
        console.error('Error updating list title:', error);
      } finally {
        setIsDialogOpen(false);
      }
    },
    [list.id, title, updateListTitle]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteList(list.id);
      // console.log("List deleted successfully");
    } catch (error) {
      console.error('Error deleting list:', error);
    } finally {
      setIsDropdownOpen(false);
    }
  }, [list.id, deleteList]);

  const handleClearList = useCallback(async () => {
    try {
      await clearList(list.id);
      // console.log("List cleared successfully");
    } catch (error) {
      console.error('Error clearing list:', error);
    } finally {
      setIsDropdownOpen(false);
    }
  }, [list.id, clearList]);

  const handleEditClick = useCallback(() => {
    setIsDialogOpen(true);
    setIsDropdownOpen(false);
  }, []);

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <DotsVerticalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleEditClick}>
            <Pencil1Icon className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleClearList}>
            <EraserIcon className="mr-2 h-4 w-4" />
            <span>Clear List</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleDelete}>
            <TrashIcon className="mr-2 h-4 w-4" />
            <span>Delete List</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit List Title</DialogTitle>
            <DialogDescription>Enter the new title for your list</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 pt-2">
              <Input
                id="title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full my-2">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
