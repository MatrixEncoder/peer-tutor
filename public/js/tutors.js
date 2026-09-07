// Tutor directory - filtering and rendering

let allTutors = [];
let currentSubject = "";
let currentDepartment = "All";
let currentMinRating = 0;

async function fetchTutors() {
  const params = new URLSearchParams();
  if (currentSubject) params.set("subject", currentSubject);
  if (currentDepartment !== "All") params.set("department", currentDepartment);
  if (currentMinRating > 0) params.set("minRating", String(currentMinRating));

  const res = await fetch(`/api/tutors?${params.toString()}`);
  const data = await res.json();
  allTutors = Array.isArray(data) ? data : [];
  renderTutors();
}

function renderTutors() {
  const grid = document.getElementById("tutors-grid");
  const noTutors = document.getElementById("no-tutors");
  const countEl = document.getElementById("tutor-count");

  if (allTutors.length === 0) {
    grid.innerHTML = "";
    noTutors.classList.remove("d-none");
    countEl.textContent = "0 tutors found";
    return;
  }

  noTutors.classList.add("d-none");
  countEl.textContent = `${allTutors.length} tutor${allTutors.length !== 1 ? "s" : ""} available`;

  grid.innerHTML = allTutors.map((t) => {
    const subjects = t.subjects.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
    const initials = t.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    return `
      <div class="col-md-6 col-xl-4">
        <div class="card tutor-card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center fw-bold mb-2" style="width:40px;height:40px;font-size:14px;">
                  ${initials}
                </div>
                <h6 class="fw-bold mb-0">${t.user.name}</h6>
                <small class="text-muted">${t.user.university} &middot; ${t.user.department}</small>
              </div>
              <div class="text-end">
                <div class="fw-bold">$${t.hourlyRate}<small class="text-muted fw-normal">/hr</small></div>
              </div>
            </div>
            <div class="mb-2">${starRatingHTML(t.avgRating)} <small class="text-muted">${t.avgRating > 0 ? t.avgRating.toFixed(1) : "No reviews"}${t.totalReviews > 0 ? ` (${t.totalReviews})` : ""}</small></div>
            ${t.user.bio ? `<p class="text-muted small mb-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${t.user.bio}</p>` : ""}
            <div class="mb-3">${subjects.map((s) => `<span class="subject-tag">${s}</span>`).join("")}</div>
            <a href="/tutor/${t.id}" class="btn btn-primary btn-sm w-100">View profile &amp; book</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function clearFilters() {
  currentSubject = "";
  currentDepartment = "All";
  currentMinRating = 0;
  document.getElementById("filter-subject").value = "";
  document.querySelectorAll(".dept-btn").forEach((b) => {
    b.classList.remove("active");
    b.classList.replace("btn-primary", "btn-outline-secondary");
  });
  document.querySelector('.dept-btn[data-dept="All"]').classList.add("active");
  document.querySelector('.dept-btn[data-dept="All"]').classList.replace("btn-outline-secondary", "btn-primary");
  document.querySelectorAll(".rating-btn").forEach((b) => {
    b.classList.remove("active");
    b.classList.replace("btn-primary", "btn-outline-secondary");
  });
  document.querySelector('.rating-btn[data-rating="0"]').classList.add("active");
  document.querySelector('.rating-btn[data-rating="0"]').classList.replace("btn-outline-secondary", "btn-primary");
  fetchTutors();
}

// Debounce for subject search
let searchTimeout;
document.getElementById("filter-subject").addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSubject = e.target.value;
    fetchTutors();
  }, 300);
});

// Department buttons
document.querySelectorAll(".dept-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".dept-btn").forEach((b) => {
      b.classList.remove("active");
      b.classList.replace("btn-primary", "btn-outline-secondary");
    });
    btn.classList.add("active");
    btn.classList.replace("btn-outline-secondary", "btn-primary");
    currentDepartment = btn.dataset.dept;
    fetchTutors();
  });
});

// Rating buttons
document.querySelectorAll(".rating-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".rating-btn").forEach((b) => {
      b.classList.remove("active");
      b.classList.replace("btn-primary", "btn-outline-secondary");
    });
    btn.classList.add("active");
    btn.classList.replace("btn-outline-secondary", "btn-primary");
    currentMinRating = parseFloat(btn.dataset.rating);
    fetchTutors();
  });
});

// Load tutors on page load
fetchTutors();
