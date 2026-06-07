const SUPABASE_URL =
  "https://ddrimxgqytfprphhazgb.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcmlteGdxeXRmcHJwaGhhemdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjE2NzAsImV4cCI6MjA5NjMzNzY3MH0.ycOW16LmqGZny6cTBgQg4lQ_XKQXtBu6sXsFDRnHsFo";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  const STORAGE_KEY = "freelancer-management-system-v1";
const SESSION_KEY = "freelancer-management-session-v1";


  supabaseClient.auth.getSession()
.then(({ data }) => {

  if (data.session) {

    sessionStorage.setItem(
      SESSION_KEY,
      data.session.user.id
    );

    updateAuthView();

  }

});

const statuses = ["Briefed", "In Progress", "Review", "Rework", "Completed"];
const taskTypes = ["Transcription QC", "Audio QC", "Annotation", "Speech Recording", "Image QC", "Others"];

const demoState = {
  operations: [],
  freelancers: [
    {
      id: "fr-1",
      name: "Aarav Mehta",
      email: "aarav.mehta@example.com",
      role: "UI Designer",
      state: "Maharashtra",
      district: "Pune",
      language: "Marathi, Hindi",
      rate: "$45/hr",
      status: "Available"
    }
  ],
  tasks: [
    {
      id: "task-1",
      taskType: "Others",
      batchName: "Website audit - June 2026",
      freelancerId: "fr-1",
      startDate: "2026-06-02",
      deadlineDate: "2026-06-08",
      taskCount: 12,
      payPerTask: 55,
      status: "Review",
      paymentStatus: "Pending approval",
      brief: "Website audit report: audit the homepage, pricing page, and checkout path. Include priority fixes."
    }
  ],
  notifications: [
    {
      id: "note-1",
      type: "Task assigned",
      message: "Client portal implementation assigned to Nisha Rao.",
      taskId: "task-3",
      freelancerId: "fr-2",
      read: false,
      createdAt: "2026-06-02T08:00:00.000Z"
    },
    {
      id: "note-2",
      type: "Payment pending",
      message: "Website audit report is awaiting payment approval.",
      taskId: "task-1",
      freelancerId: "fr-3",
      read: false,
      createdAt: "2026-06-01T12:30:00.000Z"
    }
  ],
  emailTemplate: {
    subject: "New task assigned: {{taskType}}",
    body:
      "Hi {{freelancerName}},\n\nA new task has been assigned to you.\n\nTask type: {{taskType}}\nCount of tasks: {{taskCount}}\nStart date: {{startDate}}\nDeadline date: {{deadlineDate}}\n\nDescription / brief:\n{{brief}}\n\nPlease reply to confirm you received this.\n\nThanks,\nAssociate Desk"
  },
  emailSettings: {
    senderName: "Associate Desk",
    senderEmail: "tasks@yourdomain.com"
  }
};

let state = loadState();
state.operations = state.operations || [];

const els = {
  navButtons: document.querySelectorAll(".nav-btn"),
  views: document.querySelectorAll(".view"),
  metrics: document.getElementById("metrics"),
  workflowPreview: document.getElementById("workflowPreview"),
  recentNotifications: document.getElementById("recentNotifications"),
  freelancerGrid: document.getElementById("freelancerGrid"),
  taskBoard: document.getElementById("taskBoard"),
  paymentRows: document.getElementById("paymentRows"),
  notificationList: document.getElementById("notificationList"),
  taskFreelancerSelect: document.getElementById("taskFreelancerSelect"),
  operationSelect:document.getElementById("operationSelect"),
  taskFreelancerFilter: document.getElementById("taskFreelancerFilter"),
  taskTypeFilter: document.getElementById("taskTypeFilter"),
  taskStatusFilter: document.getElementById("taskStatusFilter"),
  globalSearch: document.getElementById("globalSearch"),
  emailSubject: document.getElementById("emailSubject"),
  emailBody: document.getElementById("emailBody"),
  senderName: document.getElementById("senderName"),
  senderEmail: document.getElementById("senderEmail"),
  loginScreen: document.getElementById("loginScreen"),
  appShell: document.getElementById("appShell"),
  toast: document.getElementById("toast")
};

document.getElementById("showLoginBtn").addEventListener("click", () => setAuthMode("login"));
document.getElementById("showSignupBtn").addEventListener("click", () => setAuthMode("signup"));

document.getElementById("loginForm")
.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email =
    document.getElementById("loginEmail")
      .value.trim();

  const password =
    document.getElementById("loginPassword")
      .value;

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    console.log("LOGIN DATA", data);
console.log("LOGIN ERROR", error);

  if (error) {

    toast(error.message);
    return;

  }

sessionStorage.setItem(
  SESSION_KEY,
  data.user.id
);

document
  .getElementById("loginScreen")
  .style.display = "none";

document
  .getElementById("appShell")
  .style.display = "grid";

toast("Login successful.");

});

document.getElementById("signupForm")
.addEventListener("submit", async (event) => {

  event.preventDefault();

  const name =
    document.getElementById("signupName")
      .value.trim();

  const email =
    document.getElementById("signupEmail")
      .value.trim();

  const password =
    document.getElementById("signupPassword")
      .value;

  const { data, error } =
    await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

  if (error) {

    toast(error.message);
    return;

  }

  toast(
    "Account created. Check your email."
  );

  document
    .getElementById("signupForm")
    .reset();

});

document
.getElementById("forgotPasswordBtn")
?.addEventListener("click", async () => {

  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim();

  if (!email) {

    toast("Enter your email first.");
    return;

  }

  const { error } =
    await supabaseClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          window.location.origin
      }
    );

  if (error) {

    toast(error.message);

  } else {

    toast(
      "Password reset email sent."
    );

  }

});

document.getElementById("logoutBtn").addEventListener("click", async () => {

  await supabaseClient.auth.signOut();

  sessionStorage.removeItem(SESSION_KEY);

  updateAuthView();

});

document.getElementById("openTaskModalBtn").addEventListener("click", () => {
  prepareTaskModal();
  document.getElementById("taskModal").showModal();
});

document.getElementById("openFreelancerModalBtn").addEventListener("click", () => {
  document.getElementById("freelancerForm").reset();
  document.getElementById("freelancerModal").showModal();
});


document.getElementById("saveTemplateBtn").addEventListener("click", () => {
  state.emailSettings.senderName = els.senderName.value;
  state.emailSettings.senderEmail = els.senderEmail.value;
  state.emailTemplate.subject = els.emailSubject.value;
  state.emailTemplate.body = els.emailBody.value;
  saveState();
  toast("Email settings saved.");
});

document.getElementById("clearNotificationsBtn").addEventListener("click", () => {
  state.notifications = state.notifications.filter((note) => !note.read);
  saveState();
  render();
  toast("Read notifications cleared.");
});

document.getElementById("selectAllPayments").addEventListener("change", (event) => {
  document.querySelectorAll(".payment-check").forEach((box) => {
    box.checked = event.target.checked;
  });
});

document.getElementById("markPaidBtn").addEventListener("click", () => {
  const selected = [...document.querySelectorAll(".payment-check:checked")].map((box) => box.value);
  state.tasks.forEach((task) => {
    if (selected.includes(task.id)) {
      task.paymentStatus = "Paid";
    }
  });
  saveState();
  render();
  toast(selected.length ? "Selected payments marked paid." : "Select at least one payment row.");
});

document.getElementById("exportDataBtn")?.addEventListener("click",exportData);

document.getElementById("importDataBtn")?.addEventListener("click",() =>
  document.getElementById(
        "importFile"
      )
      .click()
);

document
.getElementById(
  "importFile"
)
?.addEventListener(
  "change",
  (e) => {

    const file =
      e.target.files[0];

    if (file) {

      importData(file);

    }

  }
);


  document.getElementById("freelancerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const data = Object.fromEntries(
    new FormData(event.currentTarget)
  );

  if (data.id) {
    const index = state.freelancers.findIndex(
      f => f.id === data.id
    );

    state.freelancers[index] = {
      ...state.freelancers[index],
      ...data
    };

    toast("Freelancer updated.");
  } else {
    state.freelancers.push({
      id: uid("fr"),
      ...data
    });

    toast("Freelancer added.");
  }

  saveState();
  render();

  document.getElementById("freelancerModal").close();
});

document.getElementById("taskForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const data = Object.fromEntries(
    new FormData(event.currentTarget)
  );

  const taskId =
    document.getElementById("taskId")?.value;

  if (taskId) {

    const index =
      state.tasks.findIndex(
        t => t.id === taskId
      );

    if (index !== -1) {
      state.tasks[index] = {
        ...state.tasks[index],
        ...data,
        taskCount: Number(data.taskCount)
      };
    }

    toast("Task updated.");

  } else {

    const task = {
      id: uid("task"),
      operationId: data.operationId,
      taskType: data.taskType,
      freelancerId: data.freelancerId,
      startDate: data.startDate,
      deadlineDate: data.deadlineDate,
      taskCount: Number(data.taskCount),
      payPerTask: 0,
      status: "Briefed",
      paymentStatus: "Unpaid",
      brief: data.brief
    };

    state.tasks.push(task);

    createAssignmentNotification(task);

    toast("Task assigned.");

    setTimeout(() => {
      openEmailDraft(task);
    }, 200);
  }

  saveState();
  render();

  document.getElementById("taskModal").close();
});

els.taskFreelancerFilter.addEventListener("change", renderTasks);
els.taskTypeFilter.addEventListener("change", renderTasks);
els.taskStatusFilter.addEventListener("change", renderTasks);
els.globalSearch.addEventListener("input", render);
 document.getElementById("freelancerSearch")
  ?.addEventListener("input", renderFreelancers);

document.getElementById("stateFilter")
  ?.addEventListener("change", renderFreelancers);

document.getElementById("districtFilter")
  ?.addEventListener("change", renderFreelancers);

document.getElementById("languageFilter")
  ?.addEventListener("change", renderFreelancers);

document.getElementById("statusFilter")
  ?.addEventListener("change", renderFreelancers);

els.navButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.jump));
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return normalizeState(saved ? JSON.parse(saved) : clone(demoState));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(nextState) {
    nextState.operations =
  nextState.operations || [];
    nextState.freelancers = nextState.freelancers.map(person => ({
  ...person,
  state: person.state || "",
  district: person.district || "",
  language: person.language || ""
}));
  nextState.emailTemplate = nextState.emailTemplate || clone(demoState.emailTemplate);
  nextState.emailSettings = nextState.emailSettings || clone(demoState.emailSettings);
  // nextState.users = nextState.users || [
  //   {
  //     id: "user-admin",
  //     name: "Admin",
  //     email: nextState.login?.email || "admin@yourdomain.com",
  //     password: nextState.login?.password || "admin123"
  //   }
  // ];
  nextState.tasks = nextState.tasks.map((task) => ({
    ...task,
    taskType: task.taskType || "Others",
    taskCount: Number(task.taskCount || 1),
    payPerTask: Number(task.payPerTask ?? task.amount ?? 0),
    startDate: task.startDate || new Date().toISOString().slice(0, 10),
    deadlineDate: task.deadlineDate || task.due || new Date().toISOString().slice(0, 10)
  }));
  nextState.emailTemplate.subject = nextState.emailTemplate.subject.replaceAll("{{taskTitle}}", "{{taskType}}");
  nextState.emailTemplate.body = nextState.emailTemplate.body
    .replaceAll("{{taskTitle}}", "{{taskType}}")
    .replaceAll("{{dueDate}}", "{{deadlineDate}}")
    .replaceAll("Due date:", "Deadline date:")
    .replace(/\nPayment: \$\{\{amount\}\}/g, "");
  return nextState;
}

function updateAuthView() {

  const hasSession =
    !!sessionStorage.getItem(
      SESSION_KEY
    );

  document
    .getElementById("appShell")
    .classList.toggle(
      "locked",
      !hasSession
    );

  document
    .getElementById("loginScreen")
    .style.display =
      hasSession ? "none" : "grid";

  document
    .getElementById("appShell")
    .style.display =
      hasSession ? "grid" : "none";
}

function setAuthMode(mode) {
  const isSignup = mode === "signup";
  document.getElementById("signupForm").classList.toggle("hidden", !isSignup);
  document.getElementById("loginForm").classList.toggle("hidden", isSignup);
  document.getElementById("showSignupBtn").classList.toggle("active", isSignup);
  document.getElementById("showLoginBtn").classList.toggle("active", !isSignup);
}

function uid(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setView(view) {
  els.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  els.views.forEach((section) => section.classList.toggle("active", section.id === `${view}-view`));
}

function render() {
  renderMetrics();
  renderOperations();
  renderOperationTaskTypes();
  renderFreelancers();
  renderTaskSelectors();
  renderOperationSelectors();
  renderTasks();
  renderPayments();
  renderNotifications();
  populateFreelancerFilters();
  els.senderName.value = state.emailSettings.senderName;
  els.senderEmail.value = state.emailSettings.senderEmail;
  els.emailSubject.value = state.emailTemplate.subject;
  els.emailBody.value = state.emailTemplate.body;
  updateAuthView();
}

function populateFreelancerFilters() {

  const states =
    [...new Set(state.freelancers.map(f => f.state))]
      .filter(Boolean)
      .sort();

  const districts =
    [...new Set(state.freelancers.map(f => f.district))]
      .filter(Boolean)
      .sort();

  const languages =
    [...new Set(state.freelancers.map(f => f.language))]
      .filter(Boolean)
      .sort();

  document.getElementById("stateFilter").innerHTML =
    '<option value="all">All States</option>' +
    states.map(s =>
      `<option value="${s}">${s}</option>`
    ).join("");

  document.getElementById("districtFilter").innerHTML =
    '<option value="all">All Districts</option>' +
    districts.map(s =>
      `<option value="${s}">${s}</option>`
    ).join("");

  document.getElementById("languageFilter").innerHTML =
    '<option value="all">All Languages</option>' +
    languages.map(s =>
      `<option value="${s}">${s}</option>`
    ).join("");
}

function renderMetrics() {

  const unread =
    state.notifications.filter(
      note => !note.read
    ).length;

  const operations =
    state.operations.length;

  const ongoing =
    state.operations.filter(
      op => op.status === "Ongoing"
    ).length;

  const dueSoon =
    state.operations.filter(op => {

      const days =
        Math.ceil(
          (new Date(op.deadlineDate) -
           new Date()) /
          86400000
        );

      return days >= 0 && days <= 7;

    }).length;

    const delayed =
  state.operations.filter(op => {

    const days =
      Math.ceil(
        (
          new Date(op.deadlineDate)
          - new Date()
        ) / 86400000
      );

    return days < 0;

  }).length;

  const items = [

["Operations", operations],

["Ongoing", ongoing],

["Due Soon", dueSoon],

["Delayed", delayed],

["Assignments",
state.tasks.length
],

["Freelancers",
state.freelancers.length
],

["Unread Alerts",
unread
]

];

  els.metrics.innerHTML =
    items.map(
      ([label, value]) => `
      <article class="metric">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `
    ).join("");

}

function renderFreelancers() {
  const query =
  document.getElementById("freelancerSearch")
    ?.value.toLowerCase() || "";

const stateFilter =
  document.getElementById("stateFilter")
    ?.value || "all";

const districtFilter =
  document.getElementById("districtFilter")
    ?.value || "all";

const languageFilter =
  document.getElementById("languageFilter")
    ?.value || "all";

const statusFilter =
  document.getElementById("statusFilter")
    ?.value || "all";

const freelancers =
  state.freelancers.filter(person => {

    const matchesSearch =
      [
        person.name,
        person.email,
        person.mobile,
        person.state,
        person.district,
        person.language
      ]
      .join(" ")
      .toLowerCase()
      .includes(query);

    return matchesSearch &&
      (stateFilter === "all" ||
       person.state === stateFilter) &&
      (districtFilter === "all" ||
       person.district === districtFilter) &&
      (languageFilter === "all" ||
       person.language === languageFilter) &&
      (statusFilter === "all" ||
       person.status === statusFilter);
  });
     
  els.freelancerGrid.innerHTML = freelancers.length
    ? freelancers.map((person) => {
        const activeTasks = state.tasks.filter((task) => task.freelancerId === person.id && task.status !== "Completed").length;
        return `
          <article class="freelancer-card">
            <header>
              <div>
                <h3>${escapeHtml(person.name)}</h3>
                <div class="card-meta">${escapeHtml(person.role)}</div>
              </div>
              <span class="pill ${className(person.status)}">${escapeHtml(person.status)}</span>
            </header>
            <dl>
              <dt>Email</dt><dd><a href="mailto:${encodeURIComponent(person.email)}">${escapeHtml(person.email)}</a></dd>
              <dt>State</dt><dd>${escapeHtml(person.state || "")}</dd>
              <dt>District</dt><dd>${escapeHtml(person.district || "")}</dd>
              <dt>Language</dt><dd>${escapeHtml(person.language || "")}</dd>
              <dt>Rate</dt><dd>${escapeHtml(person.rate)}</dd>
              <dt>Tasks</dt><dd>${activeTasks} active</dd>
            </dl>
            <div class="card-actions">
  <button class="ghost-btn"
          onclick="editFreelancer('${person.id}')">
    Edit
  </button>

  <button class="danger-btn"
          onclick="deleteFreelancer('${person.id}')">
    Delete
  </button>
</div>
          </article>
        `;
      }).join("")
    : `<div class="empty">No freelancers match your search.</div>`;
}

function deleteFreelancer(id) {

  if (!confirm("Delete freelancer?"))
    return;

  state.freelancers =
    state.freelancers.filter(
      f => f.id !== id
    );

  saveState();
  render();
}

function editFreelancer(id) {
  const person = state.freelancers.find(f => f.id === id);

  document.getElementById("freelancerId").value = person.id;

  document.querySelector("[name='name']").value = person.name || "";
  document.querySelector("[name='email']").value = person.email || "";
  document.querySelector("[name='role']").value = person.role || "";
  document.querySelector("[name='state']").value = person.state || "";
  document.querySelector("[name='district']").value = person.district || "";
  document.querySelector("[name='language']").value = person.language || "";
  document.querySelector("[name='rate']").value = person.rate || "";
  document.querySelector("[name='status']").value = person.status || "Available";

  document.getElementById("freelancerModal").showModal();
}

function renderTaskSelectors() {
  const options = state.freelancers.map((person) => `<option value="${person.id}">${escapeHtml(person.name)} - ${escapeHtml(person.role)}</option>`).join("");
  els.taskFreelancerSelect.innerHTML =
  `<option value="">Select freelancer</option>${options}`;
  els.taskFreelancerFilter.innerHTML = `<option value="all">All freelancers</option>${options}`;
  els.taskTypeFilter.innerHTML = `<option value="all">All task types</option>${taskTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}`;
}

function renderOperationSelectors() {

  if (!els.operationSelect)
    return;

  const options =
    state.operations.map(op =>

      `<option value="${op.id}">
        ${escapeHtml(op.batchName)}
      </option>`

    ).join("");

  els.operationSelect.innerHTML =
    `<option value="">
      Select Batch
    </option>` +
    options;
}

function renderTasks() {
  const query = els.globalSearch.value.trim().toLowerCase();
  const freelancerFilter = els.taskFreelancerFilter.value || "all";
  const typeFilter = els.taskTypeFilter.value || "all";
  const statusFilter = els.taskStatusFilter.value || "all";
  const filtered = state.tasks.filter((task) => {
    const person = findFreelancer(task.freelancerId);
    const operation = findOperation(task.operationId);
    const searchable = [getTaskLabel(task), task.brief, person?.name, person?.role].join(" ").toLowerCase();
    return searchable.includes(query)
      && (freelancerFilter === "all" || task.freelancerId === freelancerFilter)
      && (typeFilter === "all" || getTaskType(task) === typeFilter)
      && (statusFilter === "all" || task.status === statusFilter);
  });
  els.taskBoard.innerHTML = statuses.map((status) => renderColumn(status, filtered)).join("");
  els.workflowPreview.innerHTML = statuses.map((status) => renderColumn(status, state.tasks, true)).join("");
  document.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", () => updateTask(select.dataset.taskStatus, { status: select.value }));
  });
}

function deleteTask(id) {

  if (!confirm("Delete task?"))
    return;

  state.tasks =
    state.tasks.filter(
      t => t.id !== id
    );

  saveState();
  render();
}

function renderColumn(status, taskList, compact = false) {
  const cards = taskList.filter((task) => task.status === status);
  return `
    <section class="workflow-column">
      <h4>${status} (${cards.length})</h4>
      ${cards.length ? cards.map((task) => renderTaskCard(task, compact)).join("") : `<div class="empty">No tasks</div>`}
    </section>
  `;
}

function renderTaskCard(task, compact) {
  const person = findFreelancer(task.freelancerId);
  const operation = findOperation(task.operationId);
  const controls = compact ? "" : `
    <div class="task-actions">
      <select data-task-status="${task.id}"  class="status-dropdown" aria-label="Task status for ${escapeHtml(getTaskLabel(task))}">
        ${statuses.map((status) => `<option ${status === task.status ? "selected" : ""}>${status}</option>`).join("")}
      </select>
    </div>
  `;
  return `
    <article class="task-card">
      <strong>${escapeHtml(getTaskLabel(task))}</strong>
      <div class="task-meta"> Batch: ${escapeHtml(operation?.batchName || "-")}</div>
      <div class="task-meta">${escapeHtml(person?.name || "Unassigned")} - ${formatDate(task.startDate)} to ${formatDate(task.deadlineDate)}</div>
      <div class="task-meta">Count: ${Number(task.taskCount || 0)}</div>
      <p>${escapeHtml(task.brief)}</p>
      <div class="task-actions">
  <button class="ghost-btn"
          onclick="editTask('${task.id}')">
    Edit
  </button>

  <button class="danger-btn"
          onclick="deleteTask('${task.id}')">
    Delete
  </button>
</div>
      ${controls}
    </article>
  `;
}

function editTask(id) {

  const task =
    state.tasks.find(t => t.id === id);

  document.getElementById("taskId").value = task.id;
  renderTaskSelectors();

  document.querySelector("[name='taskType']").value =
    task.taskType;

  document.querySelector("[name='freelancerId']").value =
    task.freelancerId;

  document.querySelector("[name='startDate']").value =
    task.startDate;

  document.querySelector("[name='deadlineDate']").value =
    task.deadlineDate;

  document.querySelector("[name='taskCount']").value =
    task.taskCount;

  document.querySelector("[name='brief']").value =
    task.brief;

  document.getElementById("taskModal").showModal();
}

function renderPayments() {
  els.paymentRows.innerHTML = state.tasks.map((task) => {
    const person = findFreelancer(task.freelancerId);
    const operation =
  findOperation(task.operationId);
    return `
      <tr>
        <td><input class="payment-check" value="${task.id}" type="checkbox" aria-label="Select ${escapeHtml(getTaskLabel(task))}" /></td>
        <td>${escapeHtml(getTaskLabel(task))}</td>
        <td>${escapeHtml(operation?.batchName || "-")}</td>
        <td>${escapeHtml(person?.name || "Unassigned")}</td>
        <td>${Number(task.taskCount || 0)}</td>
        <td><input class="table-input" data-pay-per-task="${task.id}" type="number" min="0" step="0.01" value="${Number(task.payPerTask || 0)}" aria-label="Pay per task for ${escapeHtml(getTaskLabel(task))}" /></td>
        <td>${formatMoney(getTotalAmount(task))}</td>
        <td>${formatDate(task.startDate)}</td>
        <td>${formatDate(task.deadlineDate)}</td>
        <td>
          <select class="table-select" data-payment-status="${task.id}" aria-label="Payment status for ${escapeHtml(getTaskLabel(task))}">
            ${["Unpaid", "Pending approval", "Paid"].map((status) => `<option ${status === task.paymentStatus ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </td>
      </tr>
    `;
  }).join("");
  document.querySelectorAll("[data-pay-per-task]").forEach((input) => {
    input.addEventListener("change", () => updateTask(input.dataset.payPerTask, { payPerTask: Number(input.value) }));
  });
  document.querySelectorAll("[data-payment-status]").forEach((select) => {
    select.addEventListener("change", () => updateTask(select.dataset.paymentStatus, { paymentStatus: select.value }));
  });
}

function renderNotifications() {
  const sorted = [...state.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  els.recentNotifications.innerHTML = sorted.slice(0, 4).map(renderNotification).join("") || `<div class="empty">No notifications yet.</div>`;
  els.notificationList.innerHTML = sorted.map(renderNotification).join("") || `<div class="empty">No notifications yet.</div>`;
  document.querySelectorAll("[data-read-note]").forEach((button) => {
    button.addEventListener("click", () => {
      const note = state.notifications.find((item) => item.id === button.dataset.readNote);
      if (note) note.read = true;
      saveState();
      renderNotifications();
      renderMetrics();
    });
  });
}

function renderNotification(note) {
  return `
    <article class="notification-item ${note.read ? "" : "unread"}">
      <strong>${escapeHtml(note.type)}</strong>
      <p>${escapeHtml(note.message)}</p>
      <div class="notification-time">${formatDateTime(note.createdAt)}</div>
      ${note.read ? "" : `<button class="link-btn" data-read-note="${note.id}" type="button">Mark read</button>`}
    </article>
  `;
}

function updateTask(taskId, patch) {
  const task = state.tasks.find((item) => item.id === taskId);
  Object.assign(task, patch);
  if (patch.status === "Completed" && task.paymentStatus !== "Paid") {
    state.notifications.push({
      id: uid("note"),
      type: "Payment pending",
      message: `${getTaskLabel(task)} is complete and ready for payment review.`,
      taskId: task.id,
      freelancerId: task.freelancerId,
      read: false,
      createdAt: new Date().toISOString()
    });
  }
  saveState();
  render();
}

function prepareTaskModal() {
  document.getElementById("taskId").value = "";
  document.getElementById("taskForm").reset();
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.querySelector("#taskForm [name='startDate']").value = today.toISOString().slice(0, 10);
  document.querySelector("#taskForm [name='deadlineDate']").value = nextWeek.toISOString().slice(0, 10);
  renderTaskSelectors();
  renderOperationSelectors();
}

function createAssignmentNotification(task) {
  const person = findFreelancer(task.freelancerId);
  state.notifications.push({
    id: uid("note"),
    type: "Task assigned",
    message: `${getTaskLabel(task)} assigned to ${person?.name || "a freelancer"}.`,
    taskId: task.id,
    freelancerId: task.freelancerId,
    read: false,
    createdAt: new Date().toISOString()
  });
}

function openEmailDraft(task) {
  const person = findFreelancer(task.freelancerId);
  if (!person) return;
  const replacements = {
    "{{freelancerName}}": person.name,
    "{{taskType}}": getTaskType(task),
    "{{taskCount}}": Number(task.taskCount || 0),
    "{{startDate}}": formatDate(task.startDate),
    "{{deadlineDate}}": formatDate(task.deadlineDate),
    "{{brief}}": task.brief,
    "{{senderName}}": state.emailSettings.senderName,
    "{{senderEmail}}": state.emailSettings.senderEmail
  };
  let subject = state.emailTemplate.subject;
  let body = state.emailTemplate.body;
  Object.entries(replacements).forEach(([token, value]) => {
    subject = subject.replaceAll(token, value);
    body = body.replaceAll(token, value);
  });
  const signature = `\n\n--\n${state.emailSettings.senderName}\n${state.emailSettings.senderEmail}`;
  window.location.href = `mailto:${encodeURIComponent(person.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + signature)}`;
}

function findFreelancer(id) {
  return state.freelancers.find((person) => person.id === id);
}

function findOperation(id) {

  return state.operations.find(
    op => op.id === id
  );

}

function getTaskType(task) {
  return task.taskType || "Others";
}

function getTaskLabel(task) {
  return getTaskType(task);
}

function getTotalAmount(task) {
  return Number(task.taskCount || 0) * Number(task.payPerTask || 0);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function className(value) {
  return String(value).toLowerCase().replace(/\s+/g, "-").replace("in-progress", "progress").replace("pending-approval", "pending");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2800);
}

render();

document
.getElementById("openOperationModalBtn")
?.addEventListener("click", () => {

document
.getElementById("operationForm")
.reset();

document
.getElementById("operationModal")
.showModal();

});

document
.getElementById("operationForm")
?.addEventListener("submit", (event) => {

event.preventDefault();

const data =
Object.fromEntries(
new FormData(event.currentTarget)
);

state.operations.push({
  id: uid("op"),

  ...data,

  paymentStatus: "Pending",

  completionDate: ""
});
saveState();

render();

document
.getElementById("operationModal")
.close();

toast("Operation added.");

});

function renderOperations() {

  const grid =
    document.getElementById(
      "operationsGrid"
    );

  if (!grid) return;

  grid.innerHTML =
    state.operations.map(op => {

      const assigned =
        state.tasks
          .filter(
            task =>
              task.operationId === op.id
          )
          .reduce(
            (sum, task) =>
              sum +
              Number(
                task.taskCount || 0
              ),
            0
          );

      const pending =
Math.max(
  0,
  Number(op.volume || 0) - assigned
);

const progress =
Math.min(
  100,
  Math.round(
    (assigned / Number(op.volume)) * 100
  )
);

const completed =
assigned >= Number(op.volume);

if (
completed &&
op.status !== "Completed"
) {

  op.status = "Completed";

  saveState();

}

const deadline =
new Date(op.deadlineDate);

const daysLeft =
Math.ceil(
(deadline - new Date())
/ 86400000
);

let health = "Healthy";

if (daysLeft < 0) {
  health = "Delayed";
}
else if (daysLeft <= 3) {
  health = "Due Soon";
}

      return `

<div class="operation-card">

<h3>
${escapeHtml(op.batchName)}
</h3>

<p>
Client:
${escapeHtml(op.source || "-")}
</p>

<p>
Task Type:
${escapeHtml(op.taskType)}
</p>

<p>
Language:
${escapeHtml(op.language)}
</p>

<p>
Status:
${escapeHtml(op.status)}
</p>

<p>
Health:
<span class="health-${health
  .toLowerCase()
  .replace(" ","-")}">
  ${health}
</span>
</p>

<div class="progress">
<div
class="progress-fill"
style="width:${progress}%">
</div>
</div>

<p>
Progress:
${progress}%
</p>

<p>
Volume:
${op.volume}
</p>

<p>
Assigned:
${assigned}
</p>

<p>
Pending:
${pending}
</p>

<p>
Days Left:
${daysLeft}
</p>

<p>
Deadline:
${formatDate(op.deadlineDate)}
</p>

</div>
`;

    }).join("");
}

function renderOperationTaskTypes() {

  const select =
    document.getElementById(
      "operationTaskType"
    );

  if (!select) return;

  select.innerHTML =
    taskTypes.map(type => `
      <option value="${type}">
        ${type}
      </option>
    `).join("");
}

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker.register(
      "./service-worker.js"
    );

  });

}

function exportData() {

  const data = JSON.stringify(
    state,
    null,
    2
  );

  const blob = new Blob(
    [data],
    {
      type: "application/json"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    `oms-backup-${
      new Date()
        .toISOString()
        .split("T")[0]
    }.json`;

  a.click();

  URL.revokeObjectURL(url);

}

function importData(file) {

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

      toast("Import started");
      toast("File type: " + extension);

  // JSON Import
  if (extension === "json" ||
    extension === "xlsx" ||
  extension === "xls" ||
  extension === "csv"
  ) {

    const reader =
      new FileReader();

    reader.onload = (e) => {

      try {

        const imported =
          JSON.parse(
            e.target.result
          );

        Object.assign(
          state,
          normalizeState(imported)
        );

        saveState();
        render();

        toast(
          "JSON imported successfully."
        );

      } catch (err) {

        console.error(err);

        toast(
          "Invalid JSON file."
        );

      }

    };

    reader.readAsText(file);

    return;
  }

  // Excel Import
  if (
    extension === "xlsx" ||
    extension === "xls" ||
    extension === "csv"
  ) {

    if (typeof XLSX === "undefined") {

      toast(
        "Excel library not loaded."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = (e) => {

      try {

        const workbook =
          XLSX.read(
            e.target.result,
            {
              type: "array"
            }
          );

        const sheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];

        const rows =
          XLSX.utils.sheet_to_json(
            sheet
          );

        importFreelancers(rows);

      } catch (err) {

        console.error(err);

        toast(
          "Invalid Excel file."
        );

      }

    };

    reader.readAsArrayBuffer(
      file
    );

    return;
  }

  toast(
    "Unsupported file type."
  );

}

function importFreelancers(rows) {

  rows.forEach(row => {

    state.freelancers.push({

      id: uid("fr"),

      name:
        row.Name || "",

      email:
        row.Email || "",

      mobile:
        row.Mobile || "",

      role:
        row.Role || "",

      state:
        row.State || "",

      district:
        row.District || "",

      language:
        row.Language || "",

      rate:
        row.Rate || "",

      status:
        row.Status ||
        "Available"

    });

  });

  saveState();

  render();

  toast(
    `${rows.length} freelancers imported`
  );

}

 let deferredPrompt;

window.addEventListener(
  "beforeinstallprompt",
  (event) => {

    event.preventDefault();

    deferredPrompt = event;

    document
      .getElementById("installBtn")
      .hidden = false;

  }
);

document
  .getElementById("installBtn")
  ?.addEventListener(
    "click",
    async () => {

      if (!deferredPrompt) {
  toast("Install option not available yet.");
  return;
}
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;

      deferredPrompt = null;

      document
        .getElementById("installBtn")
        .hidden = true;

    }
  );