import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SQUARES, type SquareSlug, type SquareDef } from "@/lib/squares";

/**
 * Reads which Squares the current user has enabled (user_square_settings).
 * Falls back to the defaults defined in SQUARES until data loads.
 */
export function useActiveSquares() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<Record<SquareSlug, boolean>>(
    Object.fromEntries(SQUARES.map((s) => [s.slug, s.defaultEnabled])) as Record<SquareSlug, boolean>,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_square_settings")
        .select("square_name, is_enabled")
        .eq("user_id", user.id);
      if (cancelled) return;
      if (data) {
        const map = { ...enabled };
        for (const row of data) {
          if (row.square_name in map) map[row.square_name as SquareSlug] = row.is_enabled;
        }
        setEnabled(map);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const activeSquares: SquareDef[] = SQUARES.filter((s) => enabled[s.slug]);

  const setSquareEnabled = async (slug: SquareSlug, value: boolean) => {
    if (!user) return;
    setEnabled((prev) => ({ ...prev, [slug]: value }));
    // Upsert via select+update/insert
    const { data: existing } = await supabase
      .from("user_square_settings")
      .select("id")
      .eq("user_id", user.id)
      .eq("square_name", slug)
      .maybeSingle();
    if (existing) {
      await supabase.from("user_square_settings").update({ is_enabled: value }).eq("id", existing.id);
    } else {
      await supabase.from("user_square_settings").insert({ user_id: user.id, square_name: slug, is_enabled: value });
    }
  };

  return { enabled, activeSquares, loading, setSquareEnabled };
}
