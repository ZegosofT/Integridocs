import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

interface Client {
  id: number;
  nom: string;
  telephone: string;
  contact: string;
  created_at: string;
}

type SortKey = "nom" | "created_at";
type SortDir = "asc" | "desc";

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const Home = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const router = useRouter();

  useEffect(() => {
    fetch("http://4.251.143.40:8000/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const filtered = clients
    .filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortKey === "nom") {
        valA = a.nom.toLowerCase();
        valB = b.nom.toLowerCase();
      } else {
        // Tri par date
        valA = a.created_at ? new Date(a.created_at).getTime() : 0;
        valB = b.created_at ? new Date(b.created_at).getTime() : 0;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="accueil-page">

      <div className="accueil-hero">
        <div className="accueil-logo">
          <Image
            src="/INTEGRITECH_Services_et_Solutions.png"
            alt="Integritech Services & Solutions"
            width={180}
            height={55}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <h1 className="accueil-titre">INTEGRIDOCS</h1>
        <p className="accueil-description">
          Plateforme de gestion centralisée des clients et infrastructures IT — Integritech SAS
        </p>
      </div>

      <div className="accueil-toolbar">
        <input
          type="text"
          className="recherche-input"
          placeholder="🔍  Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="tous-clients-bloc">
        {filtered.length === 0 ? (
          <p className="liste-vide">Aucun client trouvé pour &quot;{search}&quot;</p>
        ) : (
          <table className="tous-clients-table">
            <thead>
              <tr>
                <th
                  className={`th-sortable ${sortKey === "nom" ? "th-active" : ""}`}
                  onClick={() => handleSort("nom")}
                >
                  Nom du client{getSortIcon("nom")}
                </th>
                <th
                  className={`th-sortable ${sortKey === "created_at" ? "th-active" : ""}`}
                  onClick={() => handleSort("created_at")}
                >
                  Date d&apos;ajout{getSortIcon("created_at")}
                </th>
                <th>Téléphone</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="client-row-clickable"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <td className="client-nom-cell">{client.nom}</td>
                  <td className="client-date-cell">{formatDate(client.created_at)}</td>
                  <td>{client.telephone}</td>
                  <td>{client.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 0 && (
          <p className="clients-count">
            {filtered.length} client{filtered.length > 1 ? "s" : ""}
            {search && ` pour "${search}"`}
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;
