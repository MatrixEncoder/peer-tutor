// Shared auth utilities

// Check if user is logged in and update navbar
async function checkAuth() {
  const res = await fetch("/api/me");
  const data = await res.json();
  return data.user;
}

// Update navbar based on auth state
async function updateNavbar() {
  const user = await checkAuth();
  if (user) {
    const authBtns = document.getElementById("nav-auth-buttons");
    const userInfo = document.getElementById("nav-user-info");
    const navDash = document.getElementById("nav-dashboard");
    const navUsername = document.getElementById("nav-username");

    if (authBtns) authBtns.style.display = "none";
    if (userInfo) userInfo.style.display = "flex";
    if (navDash) navDash.style.display = "block";
    if (navUsername) navUsername.textContent = user.name;

    // Sign out button
    const signOutBtn = document.getElementById("nav-signout");
    if (signOutBtn) {
      signOutBtn.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/";
      });
    }
  }
  return user;
}

// Require auth - redirect to login if not authenticated
async function requireAuth() {
  const user = await checkAuth();
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  return user;
}

// Generate star rating HTML
function starRatingHTML(rating, size) {
  const sizeClass = size === "lg" ? "fs-5" : "";
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      html += `<span class="star filled ${sizeClass}">&#9733;</span>`;
    } else if (i - 0.5 <= rating) {
      html += `<span class="star filled ${sizeClass}">&#9733;</span>`;
    } else {
      html += `<span class="star ${sizeClass}">&#9733;</span>`;
    }
  }
  return html;
}

// Status badge HTML
function statusBadge(status) {
  return `<span class="badge-status badge-${status.toLowerCase()}">${status}</span>`;
}

// Format date for display
function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Initialise navbar on every page
document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
});
