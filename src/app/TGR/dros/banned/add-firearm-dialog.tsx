"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatabaseFirearm } from "./types";
import { X, Plus } from "lucide-react";

interface Model {
  name: string;
  variations: string;
}

interface AddFirearmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    firearm: Omit<DatabaseFirearm, "firearm_id" | "created_at" | "updated_at">
  ) => void;
}

export default function AddFirearmDialog({
  isOpen,
  onClose,
  onAdd,
}: AddFirearmDialogProps) {
  const [type, setType] = useState<"rifle" | "handgun">("rifle");
  const [manufacturer, setManufacturer] = useState("");
  const [models, setModels] = useState<Model[]>([{ name: "", variations: "" }]);
  const [currentVariation, setCurrentVariation] = useState("");
  const [currentModelIndex, setCurrentModelIndex] = useState(0);

  const handleAddModel = () => {
    setModels([...models, { name: "", variations: "" }]);
    setCurrentModelIndex(models.length);
  };

  const handleRemoveModel = (index: number) => {
    setModels(models.filter((_, i) => i !== index));
    if (currentModelIndex >= index) {
      setCurrentModelIndex(Math.max(0, currentModelIndex - 1));
    }
  };

  const handleModelNameChange = (index: number, value: string) => {
    const sanitizedValue = DOMPurify.sanitize(value);
    const newModels = [...models];
    newModels[index] = { ...newModels[index], name: sanitizedValue };
    setModels(newModels);
  };

  const handleAddVariation = () => {
    if (currentVariation.trim()) {
      const sanitizedVariation = DOMPurify.sanitize(currentVariation.trim());
      const newModels = [...models];
      newModels[currentModelIndex] = {
        ...newModels[currentModelIndex],
        variations: sanitizedVariation,
      };
      setModels(newModels);
      setCurrentVariation("");
    }
  };

  const handleRemoveVariation = (modelIndex: number) => {
    const newModels = [...models];
    newModels[modelIndex] = {
      ...newModels[modelIndex],
      variations: "",
    };
    setModels(newModels);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create a firearm entry for each model
    const firearmsToAdd = models.map((model) => ({
      type,
      manufacturer: manufacturer.trim(),
      model: model.name.trim(),
      variations: model.variations.trim() || null,
    }));

    // Add each firearm
    for (const firearm of firearmsToAdd) {
      await onAdd(firearm);
    }

    // Reset form
    setType("rifle");
    setManufacturer("");
    setModels([{ name: "", variations: "" }]);
    setCurrentVariation("");
    setCurrentModelIndex(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add New Banned Firearm</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="space-y-4 p-6 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: "rifle" | "handgun") => setType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rifle">Rifle</SelectItem>
                  <SelectItem value="handgun">Handgun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={manufacturer}
                onChange={(e) =>
                  setManufacturer(DOMPurify.sanitize(e.target.value))
                }
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Models</Label>
              </div>

              {models.map((model, modelIndex) => (
                <div
                  key={modelIndex}
                  className="space-y-2 p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={model.name}
                      onChange={(e) =>
                        handleModelNameChange(modelIndex, e.target.value)
                      }
                      placeholder="Model name"
                      required
                    />
                    {models.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveModel(modelIndex)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Variations</Label>
                    <div className="flex gap-2">
                      <Input
                        value={
                          modelIndex === currentModelIndex
                            ? currentVariation
                            : ""
                        }
                        onChange={(e) => setCurrentVariation(e.target.value)}
                        placeholder="Add variation"
                        onFocus={() => setCurrentModelIndex(modelIndex)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddVariation}
                        disabled={modelIndex !== currentModelIndex}
                      >
                        Add
                      </Button>
                    </div>
                    {model.variations && (
                      <div className="flex items-center gap-1 bg-secondary p-1 rounded">
                        <span>{model.variations}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleRemoveVariation(modelIndex)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 mt-auto border-t">
            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddModel}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Model
              </Button>
              <Button type="submit">
                Add Firearm{models.length > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
