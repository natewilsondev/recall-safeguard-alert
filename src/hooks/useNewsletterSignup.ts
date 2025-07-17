
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewsletterSignupData {
  email: string;
  categories: string[];
}

export const useNewsletterSignup = () => {
  return useMutation({
    mutationFn: async (data: NewsletterSignupData) => {
      const { error } = await supabase
        .from("alert_preferences")
        .insert({
          email: data.email,
          categories: data.categories.length > 0 ? data.categories : null,
        });

      if (error) {
        // If error is due to duplicate email, update instead
        if (error.code === "23505") {
          const { error: updateError } = await supabase
            .from("alert_preferences")
            .update({
              categories: data.categories.length > 0 ? data.categories : null,
              updated_at: new Date().toISOString(),
              is_active: true,
            })
            .eq("email", data.email);

          if (updateError) {
            throw updateError;
          }
        } else {
          throw error;
        }
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Successfully subscribed to recall alerts!");
    },
    onError: (error) => {
      console.error("Newsletter signup error:", error);
      toast.error("Failed to subscribe. Please try again.");
    },
  });
};
