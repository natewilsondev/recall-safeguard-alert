
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Recall = Tables<"recalls">;

interface UseRecallsOptions {
  searchQuery?: string;
  category?: string;
  riskLevel?: string;
  limit?: number;
}

export const useRecalls = (options: UseRecallsOptions = {}) => {
  return useQuery({
    queryKey: ["recalls", options],
    queryFn: async () => {
      let query = supabase
        .from("recalls")
        .select("*")
        .order("recall_date", { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.searchQuery && options.searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${options.searchQuery}%,product_name.ilike.%${options.searchQuery}%,brand.ilike.%${options.searchQuery}%,category.ilike.%${options.searchQuery}%`
        );
      }

      if (options.category && options.category !== "all") {
        query = query.eq("category", options.category);
      }

      if (options.riskLevel && options.riskLevel !== "all") {
        query = query.eq("risk_level", options.riskLevel.toUpperCase());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching recalls:", error);
        throw error;
      }

      return data;
    },
  });
};

export const useLatestRecall = () => {
  return useQuery({
    queryKey: ["latest-recall"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recalls")
        .select("title")
        .order("recall_date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching latest recall:", error);
        return null;
      }

      return data;
    },
  });
};
