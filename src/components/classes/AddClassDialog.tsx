import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISCIPLINE_PRESETS } from "./class-data";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Sparring"] as const;

export const classSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(60, "Max 60 characters"),
  discipline: z.string().trim().min(1, "Discipline is required").max(60, "Max 60 characters"),
  coach: z.string().trim().min(1, "Coach is required").max(60, "Max 60 characters"),
  day: z.enum(DAYS),
  startTime: z.string().min(1, "Start time is required"),
  durationMin: z.coerce.number().int().min(15, "Min 15 minutes").max(240, "Max 240 minutes"),
  level: z.enum(LEVELS),
  capacity: z.coerce.number().int().min(1, "Min 1").max(60, "Max 60"),
  ring: z.string().trim().min(1, "Ring/area is required").max(30, "Max 30 characters"),
});

export type ClassFormValues = z.infer<typeof classSchema>;

const defaultValues: ClassFormValues = {
  title: "",
  discipline: "Muay Thai",
  coach: "",
  day: "Mon",
  startTime: "18:00",
  durationMin: 60,
  level: "Beginner",
  capacity: 20,
  ring: "Ring A",
};

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ClassFormValues) => void;
}

export function AddClassDialog({ open, onOpenChange, onSubmit }: AddClassDialogProps) {
  const [customDiscipline, setCustomDiscipline] = useState(false);
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setCustomDiscipline(false);
    }
  }, [open, form]);

  const handleSubmit = (values: ClassFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule a Class</DialogTitle>
          <DialogDescription>Block a time slot on the weekly training schedule.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Class title</FormLabel>
                  <FormControl><Input placeholder="Clinch & Knees" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="discipline" render={({ field }) => (
                <FormItem>
                  <FormLabel>Discipline</FormLabel>
                  {customDiscipline ? (
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="e.g. Capoeira" autoFocus {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCustomDiscipline(false);
                          field.onChange(DISCIPLINE_PRESETS[0]);
                        }}
                      >
                        List
                      </Button>
                    </div>
                  ) : (
                    <Select
                      onValueChange={(value) => {
                        if (value === "__other__") {
                          setCustomDiscipline(true);
                          field.onChange("");
                        } else {
                          field.onChange(value);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a discipline" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {DISCIPLINE_PRESETS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        <SelectItem value="__other__">Other…</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coach" render={({ field }) => (
                <FormItem>
                  <FormLabel>Coach</FormLabel>
                  <FormControl><Input placeholder="Kru Somchai" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="day" render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="startTime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start time</FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="durationMin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (min)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="capacity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ring" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ring / area</FormLabel>
                  <FormControl><Input placeholder="Ring A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Schedule class</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
