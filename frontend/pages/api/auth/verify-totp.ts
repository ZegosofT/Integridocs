// pages/api/auth/verify-totp.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Transmettre les cookies du navigateur vers le backend FastAPI
  const cookies = req.headers.cookie || "";

  try {
    const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/verify-totp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookies,
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();

    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) res.setHeader("Set-Cookie", setCookie);

    res.status(upstream.status).json(data);
  } catch {
    res.status(502).json({ detail: "Erreur de connexion au serveur" });
  }
}
