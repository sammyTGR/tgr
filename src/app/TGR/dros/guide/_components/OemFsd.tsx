'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useRole } from '@/context/RoleContext';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { TrashIcon, Pencil1Icon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// FSD Info Types
interface FSDInfo {
  id: number;
  manufacturer: string;
  lock_make: string;
  lock_model: string;
  notes: string;
  created_at: string;
}

export default function OemFsd() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  const { role } = useRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<FSDInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  // Fetch FSD Info list from API
  const { data: fsdList = [], isLoading: isFsdLoading } = useQuery({
    queryKey: ['fsd-info-list'],
    queryFn: async () => {
      const res = await fetch('/api/fsd-info');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch FSD Info');
      }
      return res.json();
    },
  });

  // Add new FSD Info via API
  const addFsdMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await fetch('/api/fsd-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add FSD Info');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fsd-info-list'] });
      reset();
    },
  });

  // Delete FSD Info via API
  const deleteFsdMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/fsd-info?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete FSD Info');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fsd-info-list'] });
    },
  });

  // Edit FSD Info via API
  const editFsdMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await fetch(`/api/fsd-info?id=${editEntry?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to edit FSD Info');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fsd-info-list'] });
      setEditDialogOpen(false);
      setEditEntry(null);
      reset();
    },
  });

  const onSubmit = (data: any) => {
    addFsdMutation.mutate(data);
  };

  // Handler for edit button
  const handleEdit = (entry: FSDInfo) => {
    setEditEntry(entry);
    setEditDialogOpen(true);
    reset(entry); // prefill form
  };

  // Handler for delete button
  const handleDelete = (id: number) => {
    deleteFsdMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {(role === 'admin' || role === 'super admin' || role === 'dev' || role === 'ceo') && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-2" onClick={() => setDialogOpen(true)}>
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add FSD Info</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((data) => {
                onSubmit(data);
                setDialogOpen(false);
              })}
              className="grid gap-4 md:grid-cols-2"
            >
              <div>
                <Input
                  placeholder="Firearm Manufacturer"
                  {...register('manufacturer', { required: true })}
                  disabled={isSubmitting}
                />
                {errors.manufacturer && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div>
                <Input
                  placeholder="Lock Make"
                  {...register('lock_make', { required: true })}
                  disabled={isSubmitting}
                />
                {errors.lock_make && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div>
                <Input
                  placeholder="Lock Model"
                  {...register('lock_model', { required: true })}
                  disabled={isSubmitting}
                />
                {errors.lock_model && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="md:col-span-2">
                <Textarea placeholder="Notes" {...register('notes')} disabled={isSubmitting} />
              </div>
              <DialogFooter className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isSubmitting || addFsdMutation.isPending}>
                  {addFsdMutation.isPending ? 'Adding...' : 'Add Entry'}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FSD Info</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => {
              editFsdMutation.mutate(data);
            })}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <Input
                placeholder="Firearm Manufacturer"
                {...register('manufacturer', { required: true })}
                disabled={isSubmitting}
              />
              {errors.manufacturer && <span className="text-red-500 text-xs">Required</span>}
            </div>
            <div>
              <Input
                placeholder="Lock Make"
                {...register('lock_make', { required: true })}
                disabled={isSubmitting}
              />
              {errors.lock_make && <span className="text-red-500 text-xs">Required</span>}
            </div>
            <div>
              <Input
                placeholder="Lock Model"
                {...register('lock_model', { required: true })}
                disabled={isSubmitting}
              />
              {errors.lock_model && <span className="text-red-500 text-xs">Required</span>}
            </div>
            <div className="md:col-span-2">
              <Textarea placeholder="Notes" {...register('notes')} disabled={isSubmitting} />
            </div>
            <DialogFooter className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting || editFsdMutation.isPending}>
                {editFsdMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle>FSD Info List</CardTitle>
        </CardHeader>
        <CardContent>
          {isFsdLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Firearm Manufacturer</th>
                    <th className="px-2 py-1 text-left">Lock Make</th>
                    <th className="px-2 py-1 text-left">Lock Model</th>
                    <th className="px-2 py-1 text-left">Notes</th>
                    <th className="px-2 py-1 text-left">Added</th>
                    {(role === 'admin' ||
                      role === 'super admin' ||
                      role === 'dev' ||
                      role === 'ceo') && <th className="px-2 py-1 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {fsdList.map((item: any) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-2 py-1">{item.manufacturer}</td>
                      <td className="px-2 py-1">{item.lock_make}</td>
                      <td className="px-2 py-1">{item.lock_model}</td>
                      <td className="px-2 py-1 whitespace-pre-wrap">{item.notes}</td>
                      <td className="px-2 py-1">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                      </td>
                      {(role === 'admin' ||
                        role === 'super admin' ||
                        role === 'dev' ||
                        role === 'ceo') && (
                        <td className="px-2 py-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <DotsHorizontalIcon className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil1Icon className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEntryToDelete(item.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <TrashIcon className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {fsdList.length === 0 && <div className="text-center py-4">No entries yet.</div>}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Link
            href="https://oag.ca.gov/firearms/certified-safety-devices/search-results"
            className="text-purple-600 hover:text-purple-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Approved Safety Devices
          </Link>
        </CardFooter>
      </Card>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  if (entryToDelete !== null) handleDelete(entryToDelete);
                  setDeleteDialogOpen(false);
                }}
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
