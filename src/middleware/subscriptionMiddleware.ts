import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/lib/billing-server";

/**
 * Higher-order function wrapping Next.js API Route handlers to enforce
 * subscription access controls and resource usage limits.
 * 
 * @param featureSlug Unique identifier of the feature or limit check
 * @param getUsageCount Optional function to dynamically extract/compute current usage count from request
 */
export function withSubscriptionAccess(
  featureSlug: string,
  getUsageCount?: (req: NextRequest) => number | Promise<number>
) {
  return function (handler: (req: NextRequest, ...args: any[]) => any) {
    return async function (req: NextRequest, ...args: any[]) {
      try {
        // Instantiate server client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json(
            { error: "Unauthorized access. Please authenticate." },
            { status: 401 }
          );
        }

        // Dynamically compute usage count if getter is provided
        let usageCount: number | undefined;
        if (getUsageCount) {
          try {
            usageCount = await getUsageCount(req);
          } catch (e) {
            console.error("Error computing usage count in middleware:", e);
            usageCount = undefined;
          }
        }

        // Verify access permissions
        const allowed = await canAccess(user.id, featureSlug, usageCount, supabase);
        if (!allowed) {
          return NextResponse.json(
            {
              error: "Subscription limit exceeded",
              message: `Your current subscription plan limits access to '${featureSlug}'. Please upgrade your subscription to unlock.`,
              code: "LIMIT_EXCEEDED",
              feature: featureSlug
            },
            { status: 403 }
          );
        }

        return handler(req, ...args);
      } catch (err) {
        console.error("Fatal error in subscription middleware wrapper:", err);
        return NextResponse.json(
          { error: "Internal validation error" },
          { status: 500 }
        );
      }
    };
  };
}
