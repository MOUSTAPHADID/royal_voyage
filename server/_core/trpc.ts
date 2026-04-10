import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getEmployeeById } from "../db.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    // Accept OAuth admin users
    if (ctx.user && ctx.user.role === "admin") {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }

    // Accept any active employee via X-Employee-Id header
    const employeeIdHeader = ctx.req.headers["x-employee-id"];
    if (employeeIdHeader) {
      const empId = parseInt(String(employeeIdHeader), 10);
      if (!isNaN(empId)) {
        const emp = await getEmployeeById(empId);
        if (emp && emp.status === "active") {
          return next({ ctx: { ...ctx, user: ctx.user } });
        }
      }
    }

    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }),
);
