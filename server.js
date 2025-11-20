import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3001;
const POLL_INTERVAL = 2000;

const SYMBOLS = {
  SPX: "^SPX",
  DJI: "^DJI",
  NDX: "^NDX",
  FTSE: "^FTSE",
  DAX: "^DAX",
  FCHI: "^CAC",
  NKY: "^NKX",
  EURUSD: "EURUSD",
  GBPUSD: "GBPUSD",
  USDJPY: "USDJPY",
  AUDUSD: "AUDUSD",
  USDCAD: "USDCAD",
  GOLD: "GC.F"
};

let prices = {};

async function pollPrices() {
  try {
    for (const [key, symbol] of Object.entries(SYMBOLS)) {
      const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=csv`;
      const res = await fetch(url);
      const text = await res.text();
      const line = text.split("\n")[1];
      const parts = line.split(",");
      const last = parseFloat(parts[6]);
      if (!isNaN(last)) prices[key] = last;
    }
    io.emit("prices", prices);
    console.log(`🟢 Données mises à jour (${Object.keys(prices).length} actifs) — ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.log("⚠️ Erreur Stooq :", err.message);
  }
}

setInterval(pollPrices, POLL_INTERVAL);
pollPrices();

app.get("/", (req, res) => res.send("✅ Serveur AmA Broker en ligne"));
io.on("connection", s => {
  console.log("🟩 Client connecté :", s.id);
  s.emit("prices", prices);
  s.on("disconnect", () => console.log("🟥 Client déconnecté :", s.id));
});

server.listen(PORT, () => console.log(`🚀 Serveur AmA Broker lancé sur le port ${PORT}`));

