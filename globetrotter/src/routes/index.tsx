import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarRange, Compass, PieChart, Share2 } from "lucide-react";

import heroCoast from "@/assets/hero-coast.jpg";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlobeTrotter — Plan multi-city trips day by day" },
      {
        name: "description",
        content:
          "Build multi-city itineraries, schedule activities per day, track your travel budget and share your trip as a public link.",
      },
      { property: "og:title", content: "GlobeTrotter — Plan multi-city trips day by day" },
      {
        property: "og:description",
        content:
          "Multi-city itinerary builder with day-by-day activities, budget breakdowns and shareable trip pages.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Compass,
    title: "Multi-city stops",
    body: "Chain cities together with dates, notes and travel order — reorder any time.",
  },
  {
    icon: CalendarRange,
    title: "Day-by-day itinerary",
    body: "Drop activities onto specific days with times, durations and costs.",
  },
  {
    icon: PieChart,
    title: "Budget clarity",
    body: "See spend by category and per day, and catch the days that blow the budget.",
  },
  {
    icon: Share2,
    title: "Shareable trips",
    body: "Publish a read-only itinerary link friends can open without an account.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-2 lg:gap-14 lg:pt-14">
        <div>
          <p className="label-meta">Personalised travel planning</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            Every city, every day, every dollar — in one itinerary.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground">
            GlobeTrotter turns a vague idea into a structured plan: pick your cities, build the
            day-by-day schedule, watch the budget as it grows, then share the finished trip.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Start planning free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <img
            src={heroCoast}
            alt="Aerial view of a coastal road winding along Mediterranean cliffs at golden hour"
            width={1600}
            height={1104}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <feature.icon className="size-4" />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-foreground">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>GlobeTrotter — empowering personalised travel planning.</span>
        <span>Built for the itinerary you actually follow.</span>
      </footer>
    </div>
  );
}
