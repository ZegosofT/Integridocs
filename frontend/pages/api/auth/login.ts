// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();

    // Transmettre les cookies du backend vers le navigateur
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) res.setHeader("Set-Cookie", setCookie);

    res.status(upstream.status).json(data);
  } catch {
    res.status(502).json({ detail: "Erreur de connexion au serveur" });
  }
}
