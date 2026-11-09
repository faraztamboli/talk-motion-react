/**
 * Store: payment configuration, the cart (kept per user on the server), checkout, purchases and
 * selling a model. classicApi endpoints over RemotePy (see commerce_service.py).
 */
import { classicApi } from "../../app/classicApi";
import { modelTag } from "../models/modelsApi";

const CART = { type: "Cart", id: "MINE" };
const PURCHASES = { type: "Purchase", id: "MINE" };

export const storeApi = classicApi.injectEndpoints({
  endpoints: (build) => ({
    getPaymentConfig: build.query({
      query: () => ({ fn: "getPaymentConfig", args: [] }),
      keepUnusedDataFor: 3600,
    }),
    getMyCart: build.query({
      query: () => ({ fn: "getMyCart", args: [] }),
      providesTags: [CART],
    }),
    setCartItem: build.mutation({
      query: ({ productId, quantity = 1 }) => ({ fn: "setCartItem", args: [productId, quantity] }),
      // Write the server's cart straight into the cache (no refetch).
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(storeApi.util.upsertQueryData("getMyCart", undefined, data));
        } catch {
          // the caller shows the error
        }
      },
    }),
    clearMyCart: build.mutation({
      query: () => ({ fn: "clearMyCart", args: [] }),
      invalidatesTags: [CART],
    }),
    checkoutCart: build.mutation({
      query: () => ({ fn: "checkoutCart", args: [], timeoutMs: 60000 }),
      invalidatesTags: [CART, PURCHASES, { type: "ModelList", id: "LIST" }],
    }),
    confirmCheckout: build.mutation({
      query: (stripeSubscriptionId) => ({ fn: "confirmCheckout", args: [stripeSubscriptionId], timeoutMs: 45000 }),
      invalidatesTags: [CART, PURCHASES, { type: "ModelList", id: "LIST" }],
    }),
    getFree: build.mutation({
      query: (productId) => ({ fn: "getProductForFree", args: [productId] }),
      invalidatesTags: [CART, PURCHASES, { type: "ModelList", id: "LIST" }],
    }),
    listMyPurchases: build.query({
      query: () => ({ fn: "listMyPurchases", args: [] }),
      providesTags: [PURCHASES],
    }),
    cancelPurchase: build.mutation({
      query: (productId) => ({ fn: "cancelPurchase", args: [productId], timeoutMs: 45000 }),
      invalidatesTags: [PURCHASES, { type: "ModelList", id: "LIST" }],
    }),
    setModelSale: build.mutation({
      query: ({ modelId, priceCents, currency }) => ({ fn: "setModelSale", args: [modelId, priceCents, currency], timeoutMs: 45000 }),
      invalidatesTags: (r, e, { modelId }) => [modelTag(modelId), { type: "ModelList", id: "LIST" }],
    }),
    stopModelSale: build.mutation({
      query: (modelId) => ({ fn: "stopModelSale", args: [modelId], timeoutMs: 45000 }),
      invalidatesTags: (r, e, modelId) => [modelTag(modelId), { type: "ModelList", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPaymentConfigQuery,
  useGetMyCartQuery,
  useSetCartItemMutation,
  useClearMyCartMutation,
  useCheckoutCartMutation,
  useConfirmCheckoutMutation,
  useGetFreeMutation,
  useListMyPurchasesQuery,
  useCancelPurchaseMutation,
  useSetModelSaleMutation,
  useStopModelSaleMutation,
} = storeApi;
