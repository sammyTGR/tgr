'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IDsCard from '../cards/IDsCard';
import dynamic from 'next/dynamic';
import { supabase } from '../../../../utils/supabase/client';
import FedsCard from '../cards/FedsCard';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BannedFirearmsPage from '../banned/page';
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/components/ui/sidebar';
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

type DataRow = string[];
type Data = DataRow[];
const SupportMenu = dynamic(() => import('@/components/ui/SupportNavMenu'), {
  ssr: false,
});

interface DropdownItem {
  product: string;
  type: string;
  availability: string;
  validity: string;
  residency: string;
  address: string;
  document: string;
  blank: string;
  requirements: string;
}

// FSD Info Types
interface FSDInfo {
  id: number;
  manufacturer: string;
  lock_make: string;
  lock_model: string;
  notes: string;
  created_at: string;
}

export default function DROSGuide() {
  const { state } = useSidebar();
  const queryClient = useQueryClient();
  const [activeDialogContentId, setActiveDialogContentId] = useState<string | null>(null);

  const [selections, setSelections] = useState<(string | null)[]>(Array(8).fill(null));

  const { data: dropsData = [], isLoading } = useQuery({
    queryKey: ['drops-data'],
    queryFn: async () => {
      const { data: fetchedData, error } = await supabase.from('Drops').select('*');
      if (error) throw error;
      return fetchedData as DropdownItem[];
    },
  });

  const handleSubItemClick = (contentId: string) => {
    setActiveDialogContentId(contentId);
  };

  const renderDialogContent = () => {
    switch (activeDialogContentId) {
      case 'IDsCard':
        return <IDsCard />;
      case 'FedsCard':
        return <FedsCard />;
      default:
        return null;
    }
  };

  const getOptionsForSelect = (index: number) => {
    if (!dropsData?.length) return [];

    let filteredData = dropsData;
    const keys: (keyof DropdownItem)[] = [
      'product',
      'type',
      'availability',
      'validity',
      'residency',
      'address',
      'document',
      'blank',
      'requirements',
    ];

    for (let i = 0; i < index; i++) {
      if (selections[i] !== null) {
        filteredData = filteredData.filter((item) => item[keys[i]] === selections[i]);
      }
    }
    return Array.from(new Set(filteredData.map((item) => item[keys[index]]))).filter(Boolean);
  };

  const handleSelectionChange = (selectIndex: number, value: string) => {
    const updatedSelections = [...selections];
    updatedSelections[selectIndex] = value;
    for (let i = selectIndex + 1; i < updatedSelections.length; i++) {
      updatedSelections[i] = null;
    }
    setSelections(updatedSelections);
  };

  const resetSelections = () => {
    setSelections(Array(8).fill(null));
  };

  const canShowColumnH = () => {
    const areSevenDropdownsSelected = selections
      .slice(0, 7)
      .every((selection) => selection !== null);
    const isBlankAutomaticallySet = selections[7] === '';

    if (areSevenDropdownsSelected && isBlankAutomaticallySet) {
      return true;
    }

    return selections.some((selection, index) => {
      return selection !== null && getOptionsForSelect(index + 1).length === 0;
    });
  };

  const columnHText = canShowColumnH()
    ? dropsData.find((row) => {
        const keys: (keyof DropdownItem)[] = [
          'product',
          'type',
          'availability',
          'validity',
          'residency',
          'address',
          'document',
          'requirements',
        ];
        return selections.every(
          (selection, index) => selection === null || row[keys[index]] === selection
        );
      })?.requirements
    : '';

  function FSDInfoTab() {
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

  return (
    <RoleBasedWrapper allowedRoles={['user', 'auditor', 'admin', 'super admin', 'dev']}>
      <div
        className={`flex flex-col space-y-4 w-full ml-4 md:ml-4 lg:ml-4 overflow-hidden md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] transition-all duration-300`}
      >
        <div className="flex flow-row items-center justify-between mb-8">
          <div className="flex justify-center items-center mx-auto mb-24 w-full">
            <SupportMenu />
          </div>
        </div>

        <Tabs defaultValue="dros-guide" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dros-guide">DROS Guide</TabsTrigger>
            <TabsTrigger value="assault-weapons">Banned Assault Weapons</TabsTrigger>
            <TabsTrigger value="fsd-info">FSD Info</TabsTrigger>
          </TabsList>

          <TabsContent value="dros-guide">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Selection Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {selections.map((selection, index) => {
                      const shouldShow =
                        index === 0 ||
                        (selections[index - 1] !== null &&
                          getOptionsForSelect(index).length > 0 &&
                          getOptionsForSelect(index - 1).length > 0);

                      if (!shouldShow) return null;

                      return (
                        <Select
                          key={index}
                          disabled={index > 0 && selections[index - 1] === null}
                          onValueChange={(value) => handleSelectionChange(index, value)}
                          value={selection || undefined}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selection === null ? `` : selection} />
                          </SelectTrigger>
                          <SelectContent>
                            {getOptionsForSelect(index).map((option, optionIndex) => (
                              <SelectItem key={optionIndex} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {columnHText && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {(columnHText as string).split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button variant="gooeyLeft" onClick={resetSelections} className="w-full sm:w-auto">
                  Reset Selections
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assault-weapons">
            <BannedFirearmsPage />
          </TabsContent>

          <TabsContent value="fsd-info">
            <FSDInfoTab />
          </TabsContent>
        </Tabs>
      </div>
    </RoleBasedWrapper>
  );
}
