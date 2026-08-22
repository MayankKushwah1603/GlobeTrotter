import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { citiesQuery } from "@/lib/api";
import type { TripDetail } from "@/lib/types";

export function AddStopDialog({ trip }: { trip: TripDetail }) {
  const cities = useQuery(citiesQuery());
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cityId, setCityId] = useState("");
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.start_date);
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trip_stops").insert({
        trip_id: trip.id,
        city_id: cityId,
        start_date: startDate,
        end_date: endDate,
        notes: notes.trim(),
        position: trip.trip_stops.length,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("City added to itinerary");
      setOpen(false);
      setCityId("");
      setNotes("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const invalid = !cityId || !startDate || !endDate || endDate < startDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Add city
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a city stop</DialogTitle>
          <DialogDescription>
            Choose where you're going and how long you're staying.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {(cities.data ?? []).map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stop-start">Arrive</Label>
              <Input
                id="stop-start"
                type="date"
                min={trip.start_date}
                max={trip.end_date}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stop-end">Depart</Label>
              <Input
                id="stop-end"
                type="date"
                min={startDate}
                max={trip.end_date}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stop-notes">Notes</Label>
            <Textarea
              id="stop-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Staying near the old town, train from previous city."
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={invalid || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Adding…" : "Add stop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
