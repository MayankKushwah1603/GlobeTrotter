export type City = {
  id: string;
  name: string;
  country: string;
  region: string;
  cost_index: number;
  popularity: number;
  description: string;
  image_url: string;
};

export type Activity = {
  id: string;
  city_id: string;
  title: string;
  description: string;
  type: string;
  duration_minutes: number;
  cost_usd: number;
  image_url: string;
};

export type Trip = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
  budget_limit: number | null;
  created_at: string;
};

export type TripActivity = {
  id: string;
  stop_id: string;
  activity_id: string | null;
  title: string;
  description: string;
  category: string;
  day_date: string;
  start_time: string | null;
  duration_minutes: number;
  cost_usd: number;
  position: number;
};

export type TripStop = {
  id: string;
  trip_id: string;
  city_id: string;
  start_date: string;
  end_date: string;
  position: number;
  notes: string;
  city: City;
  trip_activities: TripActivity[];
};

export type Expense = {
  id: string;
  trip_id: string;
  category: string;
  amount: number;
  note: string;
  incurred_on: string | null;
};

export type TripDetail = Trip & {
  trip_stops: TripStop[];
  expenses: Expense[];
  share_links: { code: string }[];
};

export const ACTIVITY_TYPES = [
  "Sightseeing",
  "Food",
  "Adventure",
  "Culture",
  "Shopping",
  "Nature",
  "Entertainment",
] as const;

export const EXPENSE_CATEGORIES = ["Transport", "Accommodation", "Activities", "Meals"] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
