import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InventoryItem, StockDirection } from "./inventory-data";

const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1"),
  note: z.string().trim().max(200, "Max 200 characters"),
});

export type StockAdjustmentValues = {
  quantity: number;
  note: string;
};

const defaults: StockAdjustmentValues = { quantity: 1, note: "" };

interface StockAdjustmentDialogProps {
  item: InventoryItem | null;
  direction: StockDirection | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: StockAdjustmentValues) => void;
}

export function StockAdjustmentDialog({ item, direction, onOpenChange, onSubmit }: StockAdjustmentDialogProps) {
  const form = useForm<StockAdjustmentValues>({ resolver: zodResolver(stockAdjustmentSchema), defaultValues: defaults });

  useEffect(() => {
    if (item) form.reset(defaults);
  }, [item, direction, form]);

  const handleSubmit = (values: StockAdjustmentValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const isAdd = direction === "add";

  return (
    <Dialog open={!!item && !!direction} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isAdd ? "Add Stock" : "Remove Stock"}</DialogTitle>
          <DialogDescription>{item?.name} · {item?.stock} currently in stock</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl><Input type="number" min={1} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem>
                <FormLabel>Note (optional)</FormLabel>
                <FormControl><Input placeholder={isAdd ? "Restocked from supplier" : "Used / damaged"} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isAdd ? "Add" : "Remove"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
