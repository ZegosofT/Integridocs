#!/usr/bin/env python3
"""
Créer un nouvel utilisateur Integridocs.
Usage : python3 create_user.py
"""

import bcrypt
import pyotp
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def get_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor
    )

def create_user():
    print("\n=== Créer un nouvel utilisateur Integridocs ===\n")

    nom      = input("Nom complet       : ").strip()
    email    = input("Email             : ").strip().lower()
    password = input("Mot de passe      : ").strip()

    if not nom or not email or not password:
        print("❌ Tous les champs sont obligatoires.")
        return

    # Hash du mot de passe
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    # Génération du secret TOTP
    totp_secret = pyotp.random_base32()
    totp_uri    = pyotp.totp.TOTP(totp_secret).provisioning_uri(
        name=email,
        issuer_name="Integridocs"
    )

    # Insertion en base
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO users (nom, email, password_hash, totp_secret) VALUES (%s, %s, %s, %s)",
                (nom, email, password_hash, totp_secret)
            )
        conn.commit()
        print(f"\n✅ Utilisateur '{nom}' créé avec succès !")
        print(f"\n📱 Secret TOTP    : {totp_secret}")
        print(f"🔗 URI TOTP       : {totp_uri}")
        print(f"\n⚠️  Scannez ce QR code ou entrez le secret manuellement dans Google Authenticator.")
        print(f"   Générez le QR sur https://www.qrcode-monkey.com (onglet 'Text')")
    except pymysql.err.IntegrityError:
        print(f"❌ Un utilisateur avec l'email '{email}' existe déjà.")
    finally:
        conn.close()

if __name__ == "__main__":
    create_user()
