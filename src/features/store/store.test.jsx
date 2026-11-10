import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { formatPrice, formatTotals, toCents } from "./money";

const api = vi.hoisted(() => ({
  confirm: vi.fn(),
  list: { data: { rows: [], total: 0 }, isLoading: false, isFetching: false },
  cart: { data: { items: [], totals: {}, count: 0 } },
  config: { data: { enabled: true, mode: "test", publishable_key: "pk_test_x", currencies: ["usd"] } },
  setCartItem: vi.fn(),
  getFree: vi.fn(),
}));

vi.mock("./storeApi", () => ({
  useConfirmCheckoutMutation: () => [(id) => ({ unwrap: () => api.confirm(id) })],
  useGetMyCartQuery: () => api.cart,
  useGetPaymentConfigQuery: () => api.config,
  useSetCartItemMutation: () => [(arg) => ({ unwrap: () => api.setCartItem(arg) }), { isLoading: false }],
  useGetFreeMutation: () => [(arg) => ({ unwrap: () => api.getFree(arg) }), { isLoading: false }],
  useCheckoutCartMutation: () => [vi.fn()],
}));
vi.mock("../models/modelsApi", async (orig) => ({ ...(await orig()), useListModelsQuery: () => api.list }));

import CheckoutCompletePage from "./CheckoutCompletePage";
import { cartKeyOf, readPendingCheckout, savePendingCheckout } from "./CheckoutPage";
import StorePage from "./StorePage";
import { normalizeModel } from "../models/normalizeModel";

describe("money", () => {
  it("formats prices and free", () => {
    expect(formatPrice(0)).toBe("Free");
    expect(formatPrice(500, "usd", "month")).toMatch(/5\.00 \/ month$/);
    expect(formatPrice(1250, "cad")).toMatch(/12\.50/);
  });
  it("parses dollars to cents", () => {
    expect(toCents("5")).toBe(500);
    expect(toCents("4,99")).toBe(499);
    expect(toCents("-1")).toBeNull();
    expect(toCents("abc")).toBeNull();
  });
  it("formats totals without zero lines", () => {
    expect(formatTotals({ month: { usd: 700 }, once: { usd: 0 } })).toHaveLength(1);
  });
});

describe("pending checkout reuse", () => {
  afterEach(() => sessionStorage.clear());
  it("keys a cart by the products not yet owned", () => {
    expect(cartKeyOf({ items: [{ product_id: 5 }, { product_id: 2 }, { product_id: 9, owned: true }] })).toBe("2,5");
  });
  it("reuses a recent checkout for the same cart only", () => {
    savePendingCheckout({ cartKey: "2,5", clientSecret: "cs", subscriptionId: "sub", at: 1000 });
    expect(readPendingCheckout("2,5", 1000 + 60_000)?.subscriptionId).toBe("sub");
    expect(readPendingCheckout("2,6", 1000 + 60_000)).toBeNull();
    expect(readPendingCheckout("2,5", 1000 + 31 * 60_000)).toBeNull();
  });
});

describe("CheckoutCompletePage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    api.confirm.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  const renderAt = (search) =>
    render(
      <MemoryRouter initialEntries={[`/store/checkout/complete${search}`]}>
        <Routes>
          <Route path="/store/checkout/complete" element={<CheckoutCompletePage />} />
        </Routes>
      </MemoryRouter>
    );

  it("asks the server, not the URL, and shows success when Stripe says paid", async () => {
    api.confirm.mockResolvedValue({ status: "active", access: true, product_ids: [10] });
    renderAt("?subscription=sub_1&payment_intent=pi_1&redirect_status=failed");
    expect(await screen.findByText(/purchase is ready/i)).toBeInTheDocument();
    expect(api.confirm).toHaveBeenCalledWith("sub_1");
  });

  it("says the payment failed when Stripe refuses it", async () => {
    api.confirm.mockResolvedValue({ status: "incomplete_expired", access: false, product_ids: [10] });
    renderAt("?subscription=sub_2&redirect_status=succeeded");
    expect(await screen.findByText(/didn't go through/i)).toBeInTheDocument();
  });

  it("checks again while Stripe is still processing, then says so", async () => {
    api.confirm.mockResolvedValue({ status: "incomplete", access: null, product_ids: [10] });
    renderAt("?subscription=sub_3");
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2600);
      });
    }
    expect(await screen.findByText(/still processing/i)).toBeInTheDocument();
    expect(api.confirm).toHaveBeenCalledTimes(6);
  });

  it("handles a visit without a purchase", async () => {
    renderAt("");
    expect(await screen.findByText(/couldn't confirm/i)).toBeInTheDocument();
    expect(api.confirm).not.toHaveBeenCalled();
  });
});

describe("StorePage", () => {
  const renderStore = () =>
    render(
      <MemoryRouter>
        <StorePage />
      </MemoryRouter>
    );

  it("offers the right action for owned, free and paid models, and says it's test mode", async () => {
    api.list = {
      data: {
        rows: [
          normalizeModel({ id: 1, title: "Owned one", role: "purchaser", product_id: 11, price: 500 }),
          normalizeModel({ id: 2, title: "Free one", product_id: 12, price: 0 }),
          normalizeModel({ id: 3, title: "Paid one", product_id: 13, price: 500, currency: "usd", recurring: '{"interval":"month"}' }),
        ],
        total: 3,
      },
      isLoading: false,
      isFetching: false,
    };
    api.cart = { data: { items: [{ product_id: 13 }], totals: {}, count: 1 } };
    renderStore();
    expect(screen.getByText(/Test mode/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get it free/i })).toBeInTheDocument();
    const remove = screen.getByRole("button", { name: /remove from cart/i });
    api.setCartItem.mockResolvedValue({});
    await act(async () => remove.click());
    expect(api.setCartItem).toHaveBeenCalledWith({ productId: 13, quantity: 0 });
  });
});
