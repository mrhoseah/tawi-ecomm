import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
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
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
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
      updateQuantity: (productId, quantity, size, color, printedName, printedNumber) => {
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
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

