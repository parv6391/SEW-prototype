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
`;

document.querySelector("footer").before(section);

const status = document.getElementById("authStatus");
const actions = document.getElementById("authActions");

function makeButton(label, className, callback) {
  const button = document.createElement("button");
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", callback);
  actions.append(button);
}

async function signIn(provider) {
  status.textContent = `Connecting to ${provider}...`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });

  if (error) {
    status.textContent = `Sign-in failed: ${error.message}`;
  }
}

async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    status.textContent = `Sign-out failed: ${error.message}`;
  }
}

function renderSession(session) {
  actions.replaceChildren();

  if (session?.user) {
    status.textContent =
      `Signed in as ${session.user.email || "Authenticated user"}`;

    makeButton("Sign out", "secondary", signOut);
    return;
  }

  status.textContent = "Not signed in.";

  makeButton("Continue with Google", "", () => signIn("google"));
  makeButton("Continue with GitHub", "secondary", () => signIn("github"));
}

supabase.auth.onAuthStateChange((event, session) => {
  renderSession(session);
});

supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    status.textContent = `Session check failed: ${error.message}`;
    return;
  }

  renderSession(data.session);
});
