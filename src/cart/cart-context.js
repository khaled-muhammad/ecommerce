import { createContext } from "react";

/** @typedef {{ productId: string, quantity: number }} CartLine */

/** @typedef {{
 *   items: CartLine[],
 *   itemCount: number,
 *   sideCartOpen: boolean,
 *   openSideCart: () => void,
 *   closeSideCart: () => void,
 *   addItem: (product: object, qty?: number) => void,
 *   setQuantity: (productId: string, quantity: number) => void,
 *   removeItem: (productId: string) => void,
 *   clearCart: () => void,
 * }} CartContextValue */

/** @type {import('react').Context<CartContextValue | null>} */
export const CartContext = createContext(null);

export const CART_STORAGE_KEY = "roxy-cart-v1";
