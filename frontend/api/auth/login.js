import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { AUTH_CONFIG } from "../../config/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { telegram_id, first_name, username, photo_url, auth_date, hash } = req.body;

    // Verify Telegram login widget data
    const isValid = verifyTelegramAuth(req.body);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid authentication" });
    }

    // Check if user is subscribed to the required Telegram channel
    const isSubscribed = await checkChannelSubscription(telegram_id);
    if (!isSubscribed) {
      return res.status(403).json({ 
        error: "Subscription required",
        redirectUrl: `https://t.me/+gMRUZW8-BgY1ZTdk`
      });
    }

    // Generate user JWT token
    const token = jwt.sign(
      { 
        telegram_id,
        username,
        role: "user"
      },
      AUTH_CONFIG.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(200).json({ 
      token,
      role: "user",
      telegram_id,
      username,
      first_name,
      photo_url
    });
  } catch (error) {
    console.error("User login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function checkChannelSubscription(telegram_id) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${AUTH_CONFIG.TELEGRAM_BOT_TOKEN}/getChatMember`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: "@BetrixAIChannel",
          user_id: telegram_id
        })
      }
    );

    const data = await response.json();
    if (!data.ok) return false;

    const status = data.result.status;
    return ["creator", "administrator", "member"].includes(status);
  } catch (error) {
    console.error("Channel subscription check error:", error);
    return false;
  }
}

function verifyTelegramAuth(authData) {
  const { hash, ...data } = authData;
  
  const checkString = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join("\n");
  
  const secretKey = createHash("sha256")
    .update(AUTH_CONFIG.TELEGRAM_BOT_TOKEN)
    .digest();
  
  const hmac = createHash("sha256")
    .update(checkString)
    .update(secretKey)
    .digest("hex");
  
  return hmac === hash;
}