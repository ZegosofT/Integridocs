import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const NouveauClient = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    contact: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.nom.trim()) {
      setError("Le nom du client est obligatoire.");
      return;
    }
    setSaving(true);
    setError("");
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        setSaving(false);
        // Rediriger vers la fiche du nouveau client
        router.push(`/clients/${data.id}`);
      })
      .catch((err) => {
        setSaving(false);
        setError("Erreur lors de la création du client.");
        console.error(err);
      });
  };

  return (
    <div className="client-page">

      <Link href="/" className="retour-lien">← Retour à l&apos;accueil</Link>

      <div className="client-header">
        <h1 className="client-nom">Nouveau client</h1>
        <p className="client-meta">Remplissez les informations de base — vous pourrez compléter la fiche ensuite</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="nouveau-form">

        <div className="section-bloc section-reseau" style={{ marginBottom: 16 }}>
          <div className="section-header">
            <h2 className="section-titre">Informations générales</h2>
          </div>
          <div className="section-body">
            <table className="champs-table">
              <tbody>
                <tr>
                  <td className="champ-label">Nom du client *</td>
                  <td className="champ-valeur">
                    <input
                      className="champ-input"
                      type="text"
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      placeholder="Nom de l'entreprise cliente"
                      autoFocus
                    />
                  </td>
                </tr>
                <tr>
                  <td className="champ-label">Adresse</td>
                  <td className="champ-valeur">
                    <input
                      className="champ-input"
                      type="text"
                      name="adresse"
                      value={form.adresse}
                      onChange={handleChange}
                      placeholder="Adresse complète"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="champ-label">Téléphone</td>
                  <td className="champ-valeur">
                    <input
                      className="champ-input"
                      type="text"
                      name="telephone"
                      value={form.telephone}
                      onChange={handleChange}
                      placeholder="Numéro de téléphone"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="champ-label">Contact</td>
                  <td className="champ-valeur">
                    <input
                      className="champ-input"
                      type="text"
                      name="contact"
                      value={form.contact}
                      onChange={handleChange}
                      placeholder="Nom ou e-mail du contact"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="boutons">
          <button className="btn btn-enregistrer" onClick={handleSubmit} disabled={saving}>
            {saving ? "Création..." : "✅ Créer le client"}
          </button>
          <button className="btn btn-annuler" onClick={() => router.back()}>
            Annuler
          </button>
        </div>

      </div>
    </div>
  );
};

export default NouveauClient;
