import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cityActivitiesQuery } from "@/lib/api";
import { suggestCityActivities } from "@/lib/gemini";
import { currency, duration, shortDate } from "@/lib/format";
import { ACTIVITY_TYPES, type Activity, type TripStop } from "@/lib/types";

export function AddActivityDialog({
  tripId,
  stop,
  days,
}: {
  tripId: string;
  stop: TripStop;
  days: string[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(days[0] ?? stop.start_date);
  const [startTime, setStartTime] = useState("09:00");
  const catalog = useQuery({ ...cityActivitiesQuery(stop.city_id), enabled: open });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Sightseeing");
  const [minutes, setMinutes] = useState("120");
  const [cost, setCost] = useState("0");

  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const add = useMutation({
    mutationFn: async (payload: {
      activity_id: string | null;
      title: string;
      description: string;
      category: string;
      duration_minutes: number;
      cost_usd: number;
    }) => {
      const { error } = await supabase.from("trip_activities").insert({
        stop_id: stop.id,
        day_date: day,
        start_time: startTime || null,
        position: stop.trip_activities.length,
        ...payload,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.success("Activity scheduled");
      setOpen(false);
      setTitle("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function addFromCatalog(activity: Activity) {
    add.mutate({
      activity_id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.type,
      duration_minutes: activity.duration_minutes,
      cost_usd: Number(activity.cost_usd),
    });
  }

  async function fetchAiSuggestions() {
    setIsGeneratingAi(true);
    try {
      const items = await suggestCityActivities(stop.city.name, stop.city.country);
      setAiSuggestions(items);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI ideas.");
    } finally {
      setIsGeneratingAi(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" /> Add activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an activity in {stop.city.name}</DialogTitle>
          <DialogDescription>
            Pick from the catalog, generate with Gemini AI, or add custom plans.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Day</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={d}>
                    {shortDate(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-time">Start time</Label>
            <Input
              id="activity-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="catalog" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="catalog" className="flex-1">
              Catalog
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="flex-1 text-indigo-600 dark:text-indigo-400"
              onClick={() => {
                if (aiSuggestions.length === 0 && !isGeneratingAi) {
                  fetchAiSuggestions();
                }
              }}
            >
              <Sparkles className="mr-1 size-3.5" /> AI Ideas
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {catalog.isLoading && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Loading activities…
                </p>
              )}
              {(catalog.data ?? []).map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  disabled={add.isPending}
                  onClick={() => addFromCatalog(activity)}
                  className="w-full rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{activity.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {currency(Number(activity.cost_usd), { compact: true })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activity.type} · {duration(activity.duration_minutes)}
                  </p>
                </button>
              ))}
              {catalog.data?.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No catalog activities for this city yet — use the AI Ideas or Custom tab.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {isGeneratingAi && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <Loader2 className="mb-2 size-5 animate-spin text-indigo-500" />
                  <span>Gemini is generating local ideas for {stop.city.name}...</span>
                </div>
              )}
              {!isGeneratingAi && aiSuggestions.length === 0 && (
                <div className="py-6 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchAiSuggestions}
                    className="text-xs"
                  >
                    <Sparkles className="mr-1.5 size-3.5 text-indigo-500" /> Generate Ideas with
                    Gemini
                  </Button>
                </div>
              )}
              {!isGeneratingAi &&
                aiSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={add.isPending}
                    onClick={() =>
                      add.mutate({
                        activity_id: null,
                        title: item.title,
                        description: item.description || "",
                        category: item.category || "Sightseeing",
                        duration_minutes: item.durationMinutes || 90,
                        cost_usd: item.costUsd || 0,
                      })
                    }
                    className="w-full rounded-md border border-indigo-200/80 bg-indigo-50/20 px-3 py-2.5 text-left transition-colors hover:border-indigo-500 hover:bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {currency(Number(item.costUsd || 0), { compact: true })}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.category} · {duration(item.durationMinutes || 90)}
                    </p>
                  </button>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity-title">Title</Label>
              <Input
                id="activity-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sunset walk along the harbour"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-minutes">Minutes</Label>
                <Input
                  id="activity-minutes"
                  type="number"
                  min={15}
                  step={15}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-cost">Cost (₹)</Label>
                <Input
                  id="activity-cost"
                  type="number"
                  min={0}
                  step={50}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!title.trim() || add.isPending}
                onClick={() =>
                  add.mutate({
                    activity_id: null,
                    title: title.trim(),
                    description: "",
                    category,
                    duration_minutes: Number(minutes) || 60,
                    cost_usd: Number(cost) || 0,
                  })
                }
              >
                {add.isPending ? "Adding…" : "Add activity"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
