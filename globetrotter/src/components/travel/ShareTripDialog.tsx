import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Share2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { shareCode } from "@/lib/api";
import type { TripDetail } from "@/lib/types";

export function ShareTripDialog({ trip }: { trip: TripDetail }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const linkQuery = useQuery({
    queryKey: ["share-link", trip.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("share_links")
        .select("code")
        .eq("trip_id", trip.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.code ?? null;
    },
  });

  const code = linkQuery.data ?? null;
  const url = code
    ? `${typeof window === "undefined" ? "" : window.location.origin}/s/${code}`
    : "";

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
    queryClient.invalidateQueries({ queryKey: ["share-link", trip.id] });
  };

  const publish = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("share_links")
        .insert({ trip_id: trip.id, code: shareCode() });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Public link created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const unpublish = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("share_links").delete().eq("trip_id", trip.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Link revoked");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link and copy manually.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Share2 className="size-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this itinerary</DialogTitle>
          <DialogDescription>
            A read-only page anyone can open — no account needed. Costs and notes are visible, your
            account details are not.
          </DialogDescription>
        </DialogHeader>

        {code ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input readOnly value={url} aria-label="Public itinerary link" />
              <Button size="icon" variant="outline" onClick={copy} aria-label="Copy link">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Revoking the link makes the page unavailable immediately.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This trip is private. Publish a link to let friends view the plan.
          </p>
        )}

        <DialogFooter>
          {code ? (
            <Button
              variant="ghost"
              onClick={() => unpublish.mutate()}
              disabled={unpublish.isPending}
            >
              {unpublish.isPending ? "Revoking…" : "Revoke link"}
            </Button>
          ) : (
            <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
              {publish.isPending ? "Publishing…" : "Publish link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
