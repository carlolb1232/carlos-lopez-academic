"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const sessionKey = "carlos-academic-visit-recorded";

export function VisitCounter() {
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    async function loadVisits() {
      const alreadyRecorded = sessionStorage.getItem(sessionKey) === "true";
      const functionName = alreadyRecorded
        ? "get_page_visit_count"
        : "record_page_visit";
      const { data, error } = await client.rpc(functionName);
      const total = typeof data === "number" ? data : Number(data);

      if (!error && Number.isFinite(total)) {
        setVisits(total);
        if (!alreadyRecorded) sessionStorage.setItem(sessionKey, "true");
      }
    }

    void loadVisits();
  }, []);

  if (visits === null) return null;

  return (
    <span
      className="inline-flex items-center gap-2 text-xs font-medium text-white/48"
      title="Total de sesiones registradas en el sitio"
    >
      <Eye size={14} />
      {new Intl.NumberFormat("es-PE").format(visits)}{" "}
      {visits === 1 ? "visita" : "visitas"}
    </span>
  );
}
