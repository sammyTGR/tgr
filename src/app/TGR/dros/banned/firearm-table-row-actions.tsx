'use client';

import { useEffect, useState } from 'react';
import { Row } from '@tanstack/react-table';
import { DatabaseFirearm } from './types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'isomorphic-dompurify';
import { X } from 'lucide-react';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';

interface EditingFirearm extends Omit<DatabaseFirearm, 'variations'> {
  variations: string;
}

interface FirearmTableRowActionsProps {
  row: Row<DatabaseFirearm>;
}

export function FirearmTableRowActions({ row }: FirearmTableRowActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFirearm, setEditingFirearm] = useState<EditingFirearm>({
    ...row.original,
    variations: row.original.variations || '',
  });
  const [currentVariation, setCurrentVariation] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    setEditingFirearm({
      ...row.original,
      variations: row.original.variations || '',
    });
  }, [row.original]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('banned_firearms')
        .delete()
        .eq('firearm_id', row.original.firearm_id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['banned-firearms'] });
      toast.success('Firearm deleted successfully');
    } catch (error) {
      console.error('Error deleting firearm:', error);
      toast.error('Failed to delete firearm');
    }
  };

  const handleEditClick = () => {
    setEditingFirearm({
      ...row.original,
      variations: row.original.variations || '',
    });
    setCurrentVariation('');
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      // console.log("Current editing firearm:", editingFirearm); // Debug log
      const updateData = {
        type: editingFirearm.type,
        manufacturer: DOMPurify.sanitize(editingFirearm.manufacturer.trim()),
        model: DOMPurify.sanitize(editingFirearm.model.trim()),
        variations: currentVariation.trim() || editingFirearm.variations.trim() || null,
      };
      // console.log("Update data being sent:", updateData); // Debug log

      const { error, data } = await supabase
        .from('banned_firearms')
        .update(updateData)
        .eq('firearm_id', row.original.firearm_id)
        .select();

      // console.log("Supabase response:", data);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['banned-firearms'] });
      toast.success('Firearm updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating firearm:', error);
      toast.error('Failed to update firearm');
    }
  };

  const handleAddVariation = () => {
    // console.log("Adding variation:", currentVariation);
    if (currentVariation.trim()) {
      const sanitizedVariation = DOMPurify.sanitize(currentVariation.trim());
      // console.log("Sanitized variation:", sanitizedVariation);
      setEditingFirearm((prev) => ({
        ...prev,
        variations: sanitizedVariation,
      }));
      // Don't clear currentVariation here
    }
  };

  const handleRemoveVariation = () => {
    setEditingFirearm((prev) => ({
      ...prev,
      variations: '',
    }));
  };

  return (
    // <RoleBasedWrapper allowedRoles={["super admin", "dev", "admin"]}>
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEditClick}>
            {' '}
            {/* Use the new handler */}
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Firearm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={editingFirearm.type}
                onValueChange={(value: 'rifle' | 'handgun') =>
                  setEditingFirearm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rifle">Rifle</SelectItem>
                  <SelectItem value="handgun">Handgun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input
                value={editingFirearm.manufacturer}
                onChange={(e) =>
                  setEditingFirearm((prev) => ({
                    ...prev,
                    manufacturer: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={editingFirearm.model}
                onChange={(e) =>
                  setEditingFirearm((prev) => ({
                    ...prev,
                    model: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Variation</Label>
              <Input
                value={currentVariation}
                onChange={(e) => setCurrentVariation(e.target.value)}
                placeholder="Enter variation"
              />
            </div>
            {editingFirearm.variations && (
              <div className="flex items-center gap-1 bg-secondary p-1 rounded mt-2">
                <span>{editingFirearm.variations}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={handleRemoveVariation}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
    // </RoleBasedWrapper>
  );
}
