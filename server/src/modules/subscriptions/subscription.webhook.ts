import type { Request, Response } from "express";
import Stripe from "stripe";
import { getStripeClient } from "../../lib/stripe";
import { handleWebhookEvent } from "./subscription.service";

export async function stripeWebhookHandler(req: Request, res: Response) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    res.status(503).json({ error: "Stripe webhook secret is not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).json({ error: "Missing Stripe signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    res.status(400).json({ error: message });
    return;
  }

  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error("[stripe] Webhook handler error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
