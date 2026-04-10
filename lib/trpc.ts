import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        async headers() {
          const headers: Record<string, string> = {};
          const token = await Auth.getSessionToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;
          // Send employee ID for admin panel procedures
          try {
            const empStr = await AsyncStorage.getItem("@rv_admin_employee");
            if (empStr) {
              const emp = JSON.parse(empStr);
              if (emp?.id) headers["x-employee-id"] = String(emp.id);
            }
          } catch {}
          return headers;
        },
        // Custom fetch to include credentials for cookie-based auth
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}

/**
 * Creates a tRPC client for the admin panel.
 * Automatically sends X-Employee-Id header from AsyncStorage.
 */
export function createAdminTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          const headers: Record<string, string> = {};
          // Add OAuth token if available
          const token = await Auth.getSessionToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;
          // Add employee ID for admin procedures
          try {
            const empStr = await AsyncStorage.getItem("@rv_admin_employee");
            if (empStr) {
              const emp = JSON.parse(empStr);
              if (emp?.id) headers["x-employee-id"] = String(emp.id);
            }
          } catch {}
          return headers;
        },
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    ],
  });
}
