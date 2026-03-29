import rateLimit from "../config/upstash.js";

const getClientIdentifier = (req) => {
  // If user is logged in and auth middleware has set req.user.id
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  // Guest: fall back to IP
  const xff = req.headers["x-forwarded-for"];
  const ip =
    typeof xff === "string"
      ? xff.split(",")[0].trim()
      : req.socket.remoteAddress || "unknown-ip";

  return `guest:${ip}`;
};

const rateLimiter = async (req, res, next) => {
  return next(); // Disable rate limiting for now
  if (req.method === "OPTIONS") {
    return next(); // skip rate limiting for preflight requests
  }
  try {
    const id = req.user?.id ? `user:${req.user.id}` : getClientIdentifier(req);
    console.log("RateLimiter =>", { id, path: req.path, method: req.method });

    const { success } = await rateLimit.limit(id);
    if (!success)
      return res
        .status(429)
        .json({ message: "Too many requests, try again later." });
    next();
  } catch (err) {
    console.error("Rate limit error:", err);
    next(err);
  }
};

export default rateLimiter;
