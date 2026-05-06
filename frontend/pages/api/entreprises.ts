// pages/api/entreprises.ts
import type { NextApiRequest, NextApiResponse } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const upstream = await fetch(`${API}/entreprises`, {
      headers: { Cookie: req.headers.cookie || "" },
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch {
    res.status(502).json({ detail: "Erreur de connexion au serveur" });
  }
}
