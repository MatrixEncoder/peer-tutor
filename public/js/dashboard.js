// Dashboard - session management

let currentUser = null;
let currentView = "student";
let studentSessions = [];
let tutorSessions = [];
let reviewSessionId = null;
let reviewRating = 5;

async function initDashboard() {
  currentUser = await requireAuth();
  if (!currentUser) return;

  document.getElementById("nav-username").textContent = currentUser.name;

  // Show role toggle if user is BOTH
  if (currentUser.role === "BOTH") {
    document.getElementById("role-toggle-row").style.display = "flex";
    document.getElementById("role-toggle-row").removeAttribute("style");
  }

  // Role toggle
  document.querySelectorAll("#role-toggle .btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#role-toggle .btn").forEach((b) => {
        b.classList.remove("active");
        b.classList.replace("btn-primary", "btn-outline-primary");
      });
      btn.classList.add("active");
      btn.classList.replace("btn-outline-primary", "btn-primary");
      currentView = btn.dataset.view;
      renderSessions();
    });
  });

  await loadSessions();
}

async function loadSessions() {
  const [sRes, tRes] = await Promise.all([
    fetch("/api/sessions?role=student"),
    fetch("/api/sessions?role=tutor"),
  ]);
  const sData = await sRes.json();
  const tData = await tRes.json();
  studentSessions = Array.isArray(sData) ? sData : [];
  tutorSessions = Array.isArray(tData) ? tData : [];
  renderSessions();
}

function renderSessions() {
  const sessions = currentView === "student" ? studentSessions : tutorSessions;
  const listEl = document.getElementById("sessions-list");

  // Stats
  const counts = { PENDING: 0, ACCEPTED: 0, DECLINED: 0, COMPLETED: 0, CANCELLED: 0 };
  sessions.forEach((s) => { if (s.status in counts) counts[s.status]++; });

  document.getElementById("stat-pending").textContent = String(counts.PENDING).padStart(2, "0");
  document.getElementById("stat-accepted").textContent = String(counts.ACCEPTED).padStart(2, "0");
  document.getElementById("stat-declined").textContent = String(counts.DECLINED).padStart(2, "0");
  document.getElementById("stat-completed").textContent = String(counts.COMPLETED).padStart(2, "0");
  document.getElementById("stat-total").textContent = String(sessions.length).padStart(2, "0");

  // Review pending
  const reviewPending = studentSessions.filter((s) => s.status === "COMPLETED" && !s.review);
  const reviewCard = document.getElementById("review-pending-card");
  const reviewList = document.getElementById("review-pending-list");
  if (reviewPending.length > 0) {
    reviewCard.style.display = "block";
    reviewList.innerHTML = reviewPending.slice(0, 3).map((s) => `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <small class="fw-semibold">${s.subject}</small>
        <button class="btn btn-outline-primary btn-sm" onclick="openReviewModal(${s.id})">Review</button>
      </div>
    `).join("");
  } else {
    reviewCard.style.display = "none";
  }

  // Sessions list
  if (sessions.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-5">
        <div class="display-4 mb-2">&#128203;</div>
        <p class="text-muted">No sessions yet</p>
        <a href="/tutors" class="btn btn-primary btn-sm">Find a Tutor</a>
      </div>
    `;
    return;
  }

  listEl.innerHTML = sessions.map((s) => {
    const peerName = currentView === "student"
      ? (s.tutorProfile?.user?.name || "Tutor")
      : (s.student?.name || "Student");

    let actions = "";
    if (currentView === "tutor") {
      if (s.status === "PENDING") {
        actions = `
          <button class="btn btn-success btn-sm" onclick="updateSessionStatus(${s.id}, 'ACCEPTED')" title="Accept">&#10003;</button>
          <button class="btn btn-danger btn-sm" onclick="updateSessionStatus(${s.id}, 'DECLINED')" title="Decline">&#10007;</button>
        `;
      } else if (s.status === "ACCEPTED") {
        actions = `<button class="btn btn-primary btn-sm" onclick="updateSessionStatus(${s.id}, 'COMPLETED')" title="Mark complete">&#10003;&#10003;</button>`;
      }
    }
    // Both can cancel pending/accepted
    if (s.status === "PENDING" || s.status === "ACCEPTED") {
      actions += `<button class="btn btn-outline-danger btn-sm ms-1" onclick="updateSessionStatus(${s.id}, 'CANCELLED')" title="Cancel">&#10007;</button>`;
    }

    return `
      <div class="session-card status-${s.status} p-3 mb-2 bg-light rounded-3 d-flex justify-content-between align-items-center">
        <div>
          <small class="text-primary fw-bold">${s.subject}</small>
          <div class="small">${currentView === "student" ? "with " : "Student: "}${peerName}</div>
          <div class="text-muted" style="font-size:0.75rem;">${formatDate(s.scheduled_date)} at ${s.scheduled_time} &middot; ${s.duration_minutes} min</div>
          ${s.notes ? `<div class="text-muted" style="font-size:0.75rem;">${s.notes}</div>` : ""}
        </div>
        <div class="d-flex align-items-center gap-2">
          ${statusBadge(s.status)}
          <div class="d-flex gap-1">${actions}</div>
        </div>
      </div>
    `;
  }).join("");
}

async function updateSessionStatus(id, status) {
  await fetch(`/api/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await loadSessions();
}

// Review modal
function openReviewModal(sessionId) {
  reviewSessionId = sessionId;
  reviewRating = 5;
  updateStarDisplay();
  document.getElementById("review-comment").value = "";
  new bootstrap.Modal(document.getElementById("reviewModal")).show();
}

function updateStarDisplay() {
  document.querySelectorAll("#star-selector .star").forEach((s) => {
    const star = parseInt(s.dataset.star);
    s.classList.toggle("filled", star <= reviewRating);
  });
}

document.getElementById("star-selector").addEventListener("click", (e) => {
  const star = e.target.closest(".star");
  if (star) {
    reviewRating = parseInt(star.dataset.star);
    updateStarDisplay();
  }
});

document.getElementById("submit-review-btn").addEventListener("click", async () => {
  if (!reviewSessionId) return;
  const btn = document.getElementById("submit-review-btn");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: reviewSessionId,
      rating: reviewRating,
      comment: document.getElementById("review-comment").value,
    }),
  });

  btn.disabled = false;
  btn.textContent = "Submit Review";
  bootstrap.Modal.getInstance(document.getElementById("reviewModal")).hide();
  await loadSessions();
});

// Sign out
document.getElementById("nav-signout")?.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/";
});

initDashboard();
