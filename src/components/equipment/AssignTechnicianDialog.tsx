import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Equipment } from "./equipment-data";

export const assignTechnicianSchema = z.object({
  technician: z.string().trim().min(1, "Technician is required").max(80, "Max 80 characters"),
  action: z.string().trim().min(1, "Describe the work" ).max(200, "Max 200 characters"),
});

export type AssignTechnicianValues = z.infer<typeof assignTechnicianSchema>;

const defaultValues: AssignTechnicianValues = { technician: "", action: "" };

interface AssignTechnicianDialogProps {
  equipment: Equipment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssignTechnicianValues) => void;
}

export function AssignTechnicianDialog({ equipment, onOpenChange, onSubmit }: AssignTechnicianDialogProps) {
  const form = useForm<AssignTechnicianValues>({ resolver: zodResolver(assignTechnicianSchema), defaultValues });

  useEffect(() => {
    if (equipment) form.reset(defaultValues);
  }, [equipment, form]);

  const handleSubmit = (values: AssignTechnicianValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={!!equipment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>{equipment?.name}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="technician" render={({ field }) => (
              <FormItem>
                <FormLabel>Technician</FormLabel>
                <FormControl><Input placeholder="Mike T." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="action" render={({ field }) => (
              <FormItem>
                <FormLabel>Work to be done</FormLabel>
                <FormControl><Input placeholder="Belt replacement" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Assign</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
