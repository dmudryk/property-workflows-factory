import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireActor } from "./actor";

// requireActor(): хто увійшов і з якою роллю — з profiles.role. Замокано лише клієнт Supabase (getClaims і рядок
// profiles) і redirect (у Next.js він кидає виняток — тут так само, з адресою в тексті).
// Ручний коміт людини в PR фабрики (WS9, бонус): CI двійника вимагає покриття гілок src/lib/auth/actor.ts ≥ 85%, а
// контракт задачі vendor-pages забороняв фабриці змінювати тести — гілку «vendor» не покривав жоден тест.
const state = vi.hoisted(() => ({
  claims: null as null | { sub: string; email?: string },
  profile: null as null | { role: string; email: string | null },
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

vi.mock("@/lib/supabase/server", () => {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: state.profile, error: null }),
  };
  return {
    createClient: async () => ({
      auth: { getClaims: async () => ({ data: state.claims ? { claims: state.claims } : null, error: null }) },
      from: () => query,
    }),
  };
});

beforeEach(() => {
  state.claims = { sub: "user-1", email: "claims@example.test" };
  state.profile = null;
});

describe("requireActor", () => {
  it("без входу — на сторінку входу", async () => {
    state.claims = null;
    await expect(requireActor()).rejects.toThrow("REDIRECT /login");
  });

  it.each(["manager", "admin", "vendor"])("роль %s — actor з цією роллю й email з профілю", async (role) => {
    state.profile = { role, email: `${role}@example.test` };

    const { actor, email } = await requireActor();

    expect(actor).toEqual({ id: "user-1", role });
    expect(email).toBe(`${role}@example.test`);
  });

  it("невідома роль — actor немає", async () => {
    state.profile = { role: "tenant", email: null };

    const { actor, email } = await requireActor();

    expect(actor).toBeNull();
    expect(email).toBe("claims@example.test");
  });

  it("без профілю й без email у claims — actor і email порожні", async () => {
    state.claims = { sub: "user-1" };

    const { actor, email } = await requireActor();

    expect(actor).toBeNull();
    expect(email).toBeNull();
  });
});
