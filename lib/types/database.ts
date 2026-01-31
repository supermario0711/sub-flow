export type Item = {
  id: string;
  name: string;
  category: "vegetable" | "fruit";
  emoji: string;
  image_url: string | null;
  is_seasonal: boolean;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  name: string;
  slug: string;
  persona: "new" | "experienced" | "power";
  created_at: string;
};

export type Box = {
  id: string;
  user_id: string;
  week_start: string;
  lock_at: string;
  status: "draft" | "confirmed" | "delivered" | "skipped";
  confirmed_at: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BoxItem = {
  id: string;
  box_id: string;
  item_id: string;
  position: number;
  added_at: string;
  updated_at: string;
};

export type SwapHistory = {
  id: string;
  box_id: string;
  user_id: string;
  from_item_id: string;
  to_item_id: string;
  context: "user_initiated" | "suggestion_accepted" | "suggestion_rejected";
  swapped_at: string;
};

export type Vacation = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

/** BoxItem joined with its related Item data. */
export type BoxItemWithItem = BoxItem & {
  items: Pick<Item, "id" | "name" | "emoji" | "category">;
};
