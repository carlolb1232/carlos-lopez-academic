import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type ImportedUser = {
  firstName: string;
  lastName: string;
  email: string;
};

type ImportResult = ImportedUser & {
  status: "created" | "error";
  temporaryPassword?: string;
  message?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeName(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function passwordPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 18);
}

function capitalize(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : "";
}

function temporaryPassword(user: ImportedUser) {
  const lastName = capitalize(passwordPart(user.lastName.split(" ")[0]));
  const firstName = capitalize(passwordPart(user.firstName.split(" ")[0]));
  return `${lastName}.${firstName}#${new Date().getFullYear()}`;
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = request.headers.get("authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "La creación de usuarios no está configurada en el servidor." },
      { status: 503 },
    );
  }

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authorization.slice("Bearer ".length);
  const {
    data: { user: requester },
    error: authError,
  } = await adminClient.auth.getUser(token);

  if (authError || !requester) {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
  }

  const requesterClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: administrator, error: administratorError } =
    await requesterClient.rpc("is_admin");

  if (administratorError || administrator !== true) {
    return NextResponse.json(
      { error: "No tienes permisos para crear usuarios." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    users?: ImportedUser[];
  } | null;
  const users = body?.users;

  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json(
      { error: "No se recibieron usuarios válidos." },
      { status: 400 },
    );
  }

  if (users.length > 500) {
    return NextResponse.json(
      { error: "Cada importación admite como máximo 500 usuarios." },
      { status: 400 },
    );
  }

  const normalizedUsers = users.map((user) => ({
    firstName: normalizeName(user.firstName),
    lastName: normalizeName(user.lastName),
    email: normalizeName(user.email).toLowerCase(),
  }));
  const seenEmails = new Set<string>();
  const results: ImportResult[] = [];

  for (const user of normalizedUsers) {
    if (
      user.firstName.length < 2 ||
      user.lastName.length < 2 ||
      !emailPattern.test(user.email)
    ) {
      results.push({
        ...user,
        status: "error",
        message: "Nombre, apellido o correo inválido.",
      });
      continue;
    }

    if (seenEmails.has(user.email)) {
      results.push({
        ...user,
        status: "error",
        message: "Correo duplicado en el archivo.",
      });
      continue;
    }
    seenEmails.add(user.email);

    const password = temporaryPassword(user);
    const { error } = await adminClient.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${user.firstName} ${user.lastName}`,
        first_name: user.firstName,
        last_name: user.lastName,
        must_change_password: true,
        account_source: "admin_import",
      },
    });

    if (error) {
      results.push({
        ...user,
        status: "error",
        message: error.message,
      });
      continue;
    }

    results.push({
      ...user,
      status: "created",
      temporaryPassword: password,
    });
  }

  return NextResponse.json({
    results,
    created: results.filter((result) => result.status === "created").length,
    failed: results.filter((result) => result.status === "error").length,
  });
}
