"use client";

import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PreviewUser = {
  firstName: string;
  lastName: string;
  email: string;
  row: number;
  error?: string;
};

type ImportResult = {
  firstName: string;
  lastName: string;
  email: string;
  status: "created" | "error";
  temporaryPassword?: string;
  message?: string;
};

const headerAliases = {
  firstName: ["nombre", "nombres", "first name", "firstname"],
  lastName: ["apellido", "apellidos", "last name", "lastname"],
  email: ["correo", "email", "correo electronico", "correo electrónico"],
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function parseCsv(text: string) {
  const delimiter = text.split("\n")[0]?.includes(";") ? ";" : ",";
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const cells: string[] = [];
      let cell = "";
      let quoted = false;

      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
          if (quoted && line[index + 1] === '"') {
            cell += '"';
            index += 1;
          } else {
            quoted = !quoted;
          }
        } else if (character === delimiter && !quoted) {
          cells.push(cell.trim());
          cell = "";
        } else {
          cell += character;
        }
      }
      cells.push(cell.trim());
      return cells;
    });
}

function findColumn(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

function rowsToUsers(rows: unknown[][]): PreviewUser[] {
  if (rows.length < 2) throw new Error("El archivo no contiene usuarios.");

  const headers = rows[0].map(normalizeHeader);
  const firstNameIndex = findColumn(headers, headerAliases.firstName);
  const lastNameIndex = findColumn(headers, headerAliases.lastName);
  const emailIndex = findColumn(headers, headerAliases.email);

  if (firstNameIndex < 0 || lastNameIndex < 0 || emailIndex < 0) {
    throw new Error(
      "La primera fila debe contener las columnas Nombre, Apellido y Correo.",
    );
  }

  return rows
    .slice(1)
    .map((row, index) => {
      const firstName = String(row[firstNameIndex] ?? "").trim();
      const lastName = String(row[lastNameIndex] ?? "").trim();
      const email = String(row[emailIndex] ?? "")
        .trim()
        .toLowerCase();
      let error = "";

      if (!firstName || !lastName || !email) {
        error = "Faltan datos obligatorios.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error = "Correo inválido.";
      }

      return { firstName, lastName, email, row: index + 2, error };
    })
    .filter((user) => user.firstName || user.lastName || user.email);
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function UserImportPanel() {
  const [filename, setFilename] = useState("");
  const [preview, setPreview] = useState<PreviewUser[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const validUsers = useMemo(
    () => preview.filter((user) => !user.error),
    [preview],
  );

  async function readFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    setResults([]);

    try {
      let rows: unknown[][];
      if (file.name.toLowerCase().endsWith(".csv")) {
        rows = parseCsv(await file.text());
      } else {
        const { readSheet } = await import("read-excel-file/browser");
        rows = await readSheet(file);
      }
      setPreview(rowsToUsers(rows));
      setFilename(file.name);
    } catch (fileError) {
      setPreview([]);
      setFilename("");
      setError(
        fileError instanceof Error
          ? fileError.message
          : "No se pudo leer el archivo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createUsers() {
    if (!supabase || validUsers.length === 0) return;
    setBusy(true);
    setError("");
    setResults([]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("La sesión administrativa venció.");

      const response = await fetch("/api/admin/users/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          users: validUsers.map(({ firstName, lastName, email }) => ({
            firstName,
            lastName,
            email,
          })),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        results?: ImportResult[];
      };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron crear los usuarios.");
      }
      setResults(payload.results ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron crear los usuarios.",
      );
    } finally {
      setBusy(false);
    }
  }

  const createdUsers = results.filter((result) => result.status === "created");

  return (
    <section
      className="rounded border border-ink/10 bg-white p-6 shadow-soft"
      id="usuarios"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-ocean">
            <Users size={20} />
            <h2 className="text-xl font-bold text-ink">Usuarios autorizados</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Importa una hoja con las columnas Nombre, Apellido y Correo. Cada
            persona recibirá una cuenta confirmada con contraseña temporal.
          </p>
        </div>
        <button
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded border border-ink/12 px-4 text-sm font-bold"
          onClick={() =>
            downloadCsv("plantilla-usuarios.csv", [
              ["Nombre", "Apellido", "Correo"],
              ["Ana", "Torres", "ana.torres@correo.com"],
            ])
          }
          type="button"
        >
          <Download size={16} />
          Plantilla
        </button>
      </div>

      <label className="mt-5 flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded border border-dashed border-ink/25 bg-paper px-4 text-center text-sm font-bold">
        <FileSpreadsheet className="text-ocean" size={24} />
        <span>
          {filename || "Seleccionar archivo Excel o CSV"}
          <span className="mt-1 block text-xs font-normal text-muted">
            Formatos admitidos: .xlsx y .csv
          </span>
        </span>
        <input
          accept=".xlsx,.csv"
          className="sr-only"
          onChange={(event) => void readFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>

      {error ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-copper">
          <AlertCircle size={16} />
          {error}
        </p>
      ) : null}

      {preview.length > 0 ? (
        <>
          <div className="mt-5 overflow-x-auto rounded border border-ink/10">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-paper text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Fila</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Apellido</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 100).map((user) => (
                  <tr className="border-t border-ink/8" key={user.row}>
                    <td className="px-4 py-3 text-muted">{user.row}</td>
                    <td className="px-4 py-3 font-semibold">
                      {user.firstName}
                    </td>
                    <td className="px-4 py-3">{user.lastName}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        user.error ? "text-copper" : "text-moss"
                      }`}
                    >
                      {user.error || "Listo"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {validUsers.length} válidos ·{" "}
              {preview.length - validUsers.length} con errores
            </p>
            <button
              className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ocean px-4 text-sm font-bold text-white disabled:opacity-50"
              disabled={busy || validUsers.length === 0}
              onClick={() => void createUsers()}
              type="button"
            >
              {busy ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Upload size={16} />
              )}
              Crear {validUsers.length} usuarios
            </button>
          </div>
        </>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-5 rounded border border-ink/10 bg-paper p-4">
          <p className="font-bold">
            {createdUsers.length} creados ·{" "}
            {results.length - createdUsers.length} no creados
          </p>
          <p className="mt-1 text-sm text-muted">
            Descarga las credenciales ahora. Las contraseñas no se almacenan en
            el panel.
          </p>
          {createdUsers.length > 0 ? (
            <button
              className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded bg-ink px-4 text-sm font-bold text-white"
              onClick={() =>
                downloadCsv("credenciales-temporales.csv", [
                  ["Nombre", "Apellido", "Correo", "Contraseña temporal"],
                  ...createdUsers.map((user) => [
                    user.firstName,
                    user.lastName,
                    user.email,
                    user.temporaryPassword ?? "",
                  ]),
                ])
              }
              type="button"
            >
              <Download size={16} />
              Descargar credenciales
            </button>
          ) : null}
          {results.some((result) => result.status === "error") ? (
            <div className="mt-4 grid gap-1 text-sm text-copper">
              {results
                .filter((result) => result.status === "error")
                .map((result) => (
                  <p key={result.email}>
                    {result.email}: {result.message}
                  </p>
                ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {busy ? (
        <div
          aria-live="polite"
          className="fixed inset-0 z-[100] grid place-items-center bg-ink/45 px-5 backdrop-blur-sm"
          role="status"
        >
          <div className="flex items-center gap-3 rounded border border-white/20 bg-ink px-5 py-4 text-sm font-bold text-white shadow-2xl">
            <LoaderCircle className="animate-spin" size={20} />
            Procesando usuarios...
          </div>
        </div>
      ) : null}
    </section>
  );
}
