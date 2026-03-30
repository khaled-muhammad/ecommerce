import Stripe from "stripe";
import { env } from "../config/env.js";

export function getStripeOrNull(): Stripe | null {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}
