/**
 * OAuth helpers — thin wrapper around native Supabase auth.
 */
import { supabase } from "../supabase/client";
import type { Provider } from "@supabase/supabase-js";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const oauthClient = {
  auth: {
    signInWithOAuth: async (provider: Provider, opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri,
          queryParams: opts?.extraParams,
        },
      });
      if (error) return { error };
      return { data, error: null };
    },
  },
};

/** @deprecated use oauthClient */
export const lovable = oauthClient;
