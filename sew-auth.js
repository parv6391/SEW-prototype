
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// SEW AUTHENTICATION CONFIGURATION
// ============================================

const SUPABASE_URL =
  "https://yhyfkvpqqvzmnosakygw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_kzdnLCG-P-5CNOKKcvfO6A_rNWhOluV";

if (
  !SUPABASE_URL ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_PUBLISHABLE_KEY ===
    "PASTE_YOUR_EXISTING_PUBLISHABLE_KEY_HERE"
) {
  throw new Error("SEW Auth: Supabase configuration is incomplete.");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// ============================================
// CREATE AUTHENTICATION INTERFACE
// ============================================

const existingSection = document.getElementById("sew-auth");

if (existingSection) {
  existingSection.remove();
}

const section = document.createElement("section");

section.id = "sew-auth";
section.className = "section";

section.innerHTML = `
  <h2>SEW Account</h2>

  <p id="sew-auth-status" role="status" aria-live="polite">
    Checking authentication...
  </p>

  <div id="sew-auth-actions" class="sew-auth-actions"></div>

  <div id="sew-account-panel" hidden>

    <hr>

    <h3>Account Overview</h3>

    <p>
      <strong>Email:</strong>
      <span id="sew-account-email"></span>
    </p>

    <p>
      <strong>Provider:</strong>
      <span id="sew-account-provider"></span>
    </p>

    <div class="sew-account-grid">

      <article class="sew-account-card">
        <h3>Saved Runs</h3>
        <p>
          Account-based run storage is not connected yet.
        </p>
        <span class="sew-placeholder">Coming later</span>
      </article>

      <article class="sew-account-card">
        <h3>Demo Runs</h3>
        <p>
          Access the existing SEW demonstration simulator.
        </p>
        <span class="sew-placeholder">Prototype feature</span>
      </article>

      <article class="sew-account-card">
        <h3>Account Settings</h3>
        <p>
          Basic account information and sign-out.
        </p>
        <span class="sew-placeholder">Basic controls</span>
      </article>

    </div>

    <div class="sew-account-controls" id="sew-account-controls"></div>

  </div>
`;

const footer = document.querySelector("footer");

if (footer) {
  footer.before(section);
} else {
  document.body.appendChild(section);
}

// ============================================
// ELEMENT REFERENCES
// ============================================

const statusElement =
  document.getElementById("sew-auth-status");

const actionsElement =
  document.getElementById("sew-auth-actions");

const accountPanel =
  document.getElementById("sew-account-panel");

const accountEmail =
  document.getElementById("sew-account-email");

const accountProvider =
  document.getElementById("sew-account-provider");

const accountControls =
  document.getElementById("sew-account-controls");

// ============================================
// STYLING
// ============================================

const style = document.createElement("style");

style.textContent = `
  #sew-auth {
    margin-top: 32px;
  }

  #sew-auth [hidden] {
    display: none !important;
  }

  .sew-auth-actions,
  .sew-account-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }

  .sew-auth-actions button,
  .sew-account-controls button {
    cursor: pointer;
  }

  .sew-auth-actions button:disabled,
  .sew-account-controls button:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  .sew-account-grid {
    display: grid;
    grid-template-columns:
      repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
    margin-top: 20px;
  }

  .sew-account-card {
    padding: 16px;
    border: 1px solid var(--border-color, rgba(128,128,128,0.35));
    border-radius: 10px;
    min-width: 0;
  }

  .sew-account-card h3 {
    margin-top: 0;
  }

  .sew-placeholder {
    display: inline-block;
    margin-top: 8px;
    font-size: 0.85em;
    opacity: 0.7;
  }

  #sew-auth-status {
    min-height: 1.5em;
  }
`;

document.head.appendChild(style);

// ============================================
// BUTTON CREATION
// ============================================

function createButton(
  label,
  callback,
  className = ""
) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = label;

  if (className) {
    button.className = className;
  }

  button.addEventListener("click", callback);

  return button;
}

// ============================================
// SIGNED-OUT INTERFACE
// ============================================

function renderSignedOut(message = "Not signed in.") {
  actionsElement.replaceChildren();
  accountControls.replaceChildren();

  accountPanel.hidden = true;

  statusElement.textContent = message;

  const googleButton = createButton(
    "Continue with Google",
    () => signIn("google")
  );

  const githubButton = createButton(
    "Continue with GitHub",
    () => signIn("github"),
    "secondary"
  );

  actionsElement.append(
    googleButton,
    githubButton
  );
}

// ============================================
// OAUTH SIGN-IN
// ============================================

async function signIn(provider) {
  if (!["google", "github"].includes(provider)) {
    statusElement.textContent =
      "Unsupported authentication provider.";

    return;
  }

  actionsElement.replaceChildren();

  statusElement.textContent =
    `Connecting to ${provider}...`;

  const loadingButton = createButton(
    `Connecting to ${provider}...`,
    () => {},
  );

  loadingButton.disabled = true;

  actionsElement.appendChild(loadingButton);

  try {
    const redirectTo =
      window.location.origin +
      window.location.pathname;

    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider,

        options: {
          redirectTo
        }
      });

    if (error) {
      console.error("SEW OAuth error:", error);

      renderSignedOut(
        `Sign-in failed: ${error.message}`
      );

      return;
    }

    // In a browser, Supabase normally redirects automatically.
    // This check is retained as a diagnostic fallback.
    if (data?.url) {
      console.log(
        "SEW OAuth authorization URL:",
        data.url
      );

      statusElement.textContent =
        "Authentication request created. Redirecting...";
    } else {
      console.error(
        "SEW OAuth returned no authorization URL:",
        data
      );

      renderSignedOut(
        "Sign-in failed: No authorization URL returned."
      );
    }

  } catch (error) {
    console.error("SEW OAuth exception:", error);

    renderSignedOut(
      `Sign-in error: ${error.message}`
    );
  }
}

// ============================================
// SIGNED-IN INTERFACE
// ============================================

function renderSignedIn(session) {
  if (!session?.user) {
    renderSignedOut();
    return;
  }

  const user = session.user;

  const provider =
    user.app_metadata?.provider ||
    user.identities?.[0]?.provider ||
    "Unknown";

  actionsElement.replaceChildren();
  accountControls.replaceChildren();

  statusElement.textContent =
    "Signed in successfully.";

  accountEmail.textContent =
    user.email || "Email unavailable";

  accountProvider.textContent =
    provider.charAt(0).toUpperCase() +
    provider.slice(1);

  accountPanel.hidden = false;

  const signOutButton = createButton(
    "Sign out",
    signOut,
    "secondary"
  );

  accountControls.appendChild(signOutButton);
}

// ============================================
// SIGN-OUT
// ============================================

async function signOut() {
  accountControls.replaceChildren();

  statusElement.textContent = "Signing out...";

  const loadingButton = createButton(
    "Signing out...",
    () => {}
  );

  loadingButton.disabled = true;

  accountControls.appendChild(loadingButton);

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("SEW sign-out error:", error);

      renderSignedIn(await getCurrentSession());

      statusElement.textContent =
        `Sign-out failed: ${error.message}`;

      return;
    }

    renderSignedOut("Signed out successfully.");

  } catch (error) {
    console.error("SEW sign-out exception:", error);

    try {
      const session = await getCurrentSession();

      if (session) {
        renderSignedIn(session);
      } else {
        renderSignedOut();
      }
    } catch (sessionError) {
      console.error(
        "SEW session recovery error:",
        sessionError
      );

      renderSignedOut(
        `Session error: ${sessionError.message}`
      );
    }

    statusElement.textContent =
      `Sign-out error: ${error.message}`;
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

async function getCurrentSession() {
  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

function renderSession(session) {
  if (session?.user) {
    renderSignedIn(session);
  } else {
    renderSignedOut();
  }
}

// ============================================
// AUTHENTICATION INITIALISATION
// ============================================

let authEventReceived = false;

// Register the listener before checking the session.
const {
  data: { subscription }
} = supabase.auth.onAuthStateChange(
  (event, session) => {
    authEventReceived = true;

    console.log("SEW authentication event:", event);

    renderSession(session);
  }
);

// Check for an existing session.
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (authEventReceived) {
      return;
    }

    if (error) {
      console.error(
        "SEW initial session error:",
        error
      );

      renderSignedOut(
        `Session check failed: ${error.message}`
      );

      return;
    }

    renderSession(data.session);
  })
  .catch((error) => {
    console.error(
      "SEW initialisation exception:",
      error
    );

    renderSignedOut(
      `Authentication initialisation failed: ${error.message}`
    );
  });

// ============================================
// MODULE READY
// ============================================

console.log("SEW authentication module loaded.");
