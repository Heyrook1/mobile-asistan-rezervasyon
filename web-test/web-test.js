import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const els = {
  url: document.getElementById("url"),
  anon: document.getElementById("anon"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  output: document.getElementById("output"),
  saveConfig: document.getElementById("saveConfig"),
  registerBtn: document.getElementById("registerBtn"),
  signInBtn: document.getElementById("signInBtn"),
  signOutBtn: document.getElementById("signOutBtn"),
  profileBtn: document.getElementById("profileBtn"),
  discoveryBtn: document.getElementById("discoveryBtn"),
  appointmentsBtn: document.getElementById("appointmentsBtn"),
  authState: document.getElementById("authState"),
  configState: document.getElementById("configState"),
  statusBadge: document.getElementById("statusBadge"),
  clearOutput: document.getElementById("clearOutput"),
};

const storageKey = "asistan-web-test-config";
let supabase = null;
let isBusy = false;

function getRuntimeEnv() {
  const runtime = window.__ENV__ || {};
  return {
    url: (runtime.SUPABASE_URL || "").trim(),
    anon: (runtime.SUPABASE_ANON_KEY || "").trim(),
  };
}

function renderOutput(data, isError = false) {
  els.output.textContent =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  els.output.className = isError ? "err" : "ok";
}

function setStatus(text) {
  if (els.statusBadge) els.statusBadge.textContent = `Status: ${text}`;
}

function setBusy(nextBusy) {
  isBusy = nextBusy;
  const controls = [
    els.saveConfig,
    els.registerBtn,
    els.signInBtn,
    els.signOutBtn,
    els.profileBtn,
    els.discoveryBtn,
    els.appointmentsBtn,
  ];
  for (const control of controls) {
    if (control) control.disabled = isBusy;
  }
}

function loadConfig() {
  try {
    const runtime = getRuntimeEnv();
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const url = runtime.url || saved.url || "";
    const anon = runtime.anon || saved.anon || "";

    els.url.value = url;
    els.anon.value = anon;

    if (url && anon) {
      supabase = createClient(url, anon);
      if (runtime.url && runtime.anon) {
        els.configState.textContent = "Config loaded from .env (via env.js).";
      } else {
        els.configState.textContent = "Config loaded from localStorage.";
      }
      setStatus("config ready");
    } else {
      els.configState.textContent = "Config missing.";
      setStatus("waiting for config");
    }
  } catch (err) {
    renderOutput(err.message || String(err), true);
    setStatus("config error");
  }
}

function saveConfig() {
  const url = els.url.value.trim();
  const anon = els.anon.value.trim();
  if (!url || !anon) {
    renderOutput("Please enter both Supabase URL and anon key.", true);
    setStatus("missing config values");
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify({ url, anon }));
  supabase = createClient(url, anon);
  els.configState.textContent = "Config saved.";
  renderOutput("Config saved. You can now sign in or call functions.");
  setStatus("config ready");
}

function ensureClient() {
  if (!supabase) throw new Error("Save config first.");
  return supabase;
}

async function invoke(name, body) {
  const client = ensureClient();
  const { data, error } = await client.functions.invoke(name, { body });
  if (error) throw error;
  return data;
}

async function register() {
  const email = els.email.value.trim().toLowerCase();
  const password = els.password.value;
  if (!email || !password) throw new Error("Email and password are required.");
  const fullName = email.split("@")[0] || "Web Tester";
  const phone = "+900000000000";
  return invoke("auth-client", {
    action: "register",
    fullName,
    email,
    phone,
    password,
  });
}

async function signIn() {
  const client = ensureClient();
  const email = els.email.value.trim().toLowerCase();
  const password = els.password.value;
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  els.authState.textContent = `Signed in as ${data.user?.email || "unknown"}`;
  return data;
}

async function signOut() {
  const client = ensureClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
  els.authState.textContent = "Signed out";
  return { ok: true };
}

async function getProfile() {
  return invoke("auth-client", { action: "get" });
}

async function discovery() {
  return invoke("catalog", { action: "discovery", lat: null, lng: null });
}

async function myAppointments() {
  return invoke("booking", { action: "list" });
}

async function run(action) {
  if (isBusy) return;
  setBusy(true);
  try {
    const result = await action();
    renderOutput(result);
    if (supabase) setStatus("ready");
  } catch (err) {
    const msg = err?.message || err?.error_description || String(err);
    renderOutput(msg, true);
    setStatus("request failed");
  } finally {
    setBusy(false);
  }
}

els.saveConfig.addEventListener("click", () => run(saveConfig));
els.registerBtn.addEventListener("click", () => run(register));
els.signInBtn.addEventListener("click", () => run(signIn));
els.signOutBtn.addEventListener("click", () => run(signOut));
els.profileBtn.addEventListener("click", () => run(getProfile));
els.discoveryBtn.addEventListener("click", () => run(discovery));
els.appointmentsBtn.addEventListener("click", () => run(myAppointments));
els.clearOutput.addEventListener("click", () => renderOutput("Ready."));

loadConfig();
