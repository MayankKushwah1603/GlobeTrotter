import { Bookmark, BookmarkCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { City } from "@/lib/types";

export function CityCard({
  city,
  saved,
  onToggleSave,
  footer,
}: {
  city: City;
  saved?: boolean;
  onToggleSave?: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <article className="surface overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={city.image_url}
          alt={`${city.name}, ${city.country}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {onToggleSave && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={saved ? `Remove ${city.name} from saved` : `Save ${city.name}`}
            onClick={onToggleSave}
            className="absolute right-2 top-2 size-8"
          >
            {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          </Button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{city.name}</h3>
            <p className="text-xs text-muted-foreground">
              {city.country} · {city.region}
            </p>
          </div>
          <Badge variant="secondary">Cost {city.cost_index}/5</Badge>
        </div>
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{city.description}</p>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </article>
  );
}
