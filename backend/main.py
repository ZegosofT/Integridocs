from fastapi import FastAPI, HTTPException
import pymysql
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        connection = pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Erreur connexion MySQL: {e}")


# ── Fonction d'insertion de log ──────────────────────────
def insert_log(cursor, action: str, description: str, client_nom: str = None, client_id: int = None):
    # Insérer le nouveau log
    cursor.execute("""
        INSERT INTO logs (action, description, client_nom, client_id)
        VALUES (%s, %s, %s, %s)
    """, (action, description, client_nom, client_id))

    # Supprimer automatiquement les logs de plus de 90 jours
    cursor.execute("""
        DELETE FROM logs
        WHERE created_at < NOW() - INTERVAL 90 DAY
    """)

@app.get("/")
def root():
    return {"status": "Backend FastAPI + MySQL OK"}

@app.get("/entreprises")
def get_entreprises():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM entreprises")
            return cursor.fetchall()
    finally:
        connection.close()

@app.get("/clients")
def get_clients():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT
                clients.id,
                clients.nom,
                clients.adresse,
                clients.telephone,
                clients.contact,
                clients.entreprise_id,
                clients.created_at,
                entreprises.nom AS entreprise
            FROM clients
            JOIN entreprises ON clients.entreprise_id = entreprises.id
            """
            cursor.execute(query)
            return cursor.fetchall()
    finally:
        connection.close()

@app.get("/companies/{company_id}/clients")
def get_clients_by_company(company_id: int):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT
                clients.id,
                clients.nom,
                clients.adresse,
                clients.telephone,
                clients.contact,
                entreprises.nom AS entreprise
            FROM clients
            JOIN entreprises ON clients.entreprise_id = entreprises.id
            WHERE clients.entreprise_id = %s
            """
            cursor.execute(query, (company_id,))
            return cursor.fetchall()
    finally:
        connection.close()

@app.get("/clients/{client_id}")
def get_client_details(client_id: int):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT
                clients.id,
                clients.nom,
                clients.adresse,
                clients.telephone,
                clients.contact,
                clients.notes,
                entreprises.nom AS entreprise,
                network_infrastructure.fournisseur_internet,
                network_infrastructure.type_lien,
                network_infrastructure.ip_publique,
                network_infrastructure.routeur,
                network_infrastructure.ip_routeur,
                network_infrastructure.login_routeur,
                network_infrastructure.mot_de_passe_routeur,
                network_infrastructure.plage_dhcp,
                network_infrastructure.vlan_configures,
                network_infrastructure.ssid_wifi,
                network_infrastructure.mot_de_passe_wifi,
                network_infrastructure.vpn_access,
                network_infrastructure.nat_ports,
                servers_and_storage.serveur_nas,
                servers_and_storage.adresse_ip_nas,
                servers_and_storage.login_nas,
                servers_and_storage.mot_de_passe_nas,
                servers_and_storage.sauvegarde_quotidienne,
                peripherals.imprimante_modele,
                peripherals.adresse_ip_imprimante,
                peripherals.login_imprimante,
                peripherals.mot_de_passe_imprimante,
                telephony.solution_telephonie,
                telephony.url_telephonie,
                telephony.nombre_postes_ip,
                security_organization.mfa_activee,
                security_organization.gestion_centralisee,
                security_organization.politique_mot_de_passe,
                security_organization.sensibilisation_utilisateurs,
                security_organization.antivirus_centralise,
                security_organization.pra_pca_existant,
                cloud_and_messaging.plateforme_365,
                cloud_and_messaging.domaine,
                cloud_and_messaging.hebergeur_dns,
                cloud_and_messaging.type_licence,
                cloud_and_messaging.sauvegarde_365_active
            FROM clients
            LEFT JOIN entreprises ON clients.entreprise_id = entreprises.id
            LEFT JOIN network_infrastructure ON clients.id = network_infrastructure.client_id
            LEFT JOIN servers_and_storage ON clients.id = servers_and_storage.client_id
            LEFT JOIN peripherals ON clients.id = peripherals.client_id
            LEFT JOIN telephony ON clients.id = telephony.client_id
            LEFT JOIN security_organization ON clients.id = security_organization.client_id
            LEFT JOIN cloud_and_messaging ON clients.id = cloud_and_messaging.client_id
            WHERE clients.id = %s
            """
            cursor.execute(query, (client_id,))
            return cursor.fetchone()
    finally:
        connection.close()


# ── GET /logs – Récupérer les logs avec pagination ───────
@app.get("/logs")
def get_logs(page: int = 1, limit: int = 50):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Compter le total pour calculer le nombre de pages
            cursor.execute("SELECT COUNT(*) as total FROM logs")
            total = cursor.fetchone()["total"]

            # Calculer l'offset : page 1 = offset 0, page 2 = offset 50, etc.
            offset = (page - 1) * limit

            cursor.execute("""
                SELECT id, action, description, client_nom, client_id, created_at
                FROM logs
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))

            return {
                "logs": cursor.fetchall(),
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
    finally:
        connection.close()

# ── POST /clients – Créer un nouveau client ──────────────
@app.post("/clients")
def create_client(client_data: dict):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # 1. Créer une entreprise avec le même nom
            cursor.execute("""
                INSERT INTO entreprises (nom, adresse, telephone, contact)
                VALUES (%s, %s, %s, %s)
            """, (
                client_data.get("nom"),
                client_data.get("adresse", ""),
                client_data.get("telephone", ""),
                client_data.get("contact", ""),
            ))
            entreprise_id = cursor.lastrowid

            # 2. Créer le client lié à cette entreprise
            cursor.execute("""
                INSERT INTO clients (nom, adresse, telephone, contact, entreprise_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                client_data.get("nom"),
                client_data.get("adresse", ""),
                client_data.get("telephone", ""),
                client_data.get("contact", ""),
                entreprise_id,
            ))
            client_id = cursor.lastrowid

            # Log création
            insert_log(cursor, "CRÉATION", f"Nouveau client créé : {client_data.get('nom')}", client_data.get('nom'), client_id)

            connection.commit()
            return {"message": "Client créé avec succès", "id": client_id}

    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur MySQL: {e}")
    finally:
        connection.close()

# ── DELETE /clients/{id} – Supprimer un client ───────────
@app.delete("/clients/{client_id}")
def delete_client(client_id: int):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Récupérer le nom et l'entreprise_id avant suppression
            cursor.execute("SELECT nom, entreprise_id FROM clients WHERE id = %s", (client_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Client non trouvé")
            entreprise_id = row["entreprise_id"]
            client_nom = row["nom"]

            # Supprimer d'abord toutes les tables liées (FK sans CASCADE)
            for table in [
                "network_infrastructure",
                "servers_and_storage",
                "peripherals",
                "telephony",
                "security_organization",
                "cloud_and_messaging",
            ]:
                cursor.execute(f"DELETE FROM {table} WHERE client_id = %s", (client_id,))

            # Supprimer le client
            cursor.execute("DELETE FROM clients WHERE id = %s", (client_id,))

            # Supprimer l'entreprise liée si elle n'a plus d'autres clients
            cursor.execute("SELECT COUNT(*) as nb FROM clients WHERE entreprise_id = %s", (entreprise_id,))
            count = cursor.fetchone()["nb"]
            if count == 0:
                cursor.execute("DELETE FROM entreprises WHERE id = %s", (entreprise_id,))

            # Log suppression
            insert_log(cursor, "SUPPRESSION", f"Client supprimé : {client_nom} (ID: {client_id})", client_nom, client_id)

            connection.commit()
            return {"message": "Client supprimé avec succès"}

    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur MySQL: {e}")
    finally:
        connection.close()

# ── PUT /clients/{id} – Mettre à jour un client ──────────
@app.put("/clients/{client_id}")
def update_client(client_id: int, client_data: dict):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:

            # 1. TABLE clients
            cursor.execute("""
                UPDATE clients
                SET nom = %s, adresse = %s, telephone = %s, contact = %s, notes = %s
                WHERE id = %s
            """, (
                client_data.get('nom'),
                client_data.get('adresse'),
                client_data.get('telephone'),
                client_data.get('contact'),
                client_data.get('notes'),
                client_id
            ))

            # 2. TABLE network_infrastructure
            cursor.execute("""
                INSERT INTO network_infrastructure
                    (client_id, fournisseur_internet, type_lien, ip_publique, routeur,
                     ip_routeur, login_routeur, mot_de_passe_routeur, plage_dhcp,
                     vlan_configures, ssid_wifi, mot_de_passe_wifi, vpn_access, nat_ports)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    fournisseur_internet   = VALUES(fournisseur_internet),
                    type_lien              = VALUES(type_lien),
                    ip_publique            = VALUES(ip_publique),
                    routeur                = VALUES(routeur),
                    ip_routeur             = VALUES(ip_routeur),
                    login_routeur          = VALUES(login_routeur),
                    mot_de_passe_routeur   = VALUES(mot_de_passe_routeur),
                    plage_dhcp             = VALUES(plage_dhcp),
                    vlan_configures        = VALUES(vlan_configures),
                    ssid_wifi              = VALUES(ssid_wifi),
                    mot_de_passe_wifi      = VALUES(mot_de_passe_wifi),
                    vpn_access             = VALUES(vpn_access),
                    nat_ports              = VALUES(nat_ports)
            """, (
                client_id,
                client_data.get('fournisseur_internet'),
                client_data.get('type_lien'),
                client_data.get('ip_publique'),
                client_data.get('routeur'),
                client_data.get('ip_routeur'),
                client_data.get('login_routeur'),
                client_data.get('mot_de_passe_routeur'),
                client_data.get('plage_dhcp'),
                client_data.get('vlan_configures'),
                client_data.get('ssid_wifi'),
                client_data.get('mot_de_passe_wifi'),
                client_data.get('vpn_access'),
                client_data.get('nat_ports'),
            ))

            # 3. TABLE servers_and_storage
            cursor.execute("""
                INSERT INTO servers_and_storage
                    (client_id, serveur_nas, adresse_ip_nas, login_nas,
                     mot_de_passe_nas, sauvegarde_quotidienne)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    serveur_nas            = VALUES(serveur_nas),
                    adresse_ip_nas         = VALUES(adresse_ip_nas),
                    login_nas              = VALUES(login_nas),
                    mot_de_passe_nas       = VALUES(mot_de_passe_nas),
                    sauvegarde_quotidienne = VALUES(sauvegarde_quotidienne)
            """, (
                client_id,
                client_data.get('serveur_nas'),
                client_data.get('adresse_ip_nas'),
                client_data.get('login_nas'),
                client_data.get('mot_de_passe_nas'),
                client_data.get('sauvegarde_quotidienne'),
            ))

            # 4. TABLE peripherals
            cursor.execute("""
                INSERT INTO peripherals
                    (client_id, imprimante_modele, adresse_ip_imprimante,
                     login_imprimante, mot_de_passe_imprimante)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    imprimante_modele       = VALUES(imprimante_modele),
                    adresse_ip_imprimante   = VALUES(adresse_ip_imprimante),
                    login_imprimante        = VALUES(login_imprimante),
                    mot_de_passe_imprimante = VALUES(mot_de_passe_imprimante)
            """, (
                client_id,
                client_data.get('imprimante_modele'),
                client_data.get('adresse_ip_imprimante'),
                client_data.get('login_imprimante'),
                client_data.get('mot_de_passe_imprimante'),
            ))

            # 5. TABLE telephony
            cursor.execute("""
                INSERT INTO telephony
                    (client_id, solution_telephonie, url_telephonie, nombre_postes_ip)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    solution_telephonie = VALUES(solution_telephonie),
                    url_telephonie      = VALUES(url_telephonie),
                    nombre_postes_ip    = VALUES(nombre_postes_ip)
            """, (
                client_id,
                client_data.get('solution_telephonie'),
                client_data.get('url_telephonie'),
                client_data.get('nombre_postes_ip'),
            ))

            # 6. TABLE security_organization
            cursor.execute("""
                INSERT INTO security_organization
                    (client_id, mfa_activee, gestion_centralisee, politique_mot_de_passe,
                     sensibilisation_utilisateurs, antivirus_centralise, pra_pca_existant)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    mfa_activee                  = VALUES(mfa_activee),
                    gestion_centralisee          = VALUES(gestion_centralisee),
                    politique_mot_de_passe       = VALUES(politique_mot_de_passe),
                    sensibilisation_utilisateurs = VALUES(sensibilisation_utilisateurs),
                    antivirus_centralise         = VALUES(antivirus_centralise),
                    pra_pca_existant             = VALUES(pra_pca_existant)
            """, (
                client_id,
                client_data.get('mfa_activee'),
                client_data.get('gestion_centralisee'),
                client_data.get('politique_mot_de_passe'),
                client_data.get('sensibilisation_utilisateurs'),
                client_data.get('antivirus_centralise'),
                client_data.get('pra_pca_existant'),
            ))

            # 7. TABLE cloud_and_messaging
            cursor.execute("""
                INSERT INTO cloud_and_messaging
                    (client_id, plateforme_365, domaine, hebergeur_dns,
                     type_licence, sauvegarde_365_active)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    plateforme_365        = VALUES(plateforme_365),
                    domaine               = VALUES(domaine),
                    hebergeur_dns         = VALUES(hebergeur_dns),
                    type_licence          = VALUES(type_licence),
                    sauvegarde_365_active = VALUES(sauvegarde_365_active)
            """, (
                client_id,
                client_data.get('plateforme_365'),
                client_data.get('domaine'),
                client_data.get('hebergeur_dns'),
                client_data.get('type_licence'),
                client_data.get('sauvegarde_365_active'),
            ))

            # Log modification
            insert_log(cursor, "MODIFICATION", f"Fiche client mise à jour : {client_data.get('nom')}", client_data.get('nom'), client_id)

            connection.commit()
            return {"message": "Client mis à jour avec succès"}

    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur MySQL: {e}")
    finally:
        connection.close()
