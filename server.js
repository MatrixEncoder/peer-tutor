require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const { initDatabase } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (in-memory store for prototype)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "peer-tutor-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    },
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ─── API Routes ───────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const tutorRoutes = require("./routes/tutors");
const sessionRoutes = require("./routes/sessions");
const availabilityRoutes = require("./routes/availability");
const reviewRoutes = require("./routes/reviews");

app.use("/api", authRoutes);
app.use("/api", tutorRoutes);
app.use("/api", sessionRoutes);
app.use("/api", availabilityRoutes);
app.use("/api", reviewRoutes);

// ─── Page Routes ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));
app.get("/tutors", (req, res) => res.sendFile(path.join(__dirname, "public", "tutors.html")));
app.get("/tutor/:id", (req, res) => res.sendFile(path.join(__dirname, "public", "tutor-profile.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/profile", (req, res) => res.sendFile(path.join(__dirname, "public", "profile.html")));

// Start server after database is ready
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Peer Tutor server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialise database:", err);
  process.exit(1);
});
