// import geoip from "geoip-lite";
// import UAParser from "ua-parser-js";
const geoip = require("geoip-lite");
const UAParser = require("ua-parser-js");

/**
 * Get client IP respecting X-Forwarded-For (if app.set('trust proxy', true)).
 */
export function getClientIp(req) {
  const forwarded = (req.headers["x-forwarded-for"] || "").split(",").map(s => s.trim()).filter(Boolean);
  if (forwarded.length) return forwarded[0];
  // Express also sets req.ip
  if (req.ip) return req.ip;
  if (req.connection?.remoteAddress) return req.connection.remoteAddress;
  if (req.socket?.remoteAddress) return req.socket.remoteAddress;
  return null;
}

export function parseUserAgent(req) {
  const ua = req.headers["user-agent"] || "";
  const parser = new UAParser(ua);
  const result = parser.getResult();
  return {
    raw: ua,
    browser: { name: result.browser.name || "", version: result.browser.version || "" },
    os: { name: result.os.name || "", version: result.os.version || "" },
    device: { vendor: result.device.vendor || "", model: result.device.model || "", type: result.device.type || "" }
  };
}

export function geoFromIp(ip) {
  if (!ip) return null;
  const v4 = ip.replace(/^::ffff:/, "");
  const g = geoip.lookup(v4);
  if (!g) return null;
  return {
    country: g.country || null,
    region: g.region || null,
    city: g.city || null,
    ll: Array.isArray(g.ll) ? g.ll : null
  };
}
