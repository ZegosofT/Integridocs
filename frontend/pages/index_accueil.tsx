import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Client {
  id: number;
  nom: string;
  telephone: string;
  contact: string;
}

const Home = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://4.251.143.40:8000/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error(err));
  }, []);

  const filtered = clients.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="accueil-page">

      {/* ── Hero ── */}
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

      {/* ── Barre de recherche ── */}
      <div className="accueil-recherche">
        <input
          type="text"
          className="recherche-input"
          placeholder="🔍  Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Tableau clients ── */}
      <div className="tous-clients-bloc">
        {filtered.length === 0 ? (
          <p className="liste-vide">Aucun client trouvé pour &quot;{search}&quot;</p>
        ) : (
          <table className="tous-clients-table">
            <thead>
              <tr>
                <th>Nom du client</th>
                <th>Téléphone</th>
                <th>Contact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id}>
                  <td className="client-nom-cell">{client.nom}</td>
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
