const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  APP_URL = "http://localhost:3014",
} = process.env;

if (
  !NEXT_PUBLIC_SUPABASE_URL ||
  !NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !ADMIN_EMAIL ||
  !ADMIN_PASSWORD
) {
  throw new Error("Faltan variables para ejecutar la prueba de usuarios.");
}

const testEmail = `codex.prueba.${Date.now()}@example.com`;
let testUserId;

async function authRequest(path, body, key = NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const response = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { response, payload: await response.json() };
}

try {
  const adminLogin = await authRequest("token?grant_type=password", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (!adminLogin.response.ok) {
    throw new Error(`No se pudo autenticar al admin: ${adminLogin.payload.msg}`);
  }

  const importResponse = await fetch(`${APP_URL}/api/admin/users/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminLogin.payload.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      users: [
        {
          firstName: "Codex",
          lastName: "Prueba",
          email: testEmail,
        },
      ],
    }),
  });
  const importPayload = await importResponse.json();
  const result = importPayload.results?.[0];

  if (!importResponse.ok || result?.status !== "created") {
    throw new Error(
      `La importación falló: ${result?.message || importPayload.error}`,
    );
  }

  if (result.temporaryPassword !== "Prueba.Codex#2026") {
    throw new Error("La contraseña temporal no sigue el formato esperado.");
  }

  const studentLogin = await authRequest("token?grant_type=password", {
    email: testEmail,
    password: result.temporaryPassword,
  });
  if (!studentLogin.response.ok) {
    throw new Error("El usuario importado no pudo iniciar sesión.");
  }
  testUserId = studentLogin.payload.user.id;

  if (studentLogin.payload.user.user_metadata.must_change_password !== true) {
    throw new Error("La cuenta no solicita cambio de contraseña.");
  }

  const forbiddenImport = await fetch(`${APP_URL}/api/admin/users/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentLogin.payload.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      users: [
        {
          firstName: "Sin",
          lastName: "Permiso",
          email: `sin.permiso.${Date.now()}@example.com`,
        },
      ],
    }),
  });
  if (forbiddenImport.status !== 403) {
    throw new Error("Una cuenta no administrativa pudo importar usuarios.");
  }

  const changedPassword = "Nueva.Prueba#2026";
  const passwordUpdate = await fetch(
    `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
    {
      method: "PUT",
      headers: {
        apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${studentLogin.payload.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: changedPassword,
        data: {
          ...studentLogin.payload.user.user_metadata,
          must_change_password: false,
        },
      }),
    },
  );
  if (!passwordUpdate.ok) {
    throw new Error("El usuario no pudo cambiar su contraseña.");
  }

  const changedPasswordLogin = await authRequest("token?grant_type=password", {
    email: testEmail,
    password: changedPassword,
  });
  if (
    !changedPasswordLogin.response.ok ||
    changedPasswordLogin.payload.user.user_metadata.must_change_password !==
      false
  ) {
    throw new Error("La nueva contraseña o su estado no quedaron guardados.");
  }

  const blockedSignup = await authRequest("signup", {
    email: `codex.bloqueado.${Date.now()}@example.com`,
    password: "Bloqueada#2026",
  });
  if (blockedSignup.response.ok) {
    throw new Error("Supabase todavía permite el registro público.");
  }

  console.log(
    "User import smoke test: creación, permisos, contraseña y bloqueo público OK.",
  );
} finally {
  if (testUserId) {
    const cleanup = await fetch(
      `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${testUserId}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    if (!cleanup.ok) {
      console.warn("No se pudo eliminar la cuenta temporal de prueba.");
    }
  }
}
