import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// PBKDF2 password hashing using Web Crypto API (available in Deno)
async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(derived));
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json();

    // ============ REGISTER ============
    if (action === "register") {
      const { full_name, phone, password } = body;

      if (!full_name || !phone || !password) {
        return jsonResponse({ error: "Full name, phone, and password are required" }, 400);
      }
      if (password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
      }

      // Normalize phone
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        return jsonResponse({ error: "Invalid Ethiopian phone number. Use format: 09XXXXXXXX or +2519XXXXXXXX" }, 400);
      }

      // Check if phone already exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existing) {
        return jsonResponse({ error: "An account with this phone number already exists" }, 409);
      }

      const salt = generateSalt();
      const hash = await hashPassword(password, salt);

      const { data: profile, error } = await supabase
        .from("profiles")
        .insert({
          full_name,
          phone: normalizedPhone,
          password_hash: hash,
          password_salt: salt,
          role: "customer",
          is_active: true,
        })
        .select("id, full_name, phone, role, is_active, created_at")
        .single();

      if (error) {
        return jsonResponse({ error: "Failed to create account" }, 500);
      }

      return jsonResponse({ user: profile });
    }

    // ============ LOGIN ============
    if (action === "login") {
      const { phone, password, client_type } = body;

      if (!phone || !password) {
        return jsonResponse({ error: "Phone number and password are required" }, 400);
      }

      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        return jsonResponse({ error: "Invalid Ethiopian phone number" }, 400);
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, is_active, password_hash, password_salt, created_at")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (error || !profile) {
        return jsonResponse({ error: "Invalid phone number or password" }, 401);
      }

      if (!profile.is_active) {
        return jsonResponse({ error: "Your account has been disabled. Contact the restaurant." }, 403);
      }

      const inputHash = await hashPassword(password, profile.password_salt);
      if (inputHash !== profile.password_hash) {
        return jsonResponse({ error: "Invalid phone number or password" }, 401);
      }

      // Public customer login: only customers may authenticate here.
      // Staff (admin/cashier/driver) must use the separate staff login.
      if (client_type === "public" && profile.role !== "customer") {
        return jsonResponse({ error: "This account is not a customer account. Please use the staff login page." }, 403);
      }

      // Staff login: only staff roles may authenticate here.
      if (client_type === "staff" && profile.role === "customer") {
        return jsonResponse({ error: "This is a customer account. Please log in from the main website." }, 403);
      }

      const safeProfile = {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        is_active: profile.is_active,
        created_at: profile.created_at,
      };
      return jsonResponse({ user: safeProfile });
    }

    // ============ LIST USERS (admin only) ============
    if (action === "list-users") {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, is_active, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        return jsonResponse({ error: "Failed to fetch users" }, 500);
      }

      return jsonResponse({ users: profiles ?? [] });
    }

    // ============ CREATE USER (admin creates staff/customer) ============
    if (action === "create-user") {
      const { full_name, phone, password, role } = body;

      if (!full_name || !phone || !password || !role) {
        return jsonResponse({ error: "All fields are required" }, 400);
      }
      if (!["customer", "admin", "cashier", "driver"].includes(role)) {
        return jsonResponse({ error: "Invalid role" }, 400);
      }
      if (password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
      }

      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        return jsonResponse({ error: "Invalid Ethiopian phone number" }, 400);
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existing) {
        return jsonResponse({ error: "An account with this phone number already exists" }, 409);
      }

      const salt = generateSalt();
      const hash = await hashPassword(password, salt);

      const { data: profile, error } = await supabase
        .from("profiles")
        .insert({
          full_name,
          phone: normalizedPhone,
          password_hash: hash,
          password_salt: salt,
          role,
          is_active: true,
        })
        .select("id, full_name, phone, role, is_active, created_at")
        .single();

      if (error) {
        return jsonResponse({ error: "Failed to create user" }, 500);
      }

      return jsonResponse({ user: profile });
    }

    // ============ UPDATE USER ============
    if (action === "update-user") {
      const { id, full_name, phone, role, is_active, password } = body;

      if (!id) {
        return jsonResponse({ error: "User ID is required" }, 400);
      }

      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (role !== undefined) updates.role = role;
      if (is_active !== undefined) updates.is_active = is_active;

      if (phone !== undefined) {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) {
          return jsonResponse({ error: "Invalid Ethiopian phone number" }, 400);
        }
        updates.phone = normalizedPhone;
      }

      if (password !== undefined && password.length > 0) {
        if (password.length < 6) {
          return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
        }
        const salt = generateSalt();
        const hash = await hashPassword(password, salt);
        updates.password_hash = hash;
        updates.password_salt = salt;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select("id, full_name, phone, role, is_active, created_at")
        .single();

      if (error) {
        return jsonResponse({ error: "Failed to update user" }, 500);
      }

      return jsonResponse({ user: profile });
    }

    // ============ DELETE USER ============
    if (action === "delete-user") {
      const { id } = body;
      if (!id) {
        return jsonResponse({ error: "User ID is required" }, 400);
      }

      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) {
        return jsonResponse({ error: "Failed to delete user" }, 500);
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string): string | null {
  if (!phone) return null;
  let p = phone.trim().replace(/\s+/g, "");

  // Remove leading + if present
  if (p.startsWith("+251")) {
    p = p.slice(4);
  } else if (p.startsWith("251")) {
    p = p.slice(3);
  } else if (p.startsWith("0")) {
    p = p.slice(1);
  }

  // Ethiopian mobile numbers: 9XXXXXXXX (9 digits starting with 9)
  if (/^9\d{8}$/.test(p)) {
    return "+251" + p;
  }

  return null;
}
