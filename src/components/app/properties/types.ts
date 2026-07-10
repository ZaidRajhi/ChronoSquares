export type PropertyType = "text" | "number" | "select" | "multi_select" | "date" | "checkbox" | "url";

export interface SquareProperty {
  id: string;
  user_id: string;
  square_name: string;
  property_name: string;
  property_type: PropertyType;
  options: { label: string; colour?: string }[];
  created_at: string;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  multi_select: "Multi-select",
  date: "Date",
  checkbox: "Checkbox",
  url: "URL",
};

export const SELECT_COLOURS = [
  "#34d399", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#facc15", "#94a3b8", "#f87171",
];