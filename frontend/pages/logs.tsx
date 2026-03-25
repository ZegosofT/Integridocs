import { useEffect, useState } from "react";

interface Log {
  id: number;
  action: string;
  description: string;
  client_nom: string | null;
  client_id: number | null;
  created_at: string;
}

interface LogsResponse {
  logs: Log[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const ACTION_COLORS: Record<string, string> = {
  "CRÉATION":     "log-creation",
  "MODIFICATION": "log-modification",
  "SUPPRESSION":  "log-suppression",
};

const ACTION_ICONS: Record<string, string> = {
  "CRÉATION":     "✅",
  "MODIFICATION": "✏️",
  "SUPPRESSION":  "🗑",
};

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) + " à " + d.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

const Logs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("TOUS");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  const fetchLogs = (currentPage: number) => {
    setLoading(true);
    fetch(`http://10.10.0.1:8000/logs?page=${currentPage}&limit=${LIMIT}`)
      .then((res) => res.json())
      .then((data: LogsResponse) => {
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const filtered = filter === "TOUS"
    ? logs
    : logs.filter((l) => l.action === filter);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    setFilter("TOUS"); // reset filtre au changement de page
  };

  return (
    <div className="logs-page">

      <div className="logs-header">
        <h1 className="logs-titre">Journal des activités</h1>
        <p className="logs-description">
          {total} entrée{total > 1 ? "s" : ""} au total · rétention 90 jours · page {page}/{totalPages}
        </p>
      </div>

      {/* ── Filtres + refresh ── */}
      <div className="logs-toolbar">
        <div className="logs-filtres">
          {["TOUS", "CRÉATION", "MODIFICATION", "SUPPRESSION"].map((f) => (
            <button
              key={f}
              className={`logs-filtre-btn ${filter === f ? "logs-filtre-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f !== "TOUS" && ACTION_ICONS[f] + " "}{f}
            </button>
          ))}
        </div>
        <button className="logs-refresh-btn" onClick={() => fetchLogs(page)}>
          ↻ Actualiser
        </button>
      </div>

      {/* ── Table des logs ── */}
      <div className="logs-bloc">
        {loading ? (
          <p className="liste-vide">Chargement...</p>
        ) : filtered.length === 0 ? (
          <p className="liste-vide">Aucun log pour le moment.</p>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th>Date & heure</th>
                <th>Action</th>
                <th>Description</th>
                <th>Client</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="logs-row">
                  <td className="log-date">{formatDateTime(log.created_at)}</td>
                  <td>
                    <span className={`log-badge ${ACTION_COLORS[log.action] || ""}`}>
                      {ACTION_ICONS[log.action] || ""} {log.action}
                    </span>
                  </td>
                  <td className="log-desc">{log.description}</td>
                  <td className="log-client">
                    {log.client_nom || (log.client_id ? `#${log.client_id}` : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="logs-pagination">
          <button
            className="logs-page-btn"
            onClick={() => goToPage(1)}
            disabled={page === 1}
          >
            «
          </button>
          <button
            className="logs-page-btn"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
          >
            ‹ Précédent
          </button>

          {/* Numéros de pages autour de la page courante */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | string)[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="logs-page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`logs-page-btn ${page === p ? "logs-page-active" : ""}`}
                  onClick={() => goToPage(p as number)}
                >
                  {p}
                </button>
              )
            )}

          <button
            className="logs-page-btn"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
          >
            Suivant ›
          </button>
          <button
            className="logs-page-btn"
            onClick={() => goToPage(totalPages)}
            disabled={page === totalPages}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
};

export default Logs;
