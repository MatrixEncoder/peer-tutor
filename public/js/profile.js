// Profile editing page

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let profileData = null;
let slots = [];

async function initProfile() {
  const user = await requireAuth();
  if (!user) return;

  document.getElementById("nav-username").textContent = user.name;

  // Load profile
  const res = await fetch("/api/profile");
  profileData = await res.json();

  // Fill form
  document.getElementById("profile-name").value = profileData.name || "";
  document.getElementById("profile-bio").value = profileData.bio || "";
  document.getElementById("profile-university").value = profileData.university || "";
  document.getElementById("profile-year").value = profileData.yearOfStudy || 1;

  // Show tutor fields if applicable
  const isTutor = profileData.role === "TUTOR" || profileData.role === "BOTH";
  if (isTutor) {
    document.getElementById("tutor-fields").style.display = "block";
    document.getElementById("availability-card").style.display = "block";
    if (profileData.tutorProfile) {
      document.getElementById("profile-subjects").value = profileData.tutorProfile.subjects || "";
      document.getElementById("profile-rate").value = profileData.tutorProfile.hourlyRate || 0;
      slots = profileData.tutorProfile.availability || [];
    }
    renderSlots();
  }
}

function renderSlots() {
  const container = document.getElementById("slots-container");
  if (slots.length === 0) {
    container.innerHTML = '<p class="text-muted small">No time slots added yet.</p>';
    return;
  }

  container.innerHTML = slots.map((slot, i) => `
    <div class="d-flex align-items-center gap-2 mb-2">
      <select class="form-select form-select-sm" style="width:130px;" onchange="updateSlot(${i}, 'dayOfWeek', parseInt(this.value))">
        ${DAYS.map((d, di) => `<option value="${di}" ${di === slot.dayOfWeek ? "selected" : ""}>${d}</option>`).join("")}
      </select>
      <input type="time" class="form-control form-control-sm" style="width:120px;" value="${slot.startTime}" onchange="updateSlot(${i}, 'startTime', this.value)">
      <span class="text-muted small">to</span>
      <input type="time" class="form-control form-control-sm" style="width:120px;" value="${slot.endTime}" onchange="updateSlot(${i}, 'endTime', this.value)">
      <button class="btn btn-outline-danger btn-sm" onclick="removeSlot(${i})">&#10005;</button>
    </div>
  `).join("");
}

function addSlot() {
  slots.push({ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" });
  renderSlots();
}

function removeSlot(index) {
  slots.splice(index, 1);
  renderSlots();
}

function updateSlot(index, field, value) {
  slots[index][field] = value;
}

// Save profile
document.getElementById("profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById("profile-message");

  const body = {
    name: document.getElementById("profile-name").value,
    bio: document.getElementById("profile-bio").value,
    university: document.getElementById("profile-university").value,
    yearOfStudy: parseInt(document.getElementById("profile-year").value),
  };

  if (profileData.role === "TUTOR" || profileData.role === "BOTH") {
    body.subjects = document.getElementById("profile-subjects").value;
    body.hourlyRate = parseFloat(document.getElementById("profile-rate").value) || 0;
  }

  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    msgEl.className = "alert alert-success small mt-3";
    msgEl.textContent = "Profile saved!";
  } else {
    msgEl.className = "alert alert-danger small mt-3";
    msgEl.textContent = "Failed to save. Please try again.";
  }
  msgEl.classList.remove("d-none");
});

// Save availability
document.getElementById("save-availability-btn")?.addEventListener("click", async () => {
  const msgEl = document.getElementById("avail-message");

  const res = await fetch("/api/availability", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slots }),
  });

  if (res.ok) {
    msgEl.className = "alert alert-success small mt-3";
    msgEl.textContent = "Availability saved!";
  } else {
    msgEl.className = "alert alert-danger small mt-3";
    msgEl.textContent = "Failed to save availability.";
  }
  msgEl.classList.remove("d-none");
});

// Add slot button
document.getElementById("add-slot-btn")?.addEventListener("click", addSlot);

// Sign out
document.getElementById("nav-signout")?.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/";
});

initProfile();
