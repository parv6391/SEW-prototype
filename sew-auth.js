
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://yhyfkvpqqvzmnosakygw.supabase.co";

// Keep your existing Supabase publishable key here.
const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_EXISTING_PUBLISHABLE_KEY";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// ----------------------------------
// SEW ACCOUNT INTERFACE
// ----------------------------------

const section = document.createElement("section");

section.className = "section";
section.id = "sew-auth";

section.innerHTML = `
  <h2>SEW account</h2>

  <p class="muted" id="authStatus">
    Checking authentication...
  </p>

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

const footer = document.querySelector("footer");

if (footer) {
  footer.before(section);
} else {
  document.body.append(section);
}

// ----------------------------------
// INTERFACE ELEMENTS
// ----------------------------------

const status = document.getElementById("authStatus");
const actions = document.getElementById("authActions");

const accountPanel = document.getElementById("accountPanel");
const accountEmail = document.getElementById("accountEmail");
const accountProvider = document.getElementById("accountProvider");

// ----------------------------------
// BUTTON CREATION
// ----------------------------------

function makeButton(label, className, callback) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = label;

  if (className) {
    button.className = className;
  }

  button.addEventListener("click", callback);

  actions.append(button);

  return button;
}

// ----------------------------------
// GOOGLE / GITHUB SIGN-IN
// ----------------------------------

async function signIn(provider) {
  status.textContent = `Connecting to ${provider}...`;

  actions.replaceChildren();

  try {
    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider,

        options: {
          redirectTo:
            window.location.origin +
            window.location.pathname +
            window.location.search +
            window.location.hash,

          skipBrowserRedirect: true
        }
      });

    if (error) {
      status.textContent =
        `Sign-in failed: ${error.message}`;

      console.error("SEW OAuth error:", error);

      renderSignedOut();
      return;
    }

    if (!data || !data.url) {
      status.textContent =
        "Sign-in failed: No authorization URL returned.";

      console.error("SEW OAuth response:", data);

      renderSignedOut();
      return;
    }

    console.log("SEW OAuth authorization URL:", data.url);

    // Explicitly redirect the browser.
    window.location.assign(data.url);

  } catch (error) {
    status.textContent =
      `Sign-in error: ${error.message}`;

    console.error("SEW OAuth exception:", error);

    renderSignedOut();
  }
}

// ----------------------------------
// SIGN-OUT
// ----------------------------------

async function signOut() {
  status.textContent = "Signing out...";

  actions.replaceChildren();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      status.textContent =
        `Sign-out failed: ${error.message}`;

      console.error("SEW sign-out error:", error);

      return;
    }

    renderSignedOut();

  } catch (error) {
    status.textContent =
      `Sign-out error: ${error.message}`;

    console.error("SEW sign-out exception:", error);
  }
}

// ----------------------------------
// SIGNED-OUT INTERFACE
// ----------------------------------

function renderSignedOut() {
  actions.replaceChildren();

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

// ----------------------------------
// SIGNED-IN INTERFACE
// ----------------------------------

function renderSignedIn(session) {
  const user = session.user;

  const provider =
    user.app_metadata?.provider ||
    user.identities?.[0]?.provider ||
    "Unknown";

  actions.replaceChildren();

  status.textContent = "Signed in successfully.";

  accountEmail.textContent =
    user.email || "Email unavailable";

  accountProvider.textContent =
    `Signed in through: ${provider}`;

  accountPanel.hidden = false;

  makeButton(
    "Sign out",
    "secondary",
    signOut
  );
}

// ----------------------------------
// SESSION RENDERING
// ----------------------------------

function renderSession(session) {
  if (session && session.user) {
    renderSignedIn(session);
  } else {
    renderSignedOut();
  }
}

// ----------------------------------
// BASIC ACCOUNT CARD STYLING
// ----------------------------------

const style = document.createElement("style");

style.textContent = `
  .auth-account-grid {
    display: grid;
    grid-template-columns:
      repeat(auto-fit, minmax(180px, 1fr));
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

// ----------------------------------
// AUTHENTICATION STATE
// ----------------------------------

let authEventReceived = false;

supabase.auth.onAuthStateChange((event, session) => {
  authEventReceived = true;

  console.log("SEW authentication event:", event);

  renderSession(session);
});

// Check for an existing session.
supabase.auth.getSession().then(({ data, error }) => {

  if (authEventReceived) return;

  if (error) {
    status.textContent =
      `Session check failed: ${error.message}`;

    console.error("SEW session error:", error);

    return;
  }

  renderSession(data.session);
}).catch((error) => {

  status.textContent =
    `Session check failed: ${error.message}`;

  console.error("SEW session exception:", error);

});
