import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { SquareProperty, PropertyType } from "@/components/app/properties/types";

/**
 * Hook that loads all custom properties defined for a given Square,
 * plus values keyed by record_id for fast lookup.
 */
export function useSquareProperties(squareName: string) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<SquareProperty[]>([]);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({}); // record_id -> property_id -> value
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: props } = await supabase
      .from("square_properties")
      .select("*")
      .eq("user_id", user.id)
      .eq("square_name", squareName)
      .order("created_at");
    const list = (props ?? []) as unknown as SquareProperty[];
    setProperties(list);
    if (list.length === 0) {
      setValues({});
      setLoading(false);
      return;
    }
    const { data: vals } = await supabase
      .from("square_property_values")
      .select("record_id, property_id, value")
      .eq("user_id", user.id)
      .in("property_id", list.map((p) => p.id));
    const map: Record<string, Record<string, string>> = {};
    for (const v of vals ?? []) {
      if (!map[v.record_id]) map[v.record_id] = {};
      map[v.record_id][v.property_id] = v.value ?? "";
    }
    setValues(map);
    setLoading(false);
  }, [user, squareName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProperty = async (input: { property_name: string; property_type: PropertyType; options?: { label: string; colour?: string }[] }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("square_properties")
      .insert({
        user_id: user.id,
        square_name: squareName,
        property_name: input.property_name,
        property_type: input.property_type,
        options: input.options ?? [],
      })
      .select()
      .single();
    if (error) throw error;
    setProperties((cur) => [...cur, data as unknown as SquareProperty]);
  };

  const updateProperty = async (id: string, patch: Partial<Pick<SquareProperty, "property_name" | "options">>) => {
    const { error } = await supabase.from("square_properties").update(patch).eq("id", id);
    if (error) throw error;
    setProperties((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } as SquareProperty : p)));
  };

  const deleteProperty = async (id: string) => {
    await supabase.from("square_property_values").delete().eq("property_id", id);
    await supabase.from("square_properties").delete().eq("id", id);
    setProperties((cur) => cur.filter((p) => p.id !== id));
  };

  const setValue = async (recordId: string, propertyId: string, value: string) => {
    if (!user) return;
    setValues((cur) => ({ ...cur, [recordId]: { ...(cur[recordId] ?? {}), [propertyId]: value } }));
    const { data: existing } = await supabase
      .from("square_property_values")
      .select("id")
      .eq("user_id", user.id)
      .eq("record_id", recordId)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (existing) {
      await supabase.from("square_property_values").update({ value }).eq("id", existing.id);
    } else {
      await supabase.from("square_property_values").insert({ user_id: user.id, record_id: recordId, property_id: propertyId, value });
    }
  };

  const valuesFor = (recordId: string) => values[recordId] ?? {};

  return { properties, values, valuesFor, loading, addProperty, updateProperty, deleteProperty, setValue, refresh };
}