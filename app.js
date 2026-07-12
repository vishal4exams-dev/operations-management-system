const SUPABASE_URL =
  "https://ddrimxgqytfprphhazgb.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcmlteGdxeXRmcHJwaGhhemdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjE2NzAsImV4cCI6MjA5NjMzNzY3MH0.ycOW16LmqGZny6cTBgQg4lQ_XKQXtBu6sXsFDRnHsFo";

const supabaseClient =
  window.supabase?.createClient
    ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    )
    : createLocalSupabaseFallback();

const EMAIL_FUNCTION_NAME = "send-email";

  const STORAGE_KEY = "freelancer-management-system-v1";
const SESSION_KEY = "freelancer-management-session-v1";
const SESSION_EMAIL_KEY = "freelancer-management-session-email-v1";
const SESSION_NAME_KEY = "freelancer-management-session-name-v1";

const roleOrder = ["admin", "manager", "associate", "executive"];
const roleLabels = {
  admin: "Admin",
  manager: "Manager",
  associate: "Associate",
  executive: "Executive"
};
const reportRequiredRoles = ["associate", "executive"];
const APPROVAL_REQUESTS_TABLE = "approval_requests";
const PROFILES_TABLE = "profiles";
const DAILY_REPORTS_TABLE = "daily_reports";
const NOTIFICATIONS_TABLE = "notifications";
const DAILY_REPORT_DEADLINE_HOUR = 19;

let approvalRequestsSyncing = false;
let approvalRequestsLoaded = false;
let approvalRequestsLoadAttempted = false;
let approvalRequestsSyncError = "";
let profilesSyncing = false;
let profilesLoaded = false;
let profilesLoadAttempted = false;
let profilesSyncError = "";
let dailyReportsSyncing = false;
let dailyReportsLoaded = false;
let dailyReportsLoadAttempted = false;
let dailyReportsSyncError = "";
let notificationsSyncing = false;
let notificationsLoaded = false;
let notificationsLoadAttempted = false;
let notificationsSyncError = "";
const browserNotifiedIds = new Set();

function createLocalSupabaseFallback() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signInWithPassword: async ({ email }) => ({
        data: {
          user: {
            id: "local-demo-user",
            email
          }
        },
        error: null
      }),
      signUp: async ({ email }) => ({
        data: {
          user: {
            id: "local-demo-user",
            email
          }
        },
        error: null
      }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ error: null }),
      updateUser: async () => ({ error: null })
    },
    functions: {
      invoke: async () => ({ data: { ok: true, local: true }, error: null })
    }
  };
}

function isLocalPreview() {
  return ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
}

function getPasswordResetRedirectUrl() {
  const url = new URL(window.location.href);
  url.search = "?reset=password";
  url.hash = "";
  return url.toString();
}

function isPasswordResetMode() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return search.get("reset") === "password" ||
    search.get("type") === "recovery" ||
    hash.get("type") === "recovery";
}

function clearPasswordResetUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("reset");
  url.searchParams.delete("type");
  url.searchParams.delete("code");
  url.hash = "";
  window.history.replaceState({}, document.title, url.pathname + url.search);
}

async function ensurePasswordRecoverySession() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    return true;
  }

  const code = new URLSearchParams(window.location.search).get("code");

  if (!code || typeof supabaseClient.auth.exchangeCodeForSession !== "function") {
    return true;
  }

  const { error } =
    await supabaseClient.auth.exchangeCodeForSession(window.location.href);

  if (error) {
    toast(error.message);
    return false;
  }

  return true;
}


  supabaseClient.auth.getSession()
.then(async ({ data }) => {

  if (isPasswordResetMode()) {
    if (!data.session) {
      await ensurePasswordRecoverySession();
    }
    setAuthMode("reset");
    updateAuthView();
    return;
  }

  if (data.session) {

    if (await applyLoggedInUser(data.session.user)) {
      queueDeadlineEmails();
    }

  }

});

const statuses = ["Briefed", "In Progress", "Review", "Rework", "Completed"];
const taskTypes = ["Transcription QC", "Audio QC", "Annotation", "Speech Recording", "Image QC", "Others"];

const demoState = {
  currentProfileId: "user-admin",
  approvalRequests: [],
  profiles: [
    {
      id: "user-admin",
      name: "Vishal",
      email: "vishal4exams@gmail.com",
      role: "admin",
      reportsTo: ""
    },
    {
      id: "user-manager-1",
      name: "Operations Manager",
      email: "manager@yourdomain.com",
      role: "manager",
      reportsTo: "user-admin"
    },
    {
      id: "user-associate-1",
      name: "Associate Lead",
      email: "associate@yourdomain.com",
      role: "associate",
      reportsTo: "user-manager-1"
    },
    {
      id: "user-executive-1",
      name: "Executive Desk",
      email: "executive@yourdomain.com",
      role: "executive",
      reportsTo: "user-manager-1"
    }
  ],
  operations: [],
  freelancers: [
    {
      id: "fr-1",
      ownerId: "user-associate-1",
      name: "Aarav Mehta",
      email: "aarav.mehta@example.com",
      mobile: "919999999999",
      role: "UI Designer",
      state: "Maharashtra",
      district: "Pune",
      language: "Marathi, Hindi",
      rate: "$45/hr",
      status: "Available"
    }
  ],
  dailyReports: [
    {
      id: "report-1",
      userId: "user-associate-1",
      date: new Date().toISOString().slice(0, 10),
      todayWork: "Reviewed active freelancer assignments and followed up on pending QC.",
      tomorrowPlan: "Close review batches and redistribute delayed work.",
      roadblocks: "Awaiting one client clarification.",
      filesReviewed: 42,
      createdAt: new Date().toISOString()
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
let deadlineEmailQueueRunning = false;

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
  welcomeUser: document.getElementById("welcomeUser"),
  approvalPanel: document.getElementById("approvalPanel"),
  approvalList: document.getElementById("approvalList"),
  approvalBadge: document.getElementById("approvalBadge"),
  teamTree: document.getElementById("teamTree"),
  roleControls: document.getElementById("roleControls"),
  dailyReportForm: document.getElementById("dailyReportForm"),
  dailyReportList: document.getElementById("dailyReportList"),
  missingReportBadge: document.getElementById("missingReportBadge"),
  reportDateFilter: document.getElementById("reportDateFilter"),
  reportRoleFilter: document.getElementById("reportRoleFilter"),
  reportMemberFilter: document.getElementById("reportMemberFilter"),
  freelancerOwnerSelect: document.getElementById("freelancerOwnerSelect"),
  employeeReportsToSelect: document.getElementById("employeeReportsToSelect"),
  loginScreen: document.getElementById("loginScreen"),
  appShell: document.getElementById("appShell"),
  toast: document.getElementById("toast")
};

document.getElementById("showLoginBtn").addEventListener("click", () => setAuthMode("login"));
document.getElementById("showSignupBtn").addEventListener("click", () => setAuthMode("signup"));

if (isPasswordResetMode()) {
  setAuthMode("reset");
}

document.getElementById("loginForm")
.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email =
    document.getElementById("loginEmail")
      .value.trim();

  const password =
    document.getElementById("loginPassword")
      .value;

  let { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    const approvedProfile = findApprovedProfileByEmail(email);

    if (approvedProfile || isLocalPreview()) {
      data = {
        user: {
          id: approvedProfile?.id || "local-demo-user",
          email,
          user_metadata: {
            name: approvedProfile?.name || email.split("@")[0]
          }
        }
      };
      error = null;
    }
  }

  if (error) {

    toast(error.message);
    return;

  }

  if (!(await applyLoggedInUser(data.user))) {
    return;
  }

  toast("Login successful.");
  queueDeadlineEmails();

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

  const result = await createApprovalRequest({
    name,
    email,
    authUserId: uid("auth")
  });

  if (result.saved) {
    toast("Signup request sent to admin.");
  } else {
    toast(approvalRequestsSyncError || "Couldn't send approval request. Please try again.");
  }

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
          getPasswordResetRedirectUrl()
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

document
.getElementById("resetPasswordForm")
?.addEventListener("submit", async (event) => {

  event.preventDefault();

  const password =
    document
      .getElementById("newPassword")
      .value;

  const confirmPassword =
    document
      .getElementById("confirmNewPassword")
      .value;

  if (password !== confirmPassword) {
    toast("Passwords do not match.");
    return;
  }

  if (!(await ensurePasswordRecoverySession())) {
    return;
  }

  const { error } =
    await supabaseClient.auth.updateUser({
      password
    });

  if (error) {
    toast(error.message);
    return;
  }

  await supabaseClient.auth.signOut();
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_EMAIL_KEY);
  sessionStorage.removeItem(SESSION_NAME_KEY);
  clearPasswordResetUrl();
  setAuthMode("login");
  updateAuthView();
  event.currentTarget.reset();
  toast("Password updated. Please login.");

});

document.getElementById("logoutBtn").addEventListener("click", async () => {

  await supabaseClient.auth.signOut();

  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_EMAIL_KEY);
  sessionStorage.removeItem(SESSION_NAME_KEY);

  updateAuthView();

});

document.getElementById("openTaskModalBtn").addEventListener("click", () => {
  prepareTaskModal();
  document.getElementById("taskModal").showModal();
});

document.getElementById("openFreelancerModalBtn").addEventListener("click", () => {
  document.getElementById("freelancerForm").reset();
  document.getElementById("freelancerId").value = "";
  renderFreelancerOwnerSelect();
  document.getElementById("freelancerModal").showModal();
});

document.getElementById("openEmployeeModalBtn")?.addEventListener("click", () => {
  if (getCurrentProfile().role !== "admin") {
    toast("Only admin can assign roles.");
    return;
  }

  document.getElementById("employeeForm").reset();
  document.getElementById("employeeId").value = "";
  renderEmployeeReportsToSelect();
  document.getElementById("employeeModal").showModal();
});

document.getElementById("checkMissingReportsBtn")?.addEventListener("click", async () => {
  await ensureBrowserNotificationPermission();
  await checkDailyReportDeadline({ force: true });
  const missing = getMissingDailyReports();
  toast(
    missing.length
      ? `${missing.length} team member(s) have not filled today's report.`
      : "Everyone visible has filled today's report."
  );
  renderDailyReports();
});

document.getElementById("refreshApprovalRequestsBtn")?.addEventListener("click", async () => {
  const synced = await syncApprovalRequestsFromSupabase({ force: true });
  toast(
    synced
      ? "Approval requests refreshed."
      : approvalRequestsSyncError || "No remote approval requests found."
  );
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

document.getElementById("markPaidBtn").addEventListener("click", async () => {
  const selected = [...document.querySelectorAll(".payment-check:checked")].map((box) => box.value);

  for (const taskId of selected) {
    await updateTask(taskId, { paymentStatus: "Paid" });
  }

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

    e.target.value = "";

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

document.getElementById("employeeForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (getCurrentProfile().role !== "admin") {
    toast("Only admin can assign roles.");
    return;
  }

  const data = Object.fromEntries(
    new FormData(event.currentTarget)
  );

  if (!data.reportsTo && data.role !== "admin") {
    toast("Select who this employee reports to.");
    return;
  }

  if (data.id) {
    const index = state.profiles.findIndex(profile => profile.id === data.id);
    const profile = {
      ...state.profiles[index],
      ...data
    };

    if (!(await saveProfileToSupabase(profile))) {
      toast(profilesSyncError || "Employee could not be saved to Supabase.");
      return;
    }

    state.profiles[index] = profile;
    toast("Employee updated.");
  } else {
    const profile = {
      id: uid("user"),
      status: "active",
      ...data
    };

    if (!(await saveProfileToSupabase(profile))) {
      toast(profilesSyncError || "Employee could not be saved to Supabase.");
      return;
    }

    state.profiles.push(profile);
    toast("Employee added.");
  }

  saveState();
  render();
  document.getElementById("employeeModal").close();
});

els.dailyReportForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = Object.fromEntries(
    new FormData(event.currentTarget)
  );

  const profile = getCurrentProfile();

  if (!isReportRequiredProfile(profile)) {
    toast("Only associates and executives submit EOD reports.");
    return;
  }

  const existing = state.dailyReports.find(
    report => report.userId === profile.id && report.date === data.date
  );

  const reportData = {
    id: existing?.id || uid("report"),
    userId: profile.id,
    date: data.date,
    todayWork: data.todayWork,
    tomorrowPlan: data.tomorrowPlan,
    roadblocks: data.roadblocks || "None",
    filesReviewed: Number(data.filesReviewed || 0),
    createdAt: new Date().toISOString()
  };

  if (!(await saveDailyReportToSupabase(reportData))) {
    toast(dailyReportsSyncError || "Daily report could not be saved to Supabase.");
    return;
  }

  if (existing) {
    Object.assign(existing, reportData);
    toast("Daily report updated.");
  } else {
    state.dailyReports.push(reportData);
    toast("Daily report submitted.");
  }

  await notifyReportSubmitted(reportData, profile);
  saveState();
  renderDailyReports();
  renderTeam();
  renderNotifications();
});

document.getElementById("taskForm").addEventListener("submit", async (event) => {
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
      const previousTask =
        { ...state.tasks[index] };

      state.tasks[index] = {
        ...state.tasks[index],
        ...data,
        ownerId: findFreelancer(data.freelancerId)?.ownerId || state.tasks[index].ownerId || getCurrentProfile().id,
        taskCount: Number(data.taskCount)
      };

      await sendTaskUpdateEmail(
        state.tasks[index],
        previousTask
      );
    }

    toast("Task updated.");

  } else {

    const task = {
      id: uid("task"),
      operationId: data.operationId,
      taskType: data.taskType,
      freelancerId: data.freelancerId,
      ownerId: findFreelancer(data.freelancerId)?.ownerId || getCurrentProfile().id,
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

    const emailSent =
      await sendTaskAssignmentEmail(task);

    toast(
      emailSent
        ? "Task assigned and email sent."
        : "Task assigned, but email could not be sent."
    );
  }

  saveState();
  render();

  document.getElementById("taskModal").close();
});

els.taskFreelancerFilter.addEventListener("change", renderTasks);
els.taskTypeFilter.addEventListener("change", renderTasks);
els.taskStatusFilter.addEventListener("change", renderTasks);
els.globalSearch.addEventListener("input", render);
document.getElementById("taskSearch")?.addEventListener("input", renderTasks);
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

els.reportDateFilter
  ?.addEventListener("change", renderDailyReports);

els.reportRoleFilter
  ?.addEventListener("change", renderDailyReports);

els.reportMemberFilter
  ?.addEventListener("change", renderDailyReports);

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

function normalizeState(nextState = {}) {
  const normalized = {
    ...clone(demoState),
    ...nextState
  };

  normalized.operations = Array.isArray(nextState.operations)
    ? nextState.operations
    : [];

  normalized.profiles = Array.isArray(nextState.profiles)
    ? nextState.profiles.map(profile => ({
      ...profile,
      role: profile.role || "executive",
      reportsTo: profile.reportsTo || "",
      status: profile.status || "active"
    }))
    : clone(demoState.profiles);

  normalized.approvalRequests = Array.isArray(nextState.approvalRequests)
    ? nextState.approvalRequests.map(request => ({
      ...request,
      status: request.status || "pending",
      createdAt: request.createdAt || new Date().toISOString()
    }))
    : [];

  if (!normalized.profiles.some(profile => profile.role === "admin")) {
    normalized.profiles.unshift(clone(demoState.profiles[0]));
  }

  const seededAdmin = normalized.profiles.find(profile => profile.id === "user-admin");
  if (seededAdmin?.name === "Admin User") {
    seededAdmin.name = "Vishal";
  }
  if (seededAdmin && sameEmail(seededAdmin.email, "admin@yourdomain.com")) {
    seededAdmin.email = "vishal4exams@gmail.com";
  }

  const seededExecutive = normalized.profiles.find(profile => profile.id === "user-executive-1");
  if (seededExecutive?.reportsTo === "user-associate-1") {
    seededExecutive.reportsTo = "user-manager-1";
  }

  const fallbackOwner =
    normalized.profiles.find(profile => profile.role === "associate")?.id ||
    normalized.profiles.find(profile => profile.role === "executive")?.id ||
    normalized.profiles[0]?.id ||
    "user-admin";

  normalized.currentProfileId =
    normalized.profiles.find(profile =>
      sameEmail(profile.email, sessionStorage.getItem(SESSION_EMAIL_KEY))
    )?.id ||
    nextState.currentProfileId ||
    normalized.profiles[0]?.id ||
    "user-admin";

  if (!normalized.profiles.some(profile => profile.id === normalized.currentProfileId)) {
    normalized.currentProfileId = normalized.profiles[0]?.id || "user-admin";
  }

  normalized.freelancers = Array.isArray(nextState.freelancers)
    ? nextState.freelancers.map(person => ({
      ...person,
      ownerId: person.ownerId || fallbackOwner,
      mobile: person.mobile || "",
      state: person.state || "",
      district: person.district || "",
      language: person.language || ""
    }))
    : [];

  normalized.emailTemplate = {
    ...clone(demoState.emailTemplate),
    ...(nextState.emailTemplate || {})
  };

  normalized.emailSettings = {
    ...clone(demoState.emailSettings),
    ...(nextState.emailSettings || {})
  };
  // nextState.users = nextState.users || [
  //   {
  //     id: "user-admin",
  //     name: "Admin",
  //     email: nextState.login?.email || "admin@yourdomain.com",
  //     password: nextState.login?.password || "admin123"
  //   }
  // ];
  normalized.tasks = Array.isArray(nextState.tasks)
    ? nextState.tasks.map((task) => ({
    ...task,
    ownerId: task.ownerId || normalized.freelancers.find(person => person.id === task.freelancerId)?.ownerId || fallbackOwner,
    taskType: task.taskType || "Others",
    taskCount: Number(task.taskCount || 1),
    payPerTask: Number(task.payPerTask ?? task.amount ?? 0),
    startDate: task.startDate || new Date().toISOString().slice(0, 10),
    deadlineDate: task.deadlineDate || task.due || new Date().toISOString().slice(0, 10)
  }))
    : [];

  normalized.notifications = Array.isArray(nextState.notifications)
    ? nextState.notifications
    : [];

  normalized.dailyReports = Array.isArray(nextState.dailyReports)
    ? nextState.dailyReports.map(report => ({
      ...report,
      roadblocks: report.roadblocks || "None",
      filesReviewed: Number(report.filesReviewed || 0)
    }))
    : [];

  normalized.emailEvents =
    nextState.emailEvents || {};

  normalized.emailTemplate.subject =
    String(normalized.emailTemplate.subject || demoState.emailTemplate.subject)
      .replaceAll("{{taskTitle}}", "{{taskType}}");

  normalized.emailTemplate.body =
    String(normalized.emailTemplate.body || demoState.emailTemplate.body)
    .replaceAll("{{taskTitle}}", "{{taskType}}")
    .replaceAll("{{dueDate}}", "{{deadlineDate}}")
    .replaceAll("Due date:", "Deadline date:")
    .replace(/\nPayment: \$\{\{amount\}\}/g, "");
  return normalized;
}

function updateAuthView() {

  const hasSession =
    !isPasswordResetMode() &&
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
  const isReset = mode === "reset";
  document.getElementById("signupForm").classList.toggle("hidden", !isSignup);
  document.getElementById("resetPasswordForm")?.classList.toggle("hidden", !isReset);
  document.getElementById("loginForm").classList.toggle("hidden", isSignup || isReset);
  document.getElementById("showSignupBtn").classList.toggle("active", isSignup);
  document.getElementById("showLoginBtn").classList.toggle("active", !isSignup && !isReset);
}

function sameEmail(left, right) {
  return String(left || "").trim().toLowerCase() ===
    String(right || "").trim().toLowerCase();
}

function getUserNameFromAuth(user) {
  return user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
}

function findApprovedProfileByEmail(email) {
  return state.profiles.find(profile =>
    (!profile.status || profile.status === "active") &&
    sameEmail(profile.email, email)
  );
}

function findPendingApprovalByEmail(email) {
  return state.approvalRequests.find(request =>
    request.status === "pending" && sameEmail(request.email, email)
  );
}

function canSyncApprovalRequests() {
  return typeof supabaseClient.from === "function";
}

function canSyncProfiles() {
  return typeof supabaseClient.from === "function";
}

function canSyncDailyReports() {
  return typeof supabaseClient.from === "function";
}

function canSyncNotifications() {
  return typeof supabaseClient.from === "function";
}

function profileToRow(profile) {
  return {
    id: profile.id,
    name: profile.name || "",
    email: profile.email || "",
    role: profile.role || "executive",
    reports_to: profile.reportsTo || "",
    status: profile.status || "active",
    created_at: profile.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function profileFromRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    role: row.role || "executive",
    reportsTo: row.reports_to || "",
    status: row.status || "active",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || ""
  };
}

function mergeProfiles(profiles) {
  let changed = false;

  profiles.forEach(profile => {
    const index = state.profiles.findIndex(item =>
      item.id === profile.id || sameEmail(item.email, profile.email)
    );

    if (profile.status === "removed") {
      if (index >= 0 && state.profiles[index].role !== "admin") {
        state.profiles.splice(index, 1);
        changed = true;
      }
      return;
    }

    if (index >= 0) {
      state.profiles[index] = {
        ...state.profiles[index],
        ...profile
      };
    } else {
      state.profiles.push(profile);
    }
    changed = true;
  });

  if (!state.profiles.some(profile => profile.role === "admin")) {
    state.profiles.unshift(clone(demoState.profiles[0]));
    changed = true;
  }

  if (!state.profiles.some(profile => profile.id === state.currentProfileId)) {
    state.currentProfileId = state.profiles[0]?.id || "user-admin";
    changed = true;
  }

  return changed;
}

async function syncProfilesFromSupabase({ force = false } = {}) {
  if (!canSyncProfiles() || profilesSyncing) return false;
  if (profilesLoaded && !force) return false;

  profilesSyncing = true;
  profilesLoadAttempted = true;

  try {
    const { data, error } = await supabaseClient
      .from(PROFILES_TABLE)
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (mergeProfiles((data || []).map(profileFromRow))) {
      saveState();
    }

    profilesLoaded = true;
    profilesSyncError = "";
    render();
    return true;
  } catch (error) {
    console.warn("Profile Supabase load skipped", error);
    profilesSyncError =
      error?.message ||
      "Profiles table is not reachable. Run the Supabase live sync SQL.";
    render();
    return false;
  } finally {
    profilesSyncing = false;
  }
}

async function saveProfileToSupabase(profile) {
  if (!canSyncProfiles()) return true;

  try {
    const { error } = await supabaseClient
      .from(PROFILES_TABLE)
      .upsert(profileToRow(profile), {
        onConflict: "id"
      });

    if (error) throw error;
    profilesSyncError = "";
    profilesLoaded = false;
    return true;
  } catch (error) {
    console.warn("Profile Supabase sync failed", error);
    profilesSyncError =
      error?.message ||
      "Profiles table is not reachable. Run the Supabase live sync SQL.";
    return false;
  }
}

async function removeProfileFromSupabase(profile) {
  return saveProfileToSupabase({
    ...profile,
    status: "removed",
    removedAt: new Date().toISOString()
  });
}

function dailyReportToRow(report) {
  return {
    id: report.id,
    user_id: report.userId || "",
    date: report.date || getTodayKey(),
    today_work: report.todayWork || "",
    tomorrow_plan: report.tomorrowPlan || "",
    roadblocks: report.roadblocks || "None",
    files_reviewed: Number(report.filesReviewed || 0),
    created_at: report.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function dailyReportFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id || "",
    date: row.date || getTodayKey(),
    todayWork: row.today_work || "",
    tomorrowPlan: row.tomorrow_plan || "",
    roadblocks: row.roadblocks || "None",
    filesReviewed: Number(row.files_reviewed || 0),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || ""
  };
}

function mergeDailyReports(reports) {
  let changed = false;

  reports.forEach(report => {
    const index = state.dailyReports.findIndex(item =>
      item.id === report.id ||
      (item.userId === report.userId && item.date === report.date)
    );

    if (index >= 0) {
      state.dailyReports[index] = {
        ...state.dailyReports[index],
        ...report
      };
    } else {
      state.dailyReports.push(report);
    }
    changed = true;
  });

  return changed;
}

async function syncDailyReportsFromSupabase({ force = false } = {}) {
  if (!canSyncDailyReports() || dailyReportsSyncing) return false;
  if (dailyReportsLoaded && !force) return false;

  dailyReportsSyncing = true;
  dailyReportsLoadAttempted = true;

  try {
    const { data, error } = await supabaseClient
      .from(DAILY_REPORTS_TABLE)
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;

    if (mergeDailyReports((data || []).map(dailyReportFromRow))) {
      saveState();
    }

    dailyReportsLoaded = true;
    dailyReportsSyncError = "";
    renderDailyReports();
    return true;
  } catch (error) {
    console.warn("Daily report Supabase load skipped", error);
    dailyReportsSyncError =
      error?.message ||
      "Daily reports table is not reachable. Run the Supabase live sync SQL.";
    renderDailyReports();
    return false;
  } finally {
    dailyReportsSyncing = false;
  }
}

async function saveDailyReportToSupabase(report) {
  if (!canSyncDailyReports()) return true;

  try {
    const { error } = await supabaseClient
      .from(DAILY_REPORTS_TABLE)
      .upsert(dailyReportToRow(report), {
        onConflict: "user_id,date"
      });

    if (error) throw error;
    dailyReportsLoaded = false;
    dailyReportsSyncError = "";
    return true;
  } catch (error) {
    console.warn("Daily report Supabase sync failed", error);
    dailyReportsSyncError =
      error?.message ||
      "Daily reports table is not reachable. Run the Supabase live sync SQL.";
    return false;
  }
}

function notificationToRow(note) {
  return {
    id: note.id,
    type: note.type || "Notification",
    message: note.message || "",
    read: !!note.read,
    target_profile_id: note.targetProfileId || "",
    freelancer_id: note.freelancerId || "",
    task_id: note.taskId || "",
    meta_key: note.metaKey || "",
    created_at: note.createdAt || new Date().toISOString()
  };
}

function notificationFromRow(row) {
  return {
    id: row.id,
    type: row.type || "Notification",
    message: row.message || "",
    read: !!row.read,
    targetProfileId: row.target_profile_id || "",
    freelancerId: row.freelancer_id || "",
    taskId: row.task_id || "",
    metaKey: row.meta_key || "",
    createdAt: row.created_at || new Date().toISOString()
  };
}

function mergeNotifications(notifications, { showBrowser = false } = {}) {
  let changed = false;

  notifications.forEach(note => {
    const existing = state.notifications.find(item =>
      item.id === note.id ||
      (note.metaKey && item.metaKey === note.metaKey && item.targetProfileId === note.targetProfileId)
    );

    if (existing) {
      Object.assign(existing, note);
    } else {
      state.notifications.push(note);
    }

    if (showBrowser) {
      maybeShowBrowserNotification(note);
    }
    changed = true;
  });

  return changed;
}

async function syncNotificationsFromSupabase({ force = false } = {}) {
  if (!canSyncNotifications() || notificationsSyncing) return false;
  if (notificationsLoaded && !force) return false;

  notificationsSyncing = true;
  notificationsLoadAttempted = true;

  try {
    const { data, error } = await supabaseClient
      .from(NOTIFICATIONS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (mergeNotifications((data || []).map(notificationFromRow), { showBrowser: true })) {
      saveState();
    }

    notificationsLoaded = true;
    notificationsSyncError = "";
    renderNotifications();
    return true;
  } catch (error) {
    console.warn("Notification Supabase load skipped", error);
    notificationsSyncError =
      error?.message ||
      "Notifications table is not reachable. Run the Supabase live sync SQL.";
    return false;
  } finally {
    notificationsSyncing = false;
  }
}

async function saveNotificationToSupabase(note) {
  if (!canSyncNotifications()) return true;

  try {
    const { error } = await supabaseClient
      .from(NOTIFICATIONS_TABLE)
      .upsert(notificationToRow(note), {
        onConflict: "id"
      });

    if (error) throw error;
    notificationsLoaded = false;
    notificationsSyncError = "";
    return true;
  } catch (error) {
    console.warn("Notification Supabase sync failed", error);
    notificationsSyncError =
      error?.message ||
      "Notifications table is not reachable. Run the Supabase live sync SQL.";
    return false;
  }
}

async function addNotification(note, { browser = false } = {}) {
  const nextNote = {
    id: note.id || uid("note"),
    type: note.type || "Notification",
    message: note.message || "",
    read: !!note.read,
    createdAt: note.createdAt || new Date().toISOString(),
    ...note
  };

  const existing = state.notifications.find(item =>
    item.id === nextNote.id ||
    (nextNote.metaKey && item.metaKey === nextNote.metaKey && item.targetProfileId === nextNote.targetProfileId)
  );

  if (existing) {
    Object.assign(existing, nextNote);
  } else {
    state.notifications.push(nextNote);
  }

  await saveNotificationToSupabase(existing || nextNote);

  if (browser) {
    maybeShowBrowserNotification(existing || nextNote);
  }

  return existing || nextNote;
}

function canCurrentProfileSeeNotification(note) {
  const current = getCurrentProfile();

  if (!note.targetProfileId) return true;
  if (note.targetProfileId === current.id) return true;
  if (current.role === "admin") return true;

  return getDescendantProfileIds(current.id).includes(note.targetProfileId);
}

async function ensureBrowserNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

async function showBrowserNotification(title, body, tag = "") {
  if (!(await ensureBrowserNotificationPermission())) return;

  const options = {
    body,
    tag,
    icon: "icon-192.png",
    badge: "icon-192.png"
  };

  try {
    const registration = "serviceWorker" in navigator
      ? await navigator.serviceWorker.ready
      : null;

    if (registration?.showNotification) {
      registration.showNotification(title, options);
      return;
    }
  } catch (error) {
    console.warn("Service worker notification skipped", error);
  }

  new Notification(title, options);
}

function maybeShowBrowserNotification(note) {
  if (!note || note.read || browserNotifiedIds.has(note.id)) return;
  if (!canCurrentProfileSeeNotification(note)) return;

  browserNotifiedIds.add(note.id);
  showBrowserNotification(note.type || "Operations Desk", note.message || "", note.metaKey || note.id);
}

function isWeekday(date = new Date()) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function isAfterDailyReportDeadline(date = new Date()) {
  return isWeekday(date) && date.getHours() >= DAILY_REPORT_DEADLINE_HOUR;
}

function getManagerForProfile(profile) {
  return state.profiles.find(item => item.id === profile.reportsTo) ||
    state.profiles.find(item => item.role === "admin") ||
    null;
}

async function notifyReportSubmitted(report, profile = getCurrentProfile()) {
  await addNotification({
    type: "Daily report submitted",
    message: `Thank you ${profile.name}, your ${formatDate(report.date)} report has been submitted.`,
    targetProfileId: profile.id,
    metaKey: `daily-report-submitted-${report.date}-${profile.id}`
  }, {
    browser: true
  });
}

async function notifyMissingDailyReport(profile, date) {
  const manager = getManagerForProfile(profile);
  const targets = [profile.id, manager?.id].filter(Boolean);

  for (const targetProfileId of [...new Set(targets)]) {
    await addNotification({
      type: "Daily report missing",
      message: `${profile.name} has not submitted the ${formatDate(date)} daily report by 7 PM.`,
      targetProfileId,
      metaKey: `daily-report-missing-${date}-${profile.id}-${targetProfileId}`
    }, {
      browser: true
    });
  }
}

async function checkDailyReportDeadline({ force = false } = {}) {
  const now = new Date();
  const date = getTodayKey();

  if (!force && !isAfterDailyReportDeadline(now)) return;

  await syncDailyReportsFromSupabase();

  const missing = state.profiles
    .filter(profile => (!profile.status || profile.status === "active"))
    .filter(isReportRequiredProfile)
    .filter(profile => !getReportFor(profile.id, date));

  for (const profile of missing) {
    await notifyMissingDailyReport(profile, date);
  }

  if (missing.length) {
    saveState();
    renderNotifications();
  }
}

function startDailyReportDeadlineMonitor() {
  if (startDailyReportDeadlineMonitor.timer) return;

  checkDailyReportDeadline();
  startDailyReportDeadlineMonitor.timer = setInterval(
    () => checkDailyReportDeadline(),
    60 * 1000
  );
}

function approvalRequestToRow(request) {
  return {
    id: request.id,
    auth_user_id: request.authUserId || "",
    name: request.name || "",
    email: request.email || "",
    status: request.status || "pending",
    requested_role: request.requestedRole || "",
    reports_to: request.reportsTo || "",
    created_at: request.createdAt || new Date().toISOString(),
    approved_at: request.approvedAt || null,
    approved_by: request.approvedBy || "",
    denied_at: request.deniedAt || null,
    denied_by: request.deniedBy || ""
  };
}

function approvalRequestFromRow(row) {
  return {
    id: row.id,
    authUserId: row.auth_user_id || "",
    name: row.name || "",
    email: row.email || "",
    status: row.status || "pending",
    requestedRole: row.requested_role || "",
    reportsTo: row.reports_to || "",
    createdAt: row.created_at || new Date().toISOString(),
    approvedAt: row.approved_at || "",
    approvedBy: row.approved_by || "",
    deniedAt: row.denied_at || "",
    deniedBy: row.denied_by || ""
  };
}

function mergeApprovalRequests(requests) {
  requests.forEach(request => {
    const existing = state.approvalRequests.find(item => item.id === request.id) ||
      state.approvalRequests.find(item =>
        item.status === "pending" &&
        request.status === "pending" &&
        sameEmail(item.email, request.email)
      );

    if (existing) {
      Object.assign(existing, request);
    } else {
      state.approvalRequests.push(request);
    }
  });
}

async function saveApprovalRequestToSupabase(request) {
  if (!canSyncApprovalRequests()) return false;

  try {
    const row = approvalRequestToRow(request);
    const { id, ...updateRow } = row;
    let result;

    if (row.status === "pending") {
      result = await supabaseClient
        .from(APPROVAL_REQUESTS_TABLE)
        .upsert(row, {
          onConflict: "id"
        });
    } else {
      result = await supabaseClient
        .from(APPROVAL_REQUESTS_TABLE)
        .update(updateRow)
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (!result.error && !result.data) {
        result = await supabaseClient
          .from(APPROVAL_REQUESTS_TABLE)
          .update(updateRow)
          .eq("email", row.email)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();
      }

      if (!result.error && !result.data) {
        throw new Error("Approval request was not found in Supabase. Refresh and try again.");
      }
    }

    if (result.error) throw result.error;
    approvalRequestsSyncError = "";
    return true;
  } catch (error) {
    console.warn("Approval request Supabase sync skipped", error);
    approvalRequestsSyncError =
      error?.message ||
      "Approval request table is not reachable. Run the Supabase approval SQL.";
    return false;
  }
}

async function syncApprovalRequestsFromSupabase({ force = false } = {}) {
  if (!canSyncApprovalRequests() || approvalRequestsSyncing) return false;
  if (approvalRequestsLoaded && !force) return false;

  approvalRequestsSyncing = true;
  approvalRequestsLoadAttempted = true;

  try {
    const { data, error } = await supabaseClient
      .from(APPROVAL_REQUESTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Approval data:", data);
    console.log("Approval error:", error);

    if (error) throw error;

    mergeApprovalRequests((data || []).map(approvalRequestFromRow));
    approvalRequestsLoaded = true;
    approvalRequestsSyncError = "";
    saveState();
    renderApprovalRequests();
    return true;
  } catch (error) {
    console.warn("Approval request Supabase load skipped", error);
    approvalRequestsSyncError =
      error?.message ||
      "Approval request table is not reachable. Run the Supabase approval SQL.";
    renderApprovalRequests();
    return false;
  } finally {
    approvalRequestsSyncing = false;
  }
}

async function createApprovalRequest({ name, email, authUserId = "" }) {
  const existingProfile = findApprovedProfileByEmail(email);

  if (existingProfile) {
    return {
      request: null,
      saved: true,
      alreadyApproved: true
    };
  }

  const existingRequest = findPendingApprovalByEmail(email);

  if (existingRequest) {
    existingRequest.name = name || existingRequest.name;
    existingRequest.authUserId = authUserId || existingRequest.authUserId;
    saveState();
    const saved = await saveApprovalRequestToSupabase(existingRequest);
    return {
      request: existingRequest,
      saved: saved || !canSyncApprovalRequests()
    };
  }

  const request = {
    id: uid("approval"),
    authUserId,
    name: name || email.split("@")[0],
    email,
    status: "pending",
    requestedRole: "",
    reportsTo: "",
    createdAt: new Date().toISOString()
  };

  state.approvalRequests.push(request);
  state.notifications.push({
    id: uid("note"),
    type: "Signup approval",
    message: `${request.name} requested access and needs role assignment.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveState();
  const saved = await saveApprovalRequestToSupabase(request);
  renderApprovalRequests();
  renderNotifications();

  return {
    request,
    saved: saved || !canSyncApprovalRequests()
  };
}

async function applyLoggedInUser(user) {
  await syncProfilesFromSupabase({ force: true });

  const email = user?.email || "";
  const name = getUserNameFromAuth(user);
  const profile = findApprovedProfileByEmail(email);

  if (!profile) {
    await createApprovalRequest({
      name,
      email,
      authUserId: user?.id || ""
    });

    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EMAIL_KEY);
    sessionStorage.removeItem(SESSION_NAME_KEY);
    updateAuthView();
    toast("Your account is pending admin approval and role assignment.");
    return false;
  }

  state.currentProfileId = profile.id;
  sessionStorage.setItem(SESSION_KEY, user?.id || profile.id);
  sessionStorage.setItem(SESSION_EMAIL_KEY, profile.email);
  sessionStorage.setItem(SESSION_NAME_KEY, profile.name);
  saveState();
  render();
  startDailyReportDeadlineMonitor();
  updateAuthView();
  return true;
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

function getCurrentProfile() {
  return state.profiles.find(profile => profile.id === state.currentProfileId) ||
    state.profiles[0] ||
    demoState.profiles[0];
}

function getReportsToOptions(role) {
  const reportsToRole = {
    manager: "admin",
    associate: "manager",
    executive: "manager"
  }[role];

  return state.profiles.filter(profile =>
    profile.role === reportsToRole
  );
}

function getDescendantProfileIds(profileId) {
  const ids = new Set([profileId]);
  let changed = true;

  while (changed) {
    changed = false;

    state.profiles.forEach(profile => {
      if (profile.reportsTo && ids.has(profile.reportsTo) && !ids.has(profile.id)) {
        ids.add(profile.id);
        changed = true;
      }
    });
  }

  return [...ids];
}

function getVisibleProfileIds() {
  const profile = getCurrentProfile();

  if (profile.role === "admin") {
    return state.profiles.map(item => item.id);
  }

  return getDescendantProfileIds(profile.id);
}

function canManageProfile(profile) {
  const current = getCurrentProfile();
  if (!profile) return false;
  if (current.role === "admin") return true;
  return getDescendantProfileIds(current.id).includes(profile.id) && current.id !== profile.id;
}

function getVisibleProfiles() {
  const ids = new Set(getVisibleProfileIds());
  return state.profiles.filter(profile => ids.has(profile.id));
}

function getAssignableFreelancerOwners() {
  const current = getCurrentProfile();
  const visible = getVisibleProfiles();

  return visible.filter(profile => {
    if (!["manager", "associate", "executive"].includes(profile.role)) return false;
    if (current.role === "executive") return profile.id === current.id;
    return true;
  });
}

function getScopedFreelancers() {
  const visibleIds = new Set(getVisibleProfileIds());
  return state.freelancers.filter(person => visibleIds.has(person.ownerId));
}

function getScopedTasks() {
  const freelancerIds = new Set(getScopedFreelancers().map(person => person.id));
  return state.tasks.filter(task => freelancerIds.has(task.freelancerId));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getReportFor(profileId, date = getTodayKey()) {
  return state.dailyReports.find(report =>
    report.userId === profileId && report.date === date
  );
}

function isReportRequiredProfile(profile) {
  return reportRequiredRoles.includes(profile?.role);
}

function canReviewReports(profile = getCurrentProfile()) {
  return ["admin", "manager"].includes(profile?.role);
}

function getReviewableReportProfiles() {
  const current = getCurrentProfile();

  if (!canReviewReports(current)) {
    return [];
  }

  return getVisibleProfiles()
    .filter(profile => profile.id !== current.id)
    .filter(isReportRequiredProfile);
}

function getMissingDailyReports(date = getTodayKey()) {
  return getReviewableReportProfiles()
    .filter(profile => !getReportFor(profile.id, date));
}

function getProfileName(profileId) {
  return state.profiles.find(profile => profile.id === profileId)?.name || "Unassigned";
}

function renderWelcomeUser() {
  if (!els.welcomeUser) return;

  const profile = getCurrentProfile();
  els.welcomeUser.textContent =
    `Welcome ${profile.name || sessionStorage.getItem(SESSION_NAME_KEY) || "User"}`;
  els.welcomeUser.title = roleLabels[profile.role] || profile.role || "";
}

function render() {
  renderWelcomeUser();
  renderRoleAssignmentAccess();
  renderApprovalRequests();
  renderMetrics();
  renderTeam();
  renderDailyReports();
  renderOperations();
  renderOperationTaskTypes();
  renderFreelancers();
  renderTaskSelectors();
  renderFreelancerOwnerSelect();
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
  queueDeadlineEmails();
}

function renderRoleAssignmentAccess() {
  const addEmployeeButton = document.getElementById("openEmployeeModalBtn");
  const checkReportsButton = document.getElementById("checkMissingReportsBtn");
  const reportReviewPanel = document.getElementById("reportReviewPanel");
  const current = getCurrentProfile();
  const isAdmin = current.role === "admin";

  if (addEmployeeButton) {
    addEmployeeButton.hidden = !isAdmin;
  }

  if (els.approvalPanel) {
    els.approvalPanel.hidden = !isAdmin;
  }

  if (checkReportsButton) {
    checkReportsButton.hidden = !canReviewReports(current);
  }

  if (reportReviewPanel) {
    reportReviewPanel.hidden = !canReviewReports(current);
  }
}

function populateFreelancerFilters() {
  const scopedFreelancers = getScopedFreelancers();

  const states =
    [...new Set(scopedFreelancers.map(f => f.state))]
      .filter(Boolean)
      .sort();

  const districts =
    [...new Set(scopedFreelancers.map(f => f.district))]
      .filter(Boolean)
      .sort();

  const languages =
    [...new Set(scopedFreelancers.map(f => f.language))]
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

function renderTeam() {
  if (!els.teamTree || !els.roleControls) return;

  if (!profilesLoaded && !profilesLoadAttempted) {
    syncProfilesFromSupabase();
  }

  const current = getCurrentProfile();
  const showReportStatus = canReviewReports(current);
  const visibleIds = new Set(getVisibleProfileIds());
  const visibleProfiles = state.profiles.filter(profile => visibleIds.has(profile.id));

  const renderNode = (profile) => {
    const children = state.profiles
      .filter(child => child.reportsTo === profile.id && visibleIds.has(child.id))
      .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

    const report = getReportFor(profile.id);
    const ownFreelancers = state.freelancers.filter(person => person.ownerId === profile.id).length;
    const filesReviewed = report ? Number(report.filesReviewed || 0) : 0;
    const reportStatus = !showReportStatus
      ? "Activity visible"
      : isReportRequiredProfile(profile)
      ? report
        ? `${filesReviewed} files today`
        : "Report missing"
      : "Reviews team reports";

    return `
      <article class="team-node role-${escapeHtml(profile.role)}">
        <div>
          <button class="link-btn team-profile-btn" type="button" onclick="showEmployeeProfile('${profile.id}')">
            ${escapeHtml(profile.name)}
          </button>
          <span class="pill">${escapeHtml(roleLabels[profile.role] || profile.role)}</span>
        </div>
        <p>${escapeHtml(profile.email || "")}</p>
        <div class="team-stats">
          <span>${ownFreelancers} freelancers</span>
          <span>${reportStatus}</span>
        </div>
        ${children.length ? `<div class="team-children">${children.map(renderNode).join("")}</div>` : ""}
      </article>
    `;
  };

  const roots = visibleProfiles
    .filter(profile => profile.id === current.id || !visibleIds.has(profile.reportsTo))
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  const syncWarning = profilesSyncError
    ? `<div class="empty warning-box">${escapeHtml(profilesSyncError)}</div>`
    : "";

  els.teamTree.innerHTML = syncWarning + (roots.length
    ? roots.map(renderNode).join("")
    : `<div class="empty">No visible team members.</div>`);

  const controls = [
    ["Active role", roleLabels[current.role] || current.role],
    ["Visible activity", visibleProfiles.length],
    ["Freelancer access", getScopedFreelancers().length],
    ["Assignment access", getScopedTasks().length],
    ["Missing reports today", getMissingDailyReports().length]
  ];

  els.roleControls.innerHTML = controls.map(([label, value]) => `
    <article class="control-tile">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");
}

function renderEmployeeReportsToSelect() {
  if (!els.employeeReportsToSelect) return;

  const role = document.getElementById("employeeRoleSelect")?.value || "manager";
  const options = getReportsToOptions(role);

  els.employeeReportsToSelect.innerHTML =
    `<option value="">Select reporting head</option>` +
    options.map(profile => `
      <option value="${profile.id}">
        ${escapeHtml(profile.name)} (${escapeHtml(roleLabels[profile.role] || profile.role)})
      </option>
    `).join("");
}

document.getElementById("employeeRoleSelect")?.addEventListener("change", renderEmployeeReportsToSelect);

function renderApprovalReportsToSelect(requestId) {
  const roleSelect = document.getElementById(`approvalRole-${requestId}`);
  const reportsToSelect = document.getElementById(`approvalReportsTo-${requestId}`);

  if (!roleSelect || !reportsToSelect) return;

  const options = getReportsToOptions(roleSelect.value);
  reportsToSelect.innerHTML =
    `<option value="">Reports to</option>` +
    options.map(profile => `
      <option value="${profile.id}">
        ${escapeHtml(profile.name)} (${escapeHtml(roleLabels[profile.role] || profile.role)})
      </option>
    `).join("");
}

function renderApprovalRequests() {
  if (!els.approvalList || !els.approvalBadge) return;

  const pending = state.approvalRequests
    .filter(request => request.status === "pending")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  els.approvalBadge.textContent = `${pending.length} pending`;

  if (getCurrentProfile().role !== "admin") {
    els.approvalList.innerHTML = "";
    return;
  }

  if (!approvalRequestsLoaded && !approvalRequestsLoadAttempted) {
    syncApprovalRequestsFromSupabase();
  }

  const syncWarning = approvalRequestsSyncError
    ? `<div class="empty warning-box">${escapeHtml(approvalRequestsSyncError)}</div>`
    : "";

  els.approvalList.innerHTML = syncWarning + (pending.length
    ? pending.map(request => `
      <article class="report-card approval-card">
        <header>
          <div>
            <h4>${escapeHtml(request.name)}</h4>
            <span>${escapeHtml(request.email)}</span>
          </div>
          <span>${formatDateTime(request.createdAt)}</span>
        </header>
        <div class="approval-actions">
          <select id="approvalRole-${request.id}" onchange="renderApprovalReportsToSelect('${request.id}')">
            <option value="manager">Manager</option>
            <option value="associate">Associate</option>
            <option value="executive">Executive</option>
          </select>
          <select class="approval-reports-to" id="approvalReportsTo-${request.id}"></select>
          <button class="primary-btn" type="button" onclick="approveSignupRequest('${request.id}')">
            Approve
          </button>
          <button class="danger-btn" type="button" onclick="denySignupRequest('${request.id}')">
            Deny
          </button>
        </div>
      </article>
    `).join("")
    : `<div class="empty">No pending signup approvals.</div>`);

  pending.forEach(request => renderApprovalReportsToSelect(request.id));
}

async function approveSignupRequest(requestId) {
  if (getCurrentProfile().role !== "admin") {
    toast("Only admin can approve users.");
    return;
  }

  const request = state.approvalRequests.find(item => item.id === requestId);
  const role = document.getElementById(`approvalRole-${requestId}`)?.value || "";
  const reportsTo = document.getElementById(`approvalReportsTo-${requestId}`)?.value || "";

  if (!request) return;

  if (!role || !reportsTo) {
    toast("Select role and reporting head before approval.");
    return;
  }

  const existingProfile = findApprovedProfileByEmail(request.email);
  const previousRequest = { ...request };

  if (existingProfile) {
    request.status = "approved";
    request.approvedAt = request.approvedAt || new Date().toISOString();
    request.approvedBy = request.approvedBy || getCurrentProfile().id;
    request.requestedRole = existingProfile.role || role;
    request.reportsTo = existingProfile.reportsTo || reportsTo;
    if (!(await saveProfileToSupabase(existingProfile))) {
      toast(profilesSyncError || "Approved profile could not be saved to Supabase.");
      return;
    }
    if (!(await saveApprovalRequestToSupabase(request))) {
      Object.assign(request, previousRequest);
      toast(approvalRequestsSyncError || "Approval request could not be updated in Supabase.");
      return;
    }
    toast("This user is already approved.");
    saveState();
    render();
    return;
  }

  const profile = {
    id: request.authUserId || uid("user"),
    name: request.name,
    email: request.email,
    role,
    reportsTo,
    status: "active"
  };

  if (!(await saveProfileToSupabase(profile))) {
    toast(profilesSyncError || "Approved profile could not be saved to Supabase.");
    return;
  }

  request.status = "approved";
  request.approvedAt = new Date().toISOString();
  request.approvedBy = getCurrentProfile().id;
  request.requestedRole = role;
  request.reportsTo = reportsTo;

  state.notifications.push({
    id: uid("note"),
    type: "User approved",
    message: `${request.name} approved as ${roleLabels[role] || role}.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  if (!(await saveApprovalRequestToSupabase(request))) {
    Object.assign(request, previousRequest);
    toast(approvalRequestsSyncError || "Approval request could not be updated in Supabase.");
    return;
  }

  state.profiles.push(profile);
  saveState();
  render();
  toast(`${request.name} approved.`);
}

async function denySignupRequest(requestId) {
  if (getCurrentProfile().role !== "admin") {
    toast("Only admin can deny users.");
    return;
  }

  const request = state.approvalRequests.find(item => item.id === requestId);

  if (!request) return;

  const previousRequest = { ...request };

  request.status = "denied";
  request.deniedAt = new Date().toISOString();
  request.deniedBy = getCurrentProfile().id;

  if (!(await saveApprovalRequestToSupabase(request))) {
    Object.assign(request, previousRequest);
    toast(approvalRequestsSyncError || "Approval request could not be denied in Supabase.");
    return;
  }

  state.notifications.push({
    id: uid("note"),
    type: "User denied",
    message: `${request.name} signup request denied.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveState();
  render();
  toast(`${request.name} denied.`);
}

function renderFreelancerOwnerSelect(selectedOwnerId = "") {
  if (!els.freelancerOwnerSelect) return;

  const owners = getAssignableFreelancerOwners();
  const fallback = selectedOwnerId || owners[0]?.id || getCurrentProfile().id;

  els.freelancerOwnerSelect.innerHTML = owners.map(profile => `
    <option value="${profile.id}" ${profile.id === fallback ? "selected" : ""}>
      ${escapeHtml(profile.name)} (${escapeHtml(roleLabels[profile.role] || profile.role)})
    </option>
  `).join("");
}

function renderDailyReports() {
  if (!els.dailyReportForm || !els.dailyReportList) return;

  if (!dailyReportsLoaded && !dailyReportsLoadAttempted) {
    syncDailyReportsFromSupabase();
  }

  const today = getTodayKey();
  const current = getCurrentProfile();
  const currentReport = getReportFor(current.id, today);
  const submitPanel = document.getElementById("dailyReportSubmitPanel");
  const canSubmitReport = isReportRequiredProfile(current);
  const selectedDate = els.reportDateFilter?.value || today;
  const selectedRole = els.reportRoleFilter?.value || "all";
  const selectedMember = els.reportMemberFilter?.value || "all";

  if (submitPanel) {
    submitPanel.hidden = !canSubmitReport;
  }

  if (els.reportDateFilter && !els.reportDateFilter.value) {
    els.reportDateFilter.value = today;
  }

  if (canSubmitReport) {
    document.getElementById("reportDate").value = currentReport?.date || today;
    document.getElementById("todayWork").value = currentReport?.todayWork || "";
    document.getElementById("tomorrowPlan").value = currentReport?.tomorrowPlan || "";
    document.getElementById("roadblocks").value = currentReport?.roadblocks || "";
    document.getElementById("filesReviewed").value = currentReport?.filesReviewed ?? "";
  }

  const allReviewableProfiles = getReviewableReportProfiles();

  if (els.reportMemberFilter) {
    const currentMemberValue = els.reportMemberFilter.value || "all";
    els.reportMemberFilter.innerHTML =
      `<option value="all">All members</option>` +
      allReviewableProfiles.map(profile => `
        <option value="${profile.id}">
          ${escapeHtml(profile.name)} (${escapeHtml(roleLabels[profile.role] || profile.role)})
        </option>
      `).join("");
    els.reportMemberFilter.value = allReviewableProfiles.some(profile => profile.id === currentMemberValue)
      ? currentMemberValue
      : "all";
  }

  const memberFilter = els.reportMemberFilter?.value || selectedMember;
  const visibleProfiles = allReviewableProfiles
    .filter(profile => selectedRole === "all" || profile.role === selectedRole)
    .filter(profile => memberFilter === "all" || profile.id === memberFilter);

  const rows = visibleProfiles.map(profile => {
    const report = getReportFor(profile.id, selectedDate);

    return `
      <article class="report-card ${report ? "" : "missing"}">
        <header>
          <div>
            <h4>${escapeHtml(profile.name)}</h4>
            <span>${escapeHtml(roleLabels[profile.role] || profile.role)}</span>
          </div>
          <button class="link-btn" type="button" onclick="showEmployeeProfile('${profile.id}')">
            Open profile
          </button>
        </header>
        ${report ? `
          <dl>
            <dt>Date</dt><dd>${formatDate(report.date)}</dd>
            <dt>Today's work</dt><dd>${escapeHtml(report.todayWork)}</dd>
            <dt>Tomorrow</dt><dd>${escapeHtml(report.tomorrowPlan)}</dd>
            <dt>Roadblocks</dt><dd>${escapeHtml(report.roadblocks || "None")}</dd>
            <dt>Files reviewed</dt><dd>${Number(report.filesReviewed || 0)}</dd>
          </dl>
        ` : `<p class="missing-text">${formatDate(selectedDate)} report has not been filled.</p>`}
      </article>
    `;
  });

  const missingCount = visibleProfiles.filter(profile => !getReportFor(profile.id, selectedDate)).length;
  const syncWarning = dailyReportsSyncError
    ? `<div class="empty warning-box">${escapeHtml(dailyReportsSyncError)}</div>`
    : "";
  els.missingReportBadge.textContent = `${missingCount} missing`;
  els.dailyReportList.innerHTML = syncWarning + (rows.join("") || `<div class="empty">No EOD reports to review for these filters.</div>`);
}

function getVisibleNotifications() {
  const visibleFreelancerIds = new Set(getScopedFreelancers().map(person => person.id));
  const adminOnlyTypes = new Set(["Signup approval", "User approved", "User denied", "Member removed"]);
  const isAdmin = getCurrentProfile().role === "admin";

  return state.notifications
    .filter(note => !adminOnlyTypes.has(note.type) || isAdmin)
    .filter(canCurrentProfileSeeNotification)
    .filter(note => !note.freelancerId || visibleFreelancerIds.has(note.freelancerId));
}

function renderMetrics() {
  const scopedFreelancers = getScopedFreelancers();
  const scopedTasks = getScopedTasks();

  const unread =
    getVisibleNotifications().filter(
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
scopedTasks.length
],

["Freelancers",
scopedFreelancers.length
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
  getScopedFreelancers().filter(person => {

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
        const ownerName = getProfileName(person.ownerId);
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
              <dt>Mobile</dt><dd>${escapeHtml(person.mobile || "")}</dd>
              <dt>Owner</dt><dd>${escapeHtml(ownerName)}</dd>
              <dt>State</dt><dd>${escapeHtml(person.state || "")}</dd>
              <dt>District</dt><dd>${escapeHtml(person.district || "")}</dd>
              <dt>Language</dt><dd>${escapeHtml(person.language || "")}</dd>
              <dt>Rate</dt><dd>${escapeHtml(person.rate)}</dd>
              <dt>Tasks</dt><dd>${activeTasks} active</dd>
            </dl>
            <div class="card-actions">
  <button class="ghost-btn"
          onclick="showFreelancerProfile('${person.id}')">
    Profile
  </button>

  <button class="ghost-btn"
          onclick="openFreelancerWhatsApp('${person.id}')">
    WhatsApp
  </button>

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
  document.querySelector("[name='mobile']").value = person.mobile || "";
  renderFreelancerOwnerSelect(person.ownerId);
  document.querySelector("[name='role']").value = person.role || "";
  document.querySelector("[name='state']").value = person.state || "";
  document.querySelector("[name='district']").value = person.district || "";
  document.querySelector("[name='language']").value = person.language || "";
  document.querySelector("[name='rate']").value = person.rate || "";
  document.querySelector("[name='status']").value = person.status || "Available";

  document.getElementById("freelancerModal").showModal();
}

function renderTaskSelectors() {
  const options = getScopedFreelancers().map((person) => `<option value="${person.id}">${escapeHtml(person.name)} - ${escapeHtml(person.role)}</option>`).join("");
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
  const localTaskQuery = document.getElementById("taskSearch")?.value.trim().toLowerCase() || "";
  const query = `${els.globalSearch.value.trim().toLowerCase()} ${localTaskQuery}`.trim();
  const freelancerFilter = els.taskFreelancerFilter.value || "all";
  const typeFilter = els.taskTypeFilter.value || "all";
  const statusFilter = els.taskStatusFilter.value || "all";
  const scopedTasks = getScopedTasks();
  const filtered = scopedTasks.filter((task) => {
    const person = findFreelancer(task.freelancerId);
    const operation = findOperation(task.operationId);
    const searchable = [getTaskLabel(task), task.brief, operation?.batchName, person?.name, person?.role].join(" ").toLowerCase();
    return searchable.includes(query)
      && (freelancerFilter === "all" || task.freelancerId === freelancerFilter)
      && (typeFilter === "all" || getTaskType(task) === typeFilter)
      && (statusFilter === "all" || task.status === statusFilter);
  });
  els.taskBoard.innerHTML = statuses.map((status) => renderColumn(status, filtered)).join("");
  els.workflowPreview.innerHTML = statuses.map((status) => renderColumn(status, scopedTasks, true)).join("");
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
          onclick="showFreelancerProfile('${task.freelancerId}')">
    Freelancer
  </button>

  <button class="ghost-btn"
          onclick="openTaskWhatsApp('${task.id}')">
    WhatsApp
  </button>

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
  renderOperationSelectors();

  document.querySelector("[name='operationId']").value =
    task.operationId || "";

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
  els.paymentRows.innerHTML = getScopedTasks().map((task) => {
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
  if (!notificationsLoaded && !notificationsLoadAttempted) {
    syncNotificationsFromSupabase();
  }

  const sorted = getVisibleNotifications()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const syncWarning = notificationsSyncError
    ? `<div class="empty warning-box">${escapeHtml(notificationsSyncError)}</div>`
    : "";
  els.recentNotifications.innerHTML = sorted.slice(0, 4).map(renderNotification).join("") || `<div class="empty">No notifications yet.</div>`;
  els.notificationList.innerHTML = syncWarning + (sorted.map(renderNotification).join("") || `<div class="empty">No notifications yet.</div>`);
  document.querySelectorAll("[data-read-note]").forEach((button) => {
    button.addEventListener("click", async () => {
      const note = state.notifications.find((item) => item.id === button.dataset.readNote);
      if (note) note.read = true;
      if (note) await saveNotificationToSupabase(note);
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

function showEmployeeProfile(profileId) {
  const profile = state.profiles.find(item => item.id === profileId);
  if (!profile) return;

  const todayReport = getReportFor(profile.id);
  const reportRequired = isReportRequiredProfile(profile);
  const showReportStatus = canReviewReports();

  if (!todayReport && reportRequired && showReportStatus) {
    toast(`${profile.name} has not filled today's report.`);
  }

  const childProfiles = state.profiles.filter(item => item.reportsTo === profile.id);
  const ownFreelancers = state.freelancers.filter(person => person.ownerId === profile.id);
  const ownTasks = state.tasks.filter(task => ownFreelancers.some(person => person.id === task.freelancerId));
  const canRemoveMember =
    getCurrentProfile().role === "admin" &&
    profile.role !== "admin" &&
    profile.id !== getCurrentProfile().id;
  const canPingReport =
    canManageProfile(profile) &&
    isReportRequiredProfile(profile) &&
    !todayReport;
  const reports = state.dailyReports
    .filter(report => report.userId === profile.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  document.getElementById("employeeProfileTitle").textContent =
    `${profile.name} (${roleLabels[profile.role] || profile.role})`;

  document.getElementById("employeeProfileBody").innerHTML = `
    <div class="profile-grid">
      <article>
        <h3>Details</h3>
        <dl>
          <dt>Email</dt><dd>${escapeHtml(profile.email || "")}</dd>
          <dt>Reports to</dt><dd>${escapeHtml(getProfileName(profile.reportsTo))}</dd>
          <dt>Direct reports</dt><dd>${childProfiles.length}</dd>
          <dt>Own freelancers</dt><dd>${ownFreelancers.length}</dd>
          <dt>Own assignments</dt><dd>${ownTasks.length}</dd>
        </dl>
        ${canRemoveMember ? `
          <button class="danger-btn remove-member-btn" type="button" onclick="removeApprovedMember('${profile.id}')">
            Remove member
          </button>
        ` : ""}
      </article>
      <article>
        <h3>Today</h3>
        ${!showReportStatus ? `
          <p class="missing-text">EOD report status is visible only to admin and manager.</p>
        ` : todayReport ? `
          <dl>
            <dt>Work</dt><dd>${escapeHtml(todayReport.todayWork)}</dd>
            <dt>Tomorrow</dt><dd>${escapeHtml(todayReport.tomorrowPlan)}</dd>
            <dt>Roadblocks</dt><dd>${escapeHtml(todayReport.roadblocks || "None")}</dd>
            <dt>Files reviewed</dt><dd>${Number(todayReport.filesReviewed || 0)}</dd>
          </dl>
        ` : reportRequired
          ? `<p class="missing-text">Today's work report is not filled.</p>`
          : `<p class="missing-text">This role reviews EOD reports and does not submit one.</p>`}
        ${canPingReport ? `
          <button class="primary-btn remove-member-btn" type="button" onclick="pingDailyReport('${profile.id}')">
            Ping for report
          </button>
        ` : ""}
      </article>
    </div>
    <section class="profile-section">
      <h3>Recent reports</h3>
      ${!showReportStatus
        ? `<div class="empty">Report history is visible only to admin and manager.</div>`
        : reports.length ? reports.map(report => `
        <article class="report-card">
          <header><h4>${formatDate(report.date)}</h4><span>${Number(report.filesReviewed || 0)} files</span></header>
          <p>${escapeHtml(report.todayWork)}</p>
        </article>
      `).join("") : `<div class="empty">No reports yet.</div>`}
    </section>
    <section class="profile-section">
      <h3>Freelancers</h3>
      ${ownFreelancers.length ? ownFreelancers.map(person => `
        <button class="profile-row" type="button" onclick="showFreelancerProfile('${person.id}')">
          <span>${escapeHtml(person.name)}</span>
          <small>${escapeHtml(person.status || "")}</small>
        </button>
      `).join("") : `<div class="empty">No owned freelancers.</div>`}
    </section>
  `;

  document.getElementById("employeeProfileModal").showModal();
}

async function pingDailyReport(profileId) {
  const profile = state.profiles.find(item => item.id === profileId);

  if (!profile || !canManageProfile(profile) || !isReportRequiredProfile(profile)) {
    toast("You cannot ping this team member.");
    return;
  }

  await addNotification({
    type: "Daily report reminder",
    message: `${getCurrentProfile().name} reminded you to submit today's daily report before 7 PM.`,
    targetProfileId: profile.id,
    metaKey: `daily-report-ping-${getTodayKey()}-${profile.id}-${Date.now()}`
  });

  saveState();
  renderNotifications();
  toast(`${profile.name} pinged for daily report.`);
}

async function removeApprovedMember(profileId) {
  if (getCurrentProfile().role !== "admin") {
    toast("Only admin can remove approved members.");
    return;
  }

  const profile = state.profiles.find(item => item.id === profileId);

  if (!profile || profile.role === "admin") {
    toast("Admin profile cannot be removed.");
    return;
  }

  const directReports = state.profiles.filter(item => item.reportsTo === profileId);

  if (directReports.length) {
    toast("Reassign or remove this member's direct reports first.");
    return;
  }

  if (!confirm(`Remove ${profile.name} from approved members?`)) {
    return;
  }

  if (!(await removeProfileFromSupabase(profile))) {
    toast(profilesSyncError || "Member could not be removed from Supabase.");
    return;
  }

  const reassignmentTarget = profile.reportsTo || getCurrentProfile().id;

  state.freelancers.forEach(person => {
    if (person.ownerId === profileId) {
      person.ownerId = reassignmentTarget;
    }
  });

  state.profiles = state.profiles.filter(item => item.id !== profileId);
  state.dailyReports = state.dailyReports.filter(report => report.userId !== profileId);

  state.approvalRequests
    .filter(request => sameEmail(request.email, profile.email))
    .forEach(request => {
      request.status = "denied";
      request.deniedAt = request.deniedAt || new Date().toISOString();
      request.deniedBy = request.deniedBy || getCurrentProfile().id;
      saveApprovalRequestToSupabase(request);
    });

  state.notifications.push({
    id: uid("note"),
    type: "Member removed",
    message: `${profile.name} removed from approved members.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveState();
  document.getElementById("employeeProfileModal")?.close();
  render();
  toast(`${profile.name} removed.`);
}

function showFreelancerProfile(freelancerId) {
  const person = findFreelancer(freelancerId);
  if (!person) return;

  const tasks = state.tasks.filter(task => task.freelancerId === freelancerId);
  const completed = tasks.filter(task => task.status === "Completed").length;
  const totalFiles = tasks.reduce((sum, task) => sum + Number(task.taskCount || 0), 0);
  const completedFiles = tasks
    .filter(task => task.status === "Completed")
    .reduce((sum, task) => sum + Number(task.taskCount || 0), 0);
  const progress = totalFiles ? Math.round((completedFiles / totalFiles) * 100) : 0;

  document.getElementById("freelancerProfileTitle").textContent = person.name;
  document.getElementById("freelancerProfileBody").innerHTML = `
    <div class="profile-grid">
      <article>
        <h3>Details</h3>
        <dl>
          <dt>Email</dt><dd><a href="mailto:${encodeURIComponent(person.email || "")}">${escapeHtml(person.email || "")}</a></dd>
          <dt>Mobile</dt><dd>${escapeHtml(person.mobile || "")}</dd>
          <dt>Owner</dt><dd>${escapeHtml(getProfileName(person.ownerId))}</dd>
          <dt>State</dt><dd>${escapeHtml(person.state || "")}</dd>
          <dt>District</dt><dd>${escapeHtml(person.district || "")}</dd>
          <dt>Language</dt><dd>${escapeHtml(person.language || "")}</dd>
          <dt>Rate</dt><dd>${escapeHtml(person.rate || "")}</dd>
          <dt>Status</dt><dd>${escapeHtml(person.status || "")}</dd>
        </dl>
        <button class="primary-btn" type="button" onclick="openFreelancerWhatsApp('${person.id}')">
          Send WhatsApp
        </button>
      </article>
      <article>
        <h3>Progress</h3>
        <div class="progress"><div class="progress-fill" style="width:${progress}%"></div></div>
        <dl>
          <dt>Assignments</dt><dd>${tasks.length}</dd>
          <dt>Completed</dt><dd>${completed}</dd>
          <dt>Files assigned</dt><dd>${totalFiles}</dd>
          <dt>Completed files</dt><dd>${completedFiles}</dd>
        </dl>
      </article>
    </div>
    <section class="profile-section">
      <h3>Assignment history</h3>
      ${tasks.length ? tasks.map(task => {
        const operation = findOperation(task.operationId);
        return `
          <article class="task-card">
            <strong>${escapeHtml(getTaskType(task))}</strong>
            <div class="task-meta">Batch: ${escapeHtml(operation?.batchName || "-")}</div>
            <div class="task-meta">${formatDate(task.startDate)} to ${formatDate(task.deadlineDate)}</div>
            <div class="task-meta">Count: ${Number(task.taskCount || 0)} | Status: ${escapeHtml(task.status || "")}</div>
            <button class="ghost-btn" type="button" onclick="openTaskWhatsApp('${task.id}')">WhatsApp brief</button>
          </article>
        `;
      }).join("") : `<div class="empty">No assignments yet.</div>`}
    </section>
  `;

  document.getElementById("freelancerProfileModal").showModal();
}

function normalizeWhatsAppNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function openWhatsAppMessage(mobile, message) {
  const phone = normalizeWhatsAppNumber(mobile);

  if (!phone) {
    toast("Freelancer mobile number is missing.");
    return;
  }

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener"
  );
}

function buildTaskAssignmentMessage(task) {
  const person = findFreelancer(task.freelancerId);
  const replacements = getTaskTemplateReplacements(task);
  let body = state.emailTemplate.body;

  Object.entries(replacements).forEach(([token, value]) => {
    body = body.replaceAll(token, value);
  });

  return body || [
    `Hi ${person?.name || ""},`,
    "",
    "A new task has been assigned to you.",
    "",
    buildTaskDetails(task),
    "",
    `Thanks,`,
    state.emailSettings.senderName
  ].join("\n");
}

function openTaskWhatsApp(taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  const person = task ? findFreelancer(task.freelancerId) : null;

  if (!task || !person) {
    toast("Task or freelancer details are missing.");
    return;
  }

  openWhatsAppMessage(person.mobile, buildTaskAssignmentMessage(task));
}

function openFreelancerWhatsApp(freelancerId) {
  const person = findFreelancer(freelancerId);

  if (!person) return;

  const activeTasks = state.tasks.filter(task =>
    task.freelancerId === freelancerId && task.status !== "Completed"
  );

  const message = [
    `Hi ${person.name},`,
    "",
    activeTasks.length
      ? "Sharing your current active work summary:"
      : "Sharing a quick update from the operations desk.",
    "",
    activeTasks.length
      ? activeTasks.map(task => `- ${getTaskType(task)}: ${Number(task.taskCount || 0)} files, deadline ${formatDate(task.deadlineDate)}`).join("\n")
      : "No active assignments are pending right now.",
    "",
    `Thanks,`,
    state.emailSettings.senderName
  ].join("\n");

  openWhatsAppMessage(person.mobile, message);
}

async function updateTask(taskId, patch) {
  const task = state.tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  const previousTask =
    { ...task };

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

    await sendTaskCompletionEmail(task);
  }

  if (
    patch.paymentStatus &&
    patch.paymentStatus !== previousTask.paymentStatus
  ) {

    await sendPaymentStatusEmail(task);

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

function buildTaskDetails(task) {
  const person = findFreelancer(task.freelancerId);
  const operation = findOperation(task.operationId);

  return [
    `Freelancer: ${person?.name || "-"}`,
    `Task type: ${getTaskType(task)}`,
    `Batch: ${operation?.batchName || "-"}`,
    `Count: ${Number(task.taskCount || 0)}`,
    `Start date: ${formatDate(task.startDate)}`,
    `Deadline date: ${formatDate(task.deadlineDate)}`,
    `Status: ${task.status || "-"}`,
    `Payment status: ${task.paymentStatus || "-"}`,
    "",
    "Description / brief:",
    task.brief || "-"
  ].join("\n");
}

function buildHtmlEmail(body) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
      ${escapeHtml(body).replaceAll("\n", "<br>")}
    </div>
  `;
}

function hasActiveSession() {
  return !!sessionStorage.getItem(SESSION_KEY);
}

function isValidRecipient(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))
    && !/@example\.(com|org|net)$/i.test(String(email || ""));
}

function wasEmailSent(eventKey) {
  return !!state.emailEvents?.[eventKey];
}

function markEmailSent(eventKey) {
  if (!eventKey) return;

  state.emailEvents = state.emailEvents || {};
  state.emailEvents[eventKey] = new Date().toISOString();
  saveState();
}

async function sendFreelancerEmail({
  freelancer,
  subject,
  body,
  eventKey,
  silent = false
}) {
  if (eventKey && wasEmailSent(eventKey)) {
    return true;
  }

  if (!hasActiveSession()) {
    if (!silent) {
      toast("Login is required before sending email.");
    }

    return false;
  }

  if (!freelancer || !isValidRecipient(freelancer.email)) {
    if (!silent) {
      toast("Freelancer email is missing or invalid.");
    }

    return false;
  }

  try {
    const { error } =
      await supabaseClient.functions.invoke(
        EMAIL_FUNCTION_NAME,
        {
          body: {
            to: freelancer.email,
            subject,
            text: body,
            html: buildHtmlEmail(body),
            replyTo: state.emailSettings.senderEmail,
            senderName: state.emailSettings.senderName
          }
        }
      );

    if (error) {
      throw error;
    }

    markEmailSent(eventKey);
    return true;

  } catch (err) {
    console.error("Email send failed", err);

    if (!silent) {
      toast("Email could not be sent. Check Supabase function setup.");
    }

    return false;
  }
}

async function sendTaskAssignmentEmail(task) {
  const person = findFreelancer(task.freelancerId);
  const replacements = getTaskTemplateReplacements(task);

  let subject = state.emailTemplate.subject;
  let body = state.emailTemplate.body;

  Object.entries(replacements).forEach(([token, value]) => {
    subject = subject.replaceAll(token, value);
    body = body.replaceAll(token, value);
  });

  return sendFreelancerEmail({
    freelancer: person,
    subject,
    body,
    eventKey: `task-assigned-${task.id}`
  });
}

function getTaskTemplateReplacements(task) {
  const person = findFreelancer(task.freelancerId);

  return {
    "{{freelancerName}}": person?.name || "",
    "{{taskType}}": getTaskType(task),
    "{{taskCount}}": Number(task.taskCount || 0),
    "{{startDate}}": formatDate(task.startDate),
    "{{deadlineDate}}": formatDate(task.deadlineDate),
    "{{brief}}": task.brief || "",
    "{{senderName}}": state.emailSettings.senderName,
    "{{senderEmail}}": state.emailSettings.senderEmail
  };
}

async function sendTaskUpdateEmail(task, previousTask) {
  const changedFields = [
    ["Task type", previousTask.taskType, task.taskType],
    ["Freelancer", previousTask.freelancerId, task.freelancerId],
    ["Start date", previousTask.startDate, task.startDate],
    ["Deadline date", previousTask.deadlineDate, task.deadlineDate],
    ["Count", previousTask.taskCount, task.taskCount],
    ["Brief", previousTask.brief, task.brief]
  ].filter(([, before, after]) => String(before || "") !== String(after || ""));

  if (!changedFields.length) {
    return true;
  }

  const person = findFreelancer(task.freelancerId);
  const changeSummary =
    changedFields
      .map(([label]) => `- ${label}`)
      .join("\n");

  return sendFreelancerEmail({
    freelancer: person,
    subject: `Task updated: ${getTaskType(task)}`,
    body: [
      `Hi ${person?.name || ""},`,
      "",
      "Your assigned task has been updated.",
      "",
      "Updated fields:",
      changeSummary,
      "",
      buildTaskDetails(task),
      "",
      `Thanks,`,
      state.emailSettings.senderName
    ].join("\n"),
    eventKey: `task-updated-${task.id}-${Date.now()}`
  });
}

async function sendTaskCompletionEmail(task) {
  const person = findFreelancer(task.freelancerId);

  return sendFreelancerEmail({
    freelancer: person,
    subject: `Task completed: ${getTaskType(task)}`,
    body: [
      `Hi ${person?.name || ""},`,
      "",
      "Your task has been marked completed. Payment review is now pending.",
      "",
      buildTaskDetails(task),
      "",
      `Thanks,`,
      state.emailSettings.senderName
    ].join("\n"),
    eventKey: `task-completed-${task.id}`
  });
}

async function sendPaymentStatusEmail(task) {
  const person = findFreelancer(task.freelancerId);

  return sendFreelancerEmail({
    freelancer: person,
    subject: `Payment update: ${getTaskType(task)}`,
    body: [
      `Hi ${person?.name || ""},`,
      "",
      `Payment status for your task is now: ${task.paymentStatus}.`,
      "",
      buildTaskDetails(task),
      "",
      `Thanks,`,
      state.emailSettings.senderName
    ].join("\n"),
    eventKey: `payment-${task.id}-${task.paymentStatus}`
  });
}

async function queueDeadlineEmails() {
  if (
    deadlineEmailQueueRunning ||
    !hasActiveSession()
  ) {
    return;
  }

  deadlineEmailQueueRunning = true;

  try {
    const today =
      new Date();

    today.setHours(0, 0, 0, 0);

    for (const task of state.tasks) {
      if (
        !task.deadlineDate ||
        task.status === "Completed"
      ) {
        continue;
      }

      const deadline =
        new Date(task.deadlineDate);

      deadline.setHours(0, 0, 0, 0);

      const daysLeft =
        Math.round(
          (deadline - today) / 86400000
        );

      if (daysLeft > 1) {
        continue;
      }

      const person =
        findFreelancer(task.freelancerId);

      const eventType =
        daysLeft < 0
          ? "deadline-overdue"
          : "deadline-due";

      const subject =
        daysLeft < 0
          ? `Deadline overdue: ${getTaskType(task)}`
          : `Deadline reminder: ${getTaskType(task)}`;

      const body =
        [
          `Hi ${person?.name || ""},`,
          "",
          daysLeft < 0
            ? "This task is past its deadline."
            : daysLeft === 0
              ? "This task is due today."
              : "This task is due tomorrow.",
          "",
          buildTaskDetails(task),
          "",
          `Thanks,`,
          state.emailSettings.senderName
        ].join("\n");

      await sendFreelancerEmail({
        freelancer: person,
        subject,
        body,
        eventKey: `${eventType}-${task.id}-${task.deadlineDate}`,
        silent: true
      });
    }

  } finally {
    deadlineEmailQueueRunning = false;
  }
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
  const scopedTasks = getScopedTasks();

  grid.innerHTML =
    state.operations.map(op => {

      const assigned =
        scopedTasks
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
  Number(op.volume)
    ? Math.round(
      (assigned / Number(op.volume)) * 100
    )
    : 0
);

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

function getExportSheets() {
  return {
    "Team Members": state.profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      reportsTo: profile.reportsTo,
      reportsToName: getProfileName(profile.reportsTo),
      status: profile.status || "active"
    })),
    "Daily Reports": state.dailyReports.map(report => {
      const profile = state.profiles.find(item => item.id === report.userId);
      return {
        id: report.id,
        userId: report.userId,
        name: profile?.name || "",
        email: profile?.email || "",
        role: profile?.role || "",
        date: report.date,
        todayWork: report.todayWork,
        tomorrowPlan: report.tomorrowPlan,
        roadblocks: report.roadblocks,
        filesReviewed: report.filesReviewed,
        createdAt: report.createdAt
      };
    }),
    Freelancers: state.freelancers,
    Operations: state.operations,
    Tasks: state.tasks,
    Notifications: state.notifications,
    "Approval Requests": state.approvalRequests
  };
}

function exportData() {
  const today = new Date().toISOString().split("T")[0];

  if (typeof XLSX !== "undefined") {
    const workbook = XLSX.utils.book_new();
    const sheets = getExportSheets();

    Object.entries(sheets).forEach(([name, rows]) => {
      const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
      XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
    });

    XLSX.writeFile(workbook, `oms-export-${today}.xlsx`);
    toast("Excel export downloaded.");
    return;
  }

  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `oms-backup-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function normalizeImportColumn(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getImportValue(row, names) {
  const normalizedRow =
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        normalizeImportColumn(key),
        value
      ])
    );

  for (const name of names) {
    const value = normalizedRow[normalizeImportColumn(name)];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function upsertCollection(collection, item, matchFn) {
  const index = collection.findIndex(matchFn);

  if (index >= 0) {
    collection[index] = {
      ...collection[index],
      ...item
    };
    return collection[index];
  }

  collection.push(item);
  return item;
}

function detectImportType(sheetName, rows) {
  const normalizedSheet = normalizeImportColumn(sheetName);
  const firstRow = rows[0] || {};
  const columns = Object.keys(firstRow).map(normalizeImportColumn);
  const hasColumn = (...names) => names.some(name => columns.includes(normalizeImportColumn(name)));

  if (normalizedSheet.includes("dailyreport") || hasColumn("todayWork", "tomorrowPlan", "filesReviewed")) return "dailyReports";
  if (normalizedSheet.includes("teammember") || normalizedSheet === "profiles" || hasColumn("reportsTo", "reportsToName")) return "profiles";
  if (normalizedSheet.includes("freelancer") || hasColumn("mobile", "rate", "ownerId")) return "freelancers";
  if (normalizedSheet.includes("operation") || hasColumn("batchName", "volume", "source")) return "operations";
  if (normalizedSheet.includes("task") || hasColumn("freelancerId", "deadlineDate", "taskCount")) return "tasks";
  if (normalizedSheet.includes("notification") || hasColumn("targetProfileId", "message")) return "notifications";
  if (normalizedSheet.includes("approval") || hasColumn("authUserId", "approvedAt", "deniedAt")) return "approvalRequests";

  return "freelancers";
}

async function importRowsByType(type, rows) {
  if (!rows.length) return 0;

  if (type === "profiles") {
    let count = 0;
    for (const row of rows) {
      const email = getImportValue(row, ["email", "Email", "Email Address"]);
      const name = getImportValue(row, ["name", "Name", "Full Name"]);
      if (!email && !name) continue;

      const reportsToValue = getImportValue(row, ["reportsTo", "Reports To", "reportsToName"]);
      const reportsToProfile = state.profiles.find(profile =>
        profile.id === reportsToValue ||
        sameEmail(profile.email, reportsToValue) ||
        profile.name === reportsToValue
      );
      const profile = {
        id: getImportValue(row, ["id", "ID"]) || uid("user"),
        name: name || email.split("@")[0],
        email,
        role: getImportValue(row, ["role", "Role"]) || "executive",
        reportsTo: reportsToProfile?.id || reportsToValue || "",
        status: getImportValue(row, ["status", "Status"]) || "active"
      };

      upsertCollection(state.profiles, profile, item =>
        item.id === profile.id || sameEmail(item.email, profile.email)
      );
      await saveProfileToSupabase(profile);
      count++;
    }
    return count;
  }

  if (type === "dailyReports") {
    let count = 0;
    for (const row of rows) {
      const email = getImportValue(row, ["email", "Email"]);
      const userIdValue = getImportValue(row, ["userId", "User ID"]);
      const profile = state.profiles.find(item =>
        item.id === userIdValue || sameEmail(item.email, email)
      );
      const date = getImportValue(row, ["date", "Date"]);
      if (!date || (!profile && !userIdValue)) continue;

      const report = {
        id: getImportValue(row, ["id", "ID"]) || uid("report"),
        userId: profile?.id || userIdValue,
        date,
        todayWork: getImportValue(row, ["todayWork", "Today's Work", "Today Work"]),
        tomorrowPlan: getImportValue(row, ["tomorrowPlan", "Tomorrow Plan"]),
        roadblocks: getImportValue(row, ["roadblocks", "Roadblocks"]) || "None",
        filesReviewed: Number(getImportValue(row, ["filesReviewed", "Files Reviewed"]) || 0),
        createdAt: getImportValue(row, ["createdAt", "Created At"]) || new Date().toISOString()
      };

      upsertCollection(state.dailyReports, report, item =>
        item.id === report.id || (item.userId === report.userId && item.date === report.date)
      );
      await saveDailyReportToSupabase(report);
      count++;
    }
    return count;
  }

  if (type === "freelancers") {
    return importFreelancers(rows, { silent: true });
  }

  const collectionMap = {
    operations: "operations",
    tasks: "tasks",
    notifications: "notifications",
    approvalRequests: "approvalRequests"
  };
  const collectionName = collectionMap[type];
  if (!collectionName) return 0;

  rows.forEach(row => {
    const item = {
      id: getImportValue(row, ["id", "ID"]) || uid(type),
      ...row
    };
    upsertCollection(state[collectionName], item, existing => existing.id === item.id);
  });

  return rows.length;
}

async function importWorkbook(workbook) {
  const counts = {};

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false
    });

    if (!rows.length) continue;

    const type = detectImportType(sheetName, rows);
    counts[type] = (counts[type] || 0) + await importRowsByType(type, rows);
  }

  saveState();
  render();

  const summary = Object.entries(counts)
    .filter(([, count]) => count)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  toast(summary ? `Imported ${summary}.` : "No importable rows found.");
}

function importData(file) {

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  toast("Import started: " + extension.toUpperCase());

  // JSON Import
  if (extension === "json") {

    const reader =
      new FileReader();

    reader.onload = async (e) => {

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

    reader.onload = async (e) => {

      try {

        const workbook =
          XLSX.read(
            e.target.result,
            {
              type: "array"
            }
          );

        await importWorkbook(workbook);

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

function importFreelancers(rows, { silent = false } = {}) {

  const normalizeColumnName = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const getValue = (row, names) => {

    const normalizedRow =
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          normalizeColumnName(key),
          value
        ])
      );

    for (const name of names) {

      const value =
        normalizedRow[
          normalizeColumnName(name)
        ];

      if (value !== undefined && value !== null) {

        return String(value).trim();

      }

    }

    return "";

  };

  const importedFreelancers =
    rows
      .map(row => ({

        id: uid("fr"),
        ownerId:
          getAssignableFreelancerOwners()[0]?.id ||
          getCurrentProfile().id,

        name:
          getValue(row, ["Name", "Freelancer Name", "Full Name"]),

        email:
          getValue(row, ["Email", "Email ID", "Email Address", "Mail ID"]),

        mobile:
          getValue(row, [
            "Mobile",
            "Mobile Number",
            "Mobile No",
            "Mobile No.",
            "Phone",
            "Phone Number",
            "Contact",
            "Contact Number",
            "Contact No",
            "Contact No.",
            "Whatsapp",
            "WhatsApp Number"
          ]),

        role:
          getValue(row, ["Role", "Skill", "Designation"]),

        state:
          getValue(row, ["State"]),

        district:
          getValue(row, ["District", "City"]),

        language:
          getValue(row, [
            "Language",
            "Languages",
            "Language(s)",
            "Known Language",
            "Known Languages",
            "Languages Known",
            "Language Known"
          ]),

        rate:
          getValue(row, ["Rate", "Pay Rate", "Price"]),

        status:
          getValue(row, ["Status"]) ||
          "Available"

      }))
      .filter(person =>
        person.name ||
        person.email ||
        person.mobile
      );

  if (!importedFreelancers.length) {

    if (!silent) {
      toast(
        "No valid freelancer rows found."
      );
    }

    return 0;

  }

  state.freelancers.push(
    ...importedFreelancers
  );


  saveState();

  render();

  if (!silent) {
    toast(
      `${importedFreelancers.length} freelancers imported`
    );
  }

  return importedFreelancers.length;

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
