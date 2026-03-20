import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  id: number;
  nom: string;
  entreprise: string;
  adresse: string;
  telephone: string;
  contact: string;
}

const TousLesClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://4.251.143.40:8000/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error(err));
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.entreprise?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="accueil-page">

      {/* ── Navigation retour ── */}
      <Link href="/" className="retour-lien">← Retour à l&apos;accueil</Link>

      {/* ── Titre ── */}
      <div className="accueil-hero">
        <h1 className="accueil-titre">Tous les clients</h1>
        <p className="accueil-description">
          {clients.length} clients au total — recherche par nom ou entreprise
        </p>
      </div>

      {/* ── Barre de recherche ── */}
      <div className="accueil-recherche">
        <input
          type="text"
          className="recherche-input"
          placeholder="🔍  Rechercher un client ou une entreprise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Tableau des clients ── */}
      <div className="tous-clients-bloc">
        {filtered.length === 0 ? (
          <p className="liste-vide">Aucun client trouvé pour &quot;{search}&quot;</p>
        ) : (
          <table className="tous-clients-table">
            <thead>
              <tr>
                <th>Nom du client</th>
                <th>Entreprise</th>
                <th>Téléphone</th>
                <th>Contact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id}>
                  <td className="client-nom-cell">{client.nom}</td>
                  <td className="client-entreprise-cell">{client.entreprise}</td>
                  <td>{client.telephone}</td>
                  <td>{client.contact}</td>
                  <td>
                    <Link href={`/clients/${client.id}`} className="client-voir-btn">
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 0 && (
          <p className="clients-count">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</p>
        )}
      </div>
    </div>
  );
};

export default TousLesClients;
