import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EQUIPMENT_CATEGORY_PRESETS, EQUIPMENT_CONDITIONS } from "./equipment-data";

export const equipmentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  category: z.string().trim().min(1, "Category is required").max(40, "Max 40 characters"),
  condition: z.enum(EQUIPMENT_CONDITIONS),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

const defaultValues: EquipmentFormValues = {
  name: "",
  category: EQUIPMENT_CATEGORY_PRESETS[0],
  condition: "Good",
};

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EquipmentFormValues) => void;
}

export function AddEquipmentDialog({ open, onOpenChange, onSubmit }: AddEquipmentDialogProps) {
  const [customCategory, setCustomCategory] = useState(false);
  const form = useForm<EquipmentFormValues>({ resolver: zodResolver(equipmentFormSchema), defaultValues });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setCustomCategory(false);
    }
  }, [open, form]);

  const handleSubmit = (values: EquipmentFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
          <DialogDescription>Track a new piece of equipment.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input placeholder="Treadmill Pro X1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                {customCategory ? (
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g. Recovery" autoFocus {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomCategory(false);
                        field.onChange(EQUIPMENT_CATEGORY_PRESETS[0]);
                      }}
                    >
                      List
                    </Button>
                  </div>
                ) : (
                  <Select
                    onValueChange={(value) => {
                      if (value === "__other__") {
                        setCustomCategory(true);
                        field.onChange("");
                      } else {
                        field.onChange(value);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {EQUIPMENT_CATEGORY_PRESETS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="__other__">Other…</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="condition" render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {EQUIPMENT_CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Add Equipment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
