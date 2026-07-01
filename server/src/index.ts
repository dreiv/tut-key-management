import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const app = express();
const PORT = 3001;

app.use(express.json());

// In-Memory Token Registry
// Maps the random string (Opaque Token) to an array of authorized scopes/roles
// Example entry: "ak_7f3b2a..." => ["read:analytics", "read:users"]
const apiKeyRegistry = new Map<string, string[]>();

// API Key Generation Endpoint
app.post("/api/keys", (req: Request, res: Response) => {
  const { roles } = req.body as { roles?: string[] };

  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    res
      .status(400)
      .json({ error: "Please provide an array of roles/permissions." });
    return;
  }

  const rawToken = crypto.randomBytes(16).toString("hex");
  const apiKey = `ak_live_${rawToken}`;

  apiKeyRegistry.set(apiKey, roles);

  res.status(201).json({
    message: "API Key generated successfully!",
    apiKey,
    scopes: roles,
  });
});

// Protection Guard (Middleware Factory)
// This function returns an Express middleware tailored to check for a specific role
function requireRole(requiredRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientKey = req.headers["x-api-key"];

    // Guard Clause: Did they even provide a key?
    if (!clientKey || typeof clientKey !== "string") {
      res
        .status(401)
        .json({ error: "Unauthorized: Missing X-API-Key header." });
      return;
    }

    // Guard Clause: Does this key exist in our memory map?
    const assignedRoles = apiKeyRegistry.get(clientKey);
    if (!assignedRoles) {
      res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired API Key." });
      return;
    }

    // Guard Clause: Does the key have the required role for this specific resource?
    const hasPermission = assignedRoles.includes(requiredRole);
    if (!hasPermission) {
      res.status(403).json({
        error: `Forbidden: This API Key lacks the required '${requiredRole}' permission.`,
      });
      return;
    }

    // Key is fully valid! Proceed to the controller.
    next();
  };
}

// Protected Resource Routes
app.get(
  "/api/analytics",
  requireRole("read:analytics"),
  (_: Request, res: Response) => {
    res.json({
      status: "success",
      resource: "analytics",
      data: {
        dailyActiveUsers: 1420,
        apiRequestsToday: 45210,
        serverUptime: "99.98%",
      },
    });
  },
);

app.get(
  "/api/users",
  requireRole("read:users"),
  (_: Request, res: Response) => {
    res.json({
      status: "success",
      resource: "users",
      data: [
        { id: 1, name: "Alice Smith", role: "Administrator" },
        { id: 2, name: "Bob Jones", role: "Subscriber" },
      ],
    });
  },
);

app.listen(PORT, () => {
  console.log(
    `🔑 Key Management Learning API running at http://localhost:${PORT}`,
  );
});
