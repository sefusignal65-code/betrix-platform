import { VercelRequest, VercelResponse } from "@vercel/node";
import mongoose from "mongoose";

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, source, campaign } = req.body;

  try {
    // Track click
    const trackingService = require("../../bot/src/services/tracking.service");
    await trackingService.trackClick({
      userId,
      source: source || "website",
      campaign: campaign || "direct",
      path: req.headers["referer"],
      userAgent: req.headers["user-agent"],
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      referrer: req.headers["referer"],
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
