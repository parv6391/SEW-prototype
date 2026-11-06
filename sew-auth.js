import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://yhyfkvpqqvzmnosakygw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_kzdnLCG-P-5CNOKKcvfO6A_rNWhOluV";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const section = document.createElement("section");
section.className = "section";
section.id = "sew-auth";

section.innerHTML = `
  <h2>SEW account</h2>
  <p class="muted" id="authStatus">Checking authentication...</p>

  <div class="actions" id="authActions"></div>

  <div id="accountPanel" hidden>
    <hr>

    <h3>Account overview</h3>
    <p id="accountEmail"></p>
    <p class="muted" id="accountProvider"></p>

    <div class="auth-account-grid">
      <div class="auth-card">
        <h3>Saved Runs</h3>
        <p class="muted">
          Account-based run storage is not connected yet.
        </p>
      </div>

      <div class="auth-card">
        <h3>Demo Runs</h3>
        <p class="muted">
          Explore the existing SEW simulator.
        </p>
      </div>

      <div class="auth-card">
        <h3>Account settings</h3>
        <p class="muted">
          Basic account management.
        </p>
      </div>
    </div>
  </div>
`;

document.querySelector("footer").before(section);

const status = document.getElementById("authStatus");
const actions = document.getElementById("authActions");
const accountPanel = document.getElementById("accountPanel");
const accountEmail = document.getElementById("accountEmail");
const accountProvider = document.getElementById("accountProvider");

function makeButton(label, className, callback) {
  const button = document.createElement("button");

  button.textContent = label;

  if (className) {
    button.className = className;
  }

  button.addEventListener("click", callback);
  actions.append(button);
}

async function signIn(provider) {
  status.textContent = `Connecting to ${provider}...`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo:
        window.location.origin + window.location.pathname
    }
  });

  if (error) {
    status.textContent = `Sign-in failed: ${error.message}`;
  }
}

async function signOut() {
  status.textContent = "Signing out...";

  const { error } = await supabase.auth.signOut();

  if (error) {
    status.textContent = `Sign-out failed: ${error.message}`;
  }
}

function renderSession(session) {
  actions.replaceChildren();

  if (session?.user) {
    const user = session.user;

    const provider =
      user.app_metadata?.provider ||
      user.identities?.[0]?.provider ||
      "Unknown";

    status.textContent = "Signed in successfully.";

    accountEmail.textContent =
      user.email || "Email unavailable";

    accountProvider.textContent =
      `Signed in through: ${provider}`;

    accountPanel.hidden = false;

    makeButton("Sign out", "secondary", signOut);

    return;
  }

  accountPanel.hidden = true;

  status.textContent = "Not signed in.";

  makeButton(
    "Continue with Google",
    "",
    () => signIn("google")
  );

  makeButton(
    "Continue with GitHub",
    "secondary",
    () => signIn("github")
  );
}

// Basic account-card styling.
const style = document.createElement("style");

style.textContent = `
  .auth-account-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 18px;
  }

  .auth-card {
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
  }

  .auth-card h3 {
    margin-top: 0;
  }
`;

document.head.append(style);

// Subscribe before checking the existing session.
let authEventReceived = false;

supabase.auth.onAuthStateChange((event, session) => {
  authEventReceived = true;
  renderSession(session);
});

supabase.auth.getSession().then(({ data, error }) => {
  if (authEventReceived) return;

  if (error) {
    status.textContent =
      `Session check failed: ${error.message}`;
    return;
  }

  renderSession(data.session);
});
