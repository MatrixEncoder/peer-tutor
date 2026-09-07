// Tutor profile page - view profile and book session

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DURATIONS = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
];

async function loadTutorProfile() {
  const pathParts = window.location.pathname.split("/");
  const tutorId = pathParts[pathParts.length - 1];

  const res = await fetch(`/api/tutors/${tutorId}`);
  if (!res.ok) {
    document.getElementById("tutor-content").innerHTML = `
      <div class="text-center py-5"><p class="text-muted">Tutor not found.</p></div>
    `;
    return;
  }

  const tutor = await res.json();
  const subjects = tutor.subjects.split(",").map((s) => s.trim()).filter(Boolean);
  const initials = tutor.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const today = new Date().toISOString().split("T")[0];

  let availabilityHTML = "";
  if (tutor.availability.length === 0) {
    availabilityHTML = '<p class="text-muted small">No availability set yet</p>';
  } else {
    availabilityHTML = DAYS.map((day, i) => {
      const slots = tutor.availability.filter((a) => a.dayOfWeek === i);
      if (slots.length === 0) return "";
      return `
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="text-muted small" style="width:90px;">${day}</span>
          ${slots.map((s) => `<span class="availability-slot">${s.startTime} &ndash; ${s.endTime}</span>`).join("")}
        </div>
      `;
    }).join("");
  }

  let reviewsHTML = "";
  if (tutor.reviews.length === 0) {
    reviewsHTML = '<p class="text-muted small">No reviews yet. Be the first!</p>';
  } else {
    reviewsHTML = tutor.reviews.map((r) => `
      <div class="review-card">
        <div class="mb-1">${starRatingHTML(r.rating)} <small class="text-muted">by ${r.reviewer.name} &middot; ${new Date(r.createdAt).toLocaleDateString()}</small></div>
        ${r.comment ? `<p class="text-muted small mb-0">${r.comment}</p>` : ""}
      </div>
    `).join("");
  }

  document.getElementById("tutor-content").innerHTML = `
    <!-- Profile Header -->
    <div class="d-flex align-items-start gap-3 mb-4">
      <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style="width:64px;height:64px;font-size:24px;">
        ${initials}
      </div>
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2">
          <h3 class="fw-bold mb-0">${tutor.user.name}</h3>
          ${tutor.isVerified ? '<span class="badge bg-success bg-opacity-10 text-success">Verified</span>' : ""}
        </div>
        <p class="text-muted mb-1">${tutor.user.university} &middot; Year ${tutor.user.yearOfStudy} &middot; ${tutor.user.department}</p>
        <div>${starRatingHTML(tutor.avgRating)} <small class="text-muted">${tutor.avgRating > 0 ? tutor.avgRating.toFixed(1) : "No reviews"}${tutor.totalReviews > 0 ? ` &middot; ${tutor.totalReviews} reviews` : ""}</small></div>
      </div>
      <div class="text-end flex-shrink-0">
        <div class="fw-bold" style="font-size:1.5rem;">$${tutor.hourlyRate}</div>
        <small class="text-muted">per hour</small>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column -->
      <div class="col-lg-8">
        ${tutor.user.bio ? `
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <h6 class="fw-bold mb-2">About</h6>
              <p class="text-muted small mb-0">${tutor.user.bio}</p>
            </div>
          </div>
        ` : ""}

        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h6 class="fw-bold mb-2">Subjects</h6>
            <div>${subjects.length > 0 ? subjects.map((s) => `<span class="subject-tag">${s}</span>`).join("") : '<p class="text-muted small mb-0">No subjects listed</p>'}</div>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h6 class="fw-bold mb-2">Weekly Availability</h6>
            ${availabilityHTML}
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Reviews (${tutor.totalReviews})</h6>
            ${reviewsHTML}
          </div>
        </div>
      </div>

      <!-- Right Column: Booking Form -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm sticky-top" style="top:80px;">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Book a Session</h6>
            <form id="booking-form">
              <div class="mb-3">
                <label class="form-label fw-semibold small">Subject</label>
                <select id="book-subject" class="form-select form-select-sm" required>
                  <option value="">Select a subject</option>
                  ${subjects.map((s) => `<option value="${s}">${s}</option>`).join("")}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold small">Date</label>
                <input type="date" id="book-date" class="form-control form-control-sm" min="${today}" required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold small">Time</label>
                <input type="time" id="book-time" class="form-control form-control-sm" required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold small">Duration</label>
                <select id="book-duration" class="form-select form-select-sm">
                  ${DURATIONS.map((d) => `<option value="${d.value}" ${d.value === 60 ? "selected" : ""}>${d.label}</option>`).join("")}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold small">Notes (optional)</label>
                <textarea id="book-notes" class="form-control form-control-sm" rows="2" placeholder="Topics you want to cover..."></textarea>
              </div>
              <div class="bg-light rounded p-2 mb-3 d-flex justify-content-between">
                <span class="text-muted small">Estimated cost</span>
                <span class="fw-bold small" id="book-cost">$${((tutor.hourlyRate * 60) / 60).toFixed(2)}</span>
              </div>
              <div id="booking-error" class="alert alert-danger d-none small py-2"></div>
              <div id="booking-success" class="alert alert-success d-none small py-2"></div>
              <button type="submit" id="book-btn" class="btn btn-primary w-100">Request Session</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Update cost estimate on duration change
  document.getElementById("book-duration").addEventListener("change", (e) => {
    const hours = parseInt(e.target.value) / 60;
    const cost = (tutor.hourlyRate * hours).toFixed(2);
    document.getElementById("book-cost").textContent = `$${cost}`;
  });

  // Handle booking
  document.getElementById("booking-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = await checkAuth();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const btn = document.getElementById("book-btn");
    const errorDiv = document.getElementById("booking-error");
    const successDiv = document.getElementById("booking-success");
    btn.disabled = true;
    btn.textContent = "Sending request...";
    errorDiv.classList.add("d-none");
    successDiv.classList.add("d-none");

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tutorProfileId: tutor.id,
        subject: document.getElementById("book-subject").value,
        scheduledDate: document.getElementById("book-date").value,
        scheduledTime: document.getElementById("book-time").value,
        durationMinutes: parseInt(document.getElementById("book-duration").value),
        notes: document.getElementById("book-notes").value,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      errorDiv.textContent = data.error || "Booking failed";
      errorDiv.classList.remove("d-none");
      btn.disabled = false;
      btn.textContent = "Request Session";
    } else {
      successDiv.textContent = "Booking request sent! Redirecting to dashboard...";
      successDiv.classList.remove("d-none");
      btn.style.display = "none";
      setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
    }
  });
}

loadTutorProfile();
