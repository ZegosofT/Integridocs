import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { jsPDF } from "jspdf";

interface Client {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  contact: string;
  entreprise: string;
  fournisseur_internet: string;
  type_lien: string;
  ip_publique: string;
  routeur: string;
  ip_routeur: string;
  login_routeur: string;
  mot_de_passe_routeur: string;
  plage_dhcp: string;
  vlan_configures: string;
  ssid_wifi: string;
  mot_de_passe_wifi: string;
  vpn_access: string;
  nat_ports: string;
  serveur_nas: string;
  adresse_ip_nas: string;
  login_nas: string;
  mot_de_passe_nas: string;
  sauvegarde_quotidienne: string;
  imprimante_modele: string;
  adresse_ip_imprimante: string;
  login_imprimante: string;
  mot_de_passe_imprimante: string;
  solution_telephonie: string;
  url_telephonie: string;
  nombre_postes_ip: number | string;
  mfa_activee: boolean | string;
  gestion_centralisee: string;
  politique_mot_de_passe: boolean | string;
  sensibilisation_utilisateurs: boolean | string;
  antivirus_centralise: string;
  pra_pca_existant: string;
  plateforme_365: string;
  domaine: string;
  hebergeur_dns: string;
  type_licence: string;
  sauvegarde_365_active: boolean | string;
  notes: string;
}

const SECTIONS = [
  {
    title: "Réseau & Infrastructure", colorClass: "section-reseau",
    fields: [
      { key: "fournisseur_internet",   label: "Fournisseur Internet",   type: "text" },
      { key: "type_lien",              label: "Type de lien",           type: "text" },
      { key: "ip_publique",            label: "IP publique",            type: "text" },
      { key: "routeur",                label: "Routeur",                type: "text" },
      { key: "ip_routeur",             label: "IP routeur",             type: "text" },
      { key: "login_routeur",          label: "Login routeur",          type: "text" },
      { key: "mot_de_passe_routeur",   label: "Mot de passe routeur",   type: "text" },
      { key: "plage_dhcp",             label: "Plage DHCP",             type: "text" },
      { key: "vlan_configures",        label: "VLANs configurés",       type: "text" },
      { key: "ssid_wifi",              label: "SSID WiFi",              type: "text" },
      { key: "mot_de_passe_wifi",      label: "Mot de passe WiFi",      type: "text" },
      { key: "vpn_access",             label: "Accès VPN",              type: "text" },
      { key: "nat_ports",              label: "Ports NAT",              type: "text" },
    ],
  },
  {
    title: "Serveurs & Stockage", colorClass: "section-serveurs",
    fields: [
      { key: "serveur_nas",            label: "Serveur / NAS",          type: "text" },
      { key: "adresse_ip_nas",         label: "IP NAS",                 type: "text" },
      { key: "login_nas",              label: "Login NAS",              type: "text" },
      { key: "mot_de_passe_nas",       label: "Mot de passe NAS",       type: "text" },
      { key: "sauvegarde_quotidienne", label: "Sauvegarde quotidienne", type: "text" },
    ],
  },
  {
    title: "Périphériques", colorClass: "section-peripheriques",
    fields: [
      { key: "imprimante_modele",       label: "Modèle imprimante",       type: "text" },
      { key: "adresse_ip_imprimante",   label: "IP imprimante",           type: "text" },
      { key: "login_imprimante",        label: "Login imprimante",        type: "text" },
      { key: "mot_de_passe_imprimante", label: "Mot de passe imprimante", type: "text" },
    ],
  },
  {
    title: "Téléphonie", colorClass: "section-telephonie",
    fields: [
      { key: "solution_telephonie", label: "Solution téléphonie", type: "text"   },
      { key: "url_telephonie",      label: "URL téléphonie",      type: "text"   },
      { key: "nombre_postes_ip",    label: "Nombre de postes IP", type: "number" },
    ],
  },
  {
    title: "Sécurité", colorClass: "section-securite",
    fields: [
      { key: "mfa_activee",                  label: "MFA activée",                  type: "bool" },
      { key: "gestion_centralisee",          label: "Gestion centralisée",          type: "text" },
      { key: "politique_mot_de_passe",       label: "Politique mot de passe",       type: "bool" },
      { key: "sensibilisation_utilisateurs", label: "Sensibilisation utilisateurs", type: "bool" },
      { key: "antivirus_centralise",         label: "Antivirus centralisé",         type: "text" },
      { key: "pra_pca_existant",             label: "PRA / PCA existant",           type: "text" },
    ],
  },
  {
    title: "Cloud & Messagerie", colorClass: "section-cloud",
    fields: [
      { key: "plateforme_365",        label: "Plateforme 365",        type: "text" },
      { key: "domaine",               label: "Domaine",               type: "text" },
      { key: "hebergeur_dns",         label: "Hébergeur DNS",         type: "text" },
      { key: "type_licence",          label: "Type de licence",       type: "text" },
      { key: "sauvegarde_365_active", label: "Sauvegarde 365 active", type: "bool" },
    ],
  },
];

function hasValue(val: unknown): boolean {
  return val !== null && val !== undefined && val !== "";
}

function displayBool(val: unknown): string {
  if (val === true || val === 1 || val === "1" || val === "true") return "✅ Oui";
  if (val === false || val === 0 || val === "0" || val === "false") return "❌ Non";
  return "—";
}

const ClientDetails = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetch(`http://10.10.0.1:8000/clients/${id}`)
        .then((res) => res.json())
        .then((data) => setClient(data))
        .catch((err) => console.error(err));
    }
  }, [id]);

  if (!client) return <p className="chargement">Chargement...</p>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClient((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSave = () => {
    if (!client) return;
    setSaving(true);
    setSaveMsg("");
    fetch(`http://10.10.0.1:8000/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    })
      .then((res) => res.json())
      .then(() => {
        setSaving(false);
        setSaveMsg("success");
        setIsEditing(false);
      })
      .catch((err) => {
        setSaving(false);
        setSaveMsg("error");
        console.error(err);
      });
  };

  const handleDelete = () => {
    fetch(`http://10.10.0.1:8000/clients/${client.id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => router.push("/"))
      .catch((err) => console.error(err));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    // ── En-tête ──────────────────────────────────────
    doc.setFillColor(27, 42, 74);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("INTEGRIDOCS – Fiche client", 10, 14);
    y = 30;

    // ── Infos de base ────────────────────────────────
    doc.setFontSize(13);
    doc.setTextColor(27, 42, 74);
    doc.setFont("helvetica", "bold");
    doc.text(client.nom, 10, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const meta = [client.adresse, client.telephone, client.contact].filter(Boolean).join("  ·  ");
    doc.text(meta, 10, y);
    y += 4;
    doc.setDrawColor(0, 200, 150);
    doc.setLineWidth(0.5);
    doc.line(10, y, pageW - 10, y);
    y += 6;

    // ── Notes libres ─────────────────────────────────
    if (client.notes && client.notes.trim()) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("Notes libres", 10, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const cleanNotes = client.notes.replace(/→/g, '->').replace(/·/g, '-').replace(/[]/g, '"').replace(/['']/g, "'");
      const noteLines = doc.splitTextToSize(cleanNotes, pageW - 20);
      doc.text(noteLines, 10, y);
      y += noteLines.length * 5 + 4;
    }

    // ── Sections ─────────────────────────────────────
    const SECTION_COLORS: Record<string, [number,number,number]> = {
      "Réseau & Infrastructure": [46, 95, 163],
      "Serveurs & Stockage":     [39, 174, 96],
      "Périphériques":           [142, 68, 173],
      "Téléphonie":              [243, 156, 18],
      "Sécurité":                [232, 76, 106],
      "Cloud & Messagerie":      [0, 180, 216],
    };

    SECTIONS.forEach((section) => {
      // Garder uniquement les champs non vides
      const filledFields = section.fields.filter((f) => {
        const val = (client as never)[f.key];
        return val !== null && val !== undefined && val !== "";
      });
      if (filledFields.length === 0) return;

      // Vérifier si on a besoin d'une nouvelle page
      if (y > 250) { doc.addPage(); y = 15; }

      // Header section
      const [r, g, b] = SECTION_COLORS[section.title] || [70, 70, 70];
      doc.setFillColor(r, g, b);
      doc.rect(10, y, pageW - 20, 7, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(section.title.toUpperCase(), 13, y + 5);
      y += 10;

      // Lignes de champs
      filledFields.forEach((field) => {
        if (y > 270) { doc.addPage(); y = 15; }
        const val = (client as never)[field.key];
        let displayVal = "";
        if (field.type === "bool") {
          displayVal = (val === true || val === 1 || val === "1" || val === "true") ? "Oui" : "Non";
        } else {
          // Remplacer les caractères Unicode non supportés par Helvetica
          displayVal = String(val)
            .replace(/→/g, "->")
            .replace(/←/g, "<-")
            .replace(/·/g, "-")
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'");
        }

        // Fond alterné
        doc.setFillColor(245, 247, 250);
        doc.rect(10, y - 4, pageW - 20, 6, "F");

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);
        doc.text(field.label, 13, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        const valLines = doc.splitTextToSize(displayVal, pageW - 90);
        doc.text(valLines, 85, y);
        y += valLines.length > 1 ? valLines.length * 4.5 + 1 : 6;
      });
      y += 4;
    });

    // ── Pied de page ─────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      const date = new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" });
      doc.text(`Integritech SAS · Integridocs · Exporté le ${date}`, 10, 290);
      doc.text(`Page ${i}/${totalPages}`, pageW - 25, 290);
    }

    doc.save(`fiche_${client.nom.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="client-page">

      <Link href="/" className="retour-lien">← Retour à l&apos;accueil</Link>

      <div className="client-header">
        <h1 className="client-nom">{client.nom}</h1>
        <p className="client-meta">
          {client.adresse} · {client.telephone} · {client.contact}
        </p>
      </div>

      {saveMsg === "success" && <div className="alert alert-success">✅ Données sauvegardées avec succès.</div>}
      {saveMsg === "error"   && <div className="alert alert-error">❌ Erreur lors de la sauvegarde.</div>}

      {/* ── Boutons action ── */}
      <div className="boutons">
        {!isEditing ? (
          <>
            <button className="btn btn-modifier" onClick={() => { setIsEditing(true); setSaveMsg(""); }}>
              ✏️ Modifier
            </button>
            {!confirmDelete ? (
              <button className="btn btn-supprimer" onClick={() => setConfirmDelete(true)}>
                🗑 Supprimer
              </button>
            ) : (
              <>
                <span className="confirm-texte">Confirmer la suppression ?</span>
                <button className="btn btn-confirmer-suppr" onClick={handleDelete}>
                  Oui, supprimer
                </button>
                <button className="btn btn-annuler" onClick={() => setConfirmDelete(false)}>
                  Annuler
                </button>
              </>
            )}
            <button className="btn btn-pdf" onClick={handleExportPDF}>
              📄 Export PDF
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-enregistrer" onClick={handleSave} disabled={saving}>
              {saving ? "Sauvegarde..." : "💾 Enregistrer"}
            </button>
            <button className="btn btn-annuler" onClick={() => { setIsEditing(false); setSaveMsg(""); }}>
              Annuler
            </button>
          </>
        )}
      </div>

      {/* ── Notes libres : visible si rempli ou en mode édition ── */}
      {(isEditing || (client.notes && client.notes.trim() !== "")) && (
        <div className="section-bloc section-notes">
          <div className="section-header">
            <h2 className="section-titre">Notes libres</h2>
          </div>
          <div className="section-body">
            <table className="champs-table">
              <tbody>
                <tr>
                  <td className="champ-valeur notes-cell">
                    {isEditing ? (
                      <textarea
                        className="champ-textarea"
                        name="notes"
                        value={client.notes ?? ""}
                        onChange={(e) => setClient((prev) => prev ? { ...prev, notes: e.target.value } : prev)}
                        placeholder="Notes libres, remarques, informations supplémentaires..."
                        rows={4}
                      />
                    ) : (
                      <span className="notes-lecture">{client.notes}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      {SECTIONS.map((section) => {
        const visibleFields = isEditing
          ? section.fields
          : section.fields.filter((f) => hasValue((client as never)[f.key]));

        if (!isEditing && visibleFields.length === 0) return null;

        return (
          <div key={section.title} className={`section-bloc ${section.colorClass}`}>
            <div className="section-header">
              <h2 className="section-titre">{section.title}</h2>
            </div>
            <div className="section-body">
              <table className="champs-table">
                <tbody>
                  {visibleFields.map((field) => {
                    const value = (client as never)[field.key];
                    return (
                      <tr key={field.key}>
                        <td className="champ-label">{field.label}</td>
                        <td className="champ-valeur">
                          {isEditing ? (
                            field.type === "bool" ? (
                              <select className="champ-input" name={field.key} value={String(value ?? "")} onChange={handleChange}>
                                <option value="">— Non renseigné —</option>
                                <option value="1">Oui</option>
                                <option value="0">Non</option>
                              </select>
                            ) : (
                              <input
                                className="champ-input"
                                type={field.type === "number" ? "number" : "text"}
                                name={field.key}
                                value={value ?? ""}
                                onChange={handleChange}
                                placeholder={field.label}
                              />
                            )
                          ) : (
                            field.type === "bool" ? displayBool(value) : String(value)
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientDetails;
