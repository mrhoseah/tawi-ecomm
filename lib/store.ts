import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  /**
   * Optional server-side cart item identifier (from Prisma).
   * Used to sync quantity/removal changes for logged-in users.
   */
  serverId?: string;
  productId: string;
  slug?: string;
  name: string;
  price: number; // Unit price (base + printing cost if personalized)
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  printedName?: string;
  printedNumber?: string;
  printingCost?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, color?: string, printedName?: string, printedNumber?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string, printedName?: string, printedNumber?: string) => void;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const createCartStore = () =>
  create<CartStore>()(
    persist(
      (set, get) => ({
        items: [],
        addItem: (item) => {
          const items = get().items;
          const existingIndex = items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color &&
              (i.printedName || "") === (item.printedName || "") &&
              (i.printedNumber || "") === (item.printedNumber || "")
          );

          if (existingIndex >= 0) {
            const updated = [...items];
            updated[existingIndex].quantity += item.quantity;
            set({ items: updated });
          } else {
            set({ items: [...items, item] });
          }
        },
        removeItem: (productId, size, color, printedName, printedNumber) => {
          set({
            items: get().items.filter(
              (i) =>
                !(
                  i.productId === productId &&
                  (i.size || undefined) === (size || undefined) &&
                  (i.color || undefined) === (color || undefined) &&
                  (i.printedName || "") === (printedName || "") &&
                  (i.printedNumber || "") === (printedNumber || "")
                )
            ),
          });
        },
        updateQuantity: (
          productId,
          quantity,
          size,
          color,
          printedName,
          printedNumber
        ) => {
          if (quantity <= 0) {
            get().removeItem(productId, size, color, printedName, printedNumber);
            return;
          }
          const items = get().items.map((i) =>
            i.productId === productId &&
            (i.size || undefined) === (size || undefined) &&
            (i.color || undefined) === (color || undefined) &&
            (i.printedName || "") === (printedName || "") &&
            (i.printedNumber || "") === (printedNumber || "")
              ? { ...i, quantity }
              : i
          );
          set({ items });
        },
        setItems: (items) => set({ items }),
        clearCart: () => set({ items: [] }),
        getTotal: () => {
          return get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
        },
        getItemCount: () => {
          return get().items.reduce((sum, item) => sum + item.quantity, 0);
        },
      }),
      {
        name: "cart-storage",
        storage:
          typeof window !== "undefined"
            ? createJSONStorage(() => localStorage)
            : undefined,
      }
    )
  );

// On the server, avoid touching browser storage/localStorage entirely.
// We create a non-persisted in-memory store instead.
export const useCartStore =
  typeof window === "undefined"
    ? create<CartStore>()((set, get) => ({
        items: [],
        addItem: (item) =>
          set({ items: [...get().items, item] }), // simple append on server
        removeItem: () => set({ items: [] }),
        updateQuantity: () => {},
        setItems: (items) => set({ items }),
        clearCart: () => set({ items: [] }),
        getTotal: () =>
          get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
        getItemCount: () =>
          get().items.reduce((sum, item) => sum + item.quantity, 0),
      }))
    : createCartStore();

