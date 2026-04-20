import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8")
);

// Initialize Firebase for Backend
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", backend: "active" });
  });

  // Database Connection Proof / Test
  app.get("/api/db-check", async (req, res) => {
    try {
      const housesCollection = collection(db, "houses");
      const snapshot = await getDocs(housesCollection);
      const houses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      res.json({ 
        status: "connected", 
        houseCount: houses.length,
        message: "Successfully connected to Firestore from backend."
      });
    } catch (error) {
      console.error("Database connection error:", error);
      res.status(500).json({ status: "error", message: "Failed to connect to Firestore." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Backend initialized with static/API routing.`);
  });
}

startServer();
