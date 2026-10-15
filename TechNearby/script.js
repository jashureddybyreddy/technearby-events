const $ = (id) => document.getElementById(id);
const stateFilter = $("stateFilter"), categoryFilter = $("categoryFilter"), sortFilter = $("sortFilter");
let allEvents = [];
const validConfig = () => SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_URL.includes("PASTE_") && !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");
function fmtDate(value) {
  if (!value) return "Date to be confirmed";
  const d = new Date(value + "T00:00:00");
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function safeUrl(value) {
  try { const u = new URL(value); return ["http:","https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; }
}
function populateStates(events) {
  const current = stateFilter.value;
  const states = [...new Set(events.map(e => e.state).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  stateFilter.innerHTML = '<option value="">All states</option>' + states.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  stateFilter.value = states.includes(current) ? current : "";
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function cardHtml(e) {
  const poster = safeUrl(e.poster_url);
  const reg = safeUrl(e.registration_url);
  const icon = ({Hackathon:"⌘",Coding:"</>",Workshop:"✳",Symposium:"◈",Other:"✦"})[e.category] || "✦";
  return `<article class="event-card">
    <div class="event-poster">${poster ? `<img src="${escapeHtml(poster)}" alt="${escapeHtml(e.title)} poster" loading="lazy" onerror="this.remove()">` : `<span class="poster-placeholder" aria-hidden="true">${icon}</span>`}<span class="category-tag">${escapeHtml(e.category)}</span></div>
    <div class="event-body"><div><h3>${escapeHtml(e.title)}</h3><p class="event-organizer">${escapeHtml(e.organizer)}</p></div>
    <div class="event-meta"><div class="meta-row"><span class="meta-icon">◷</span><span><strong>Event:</strong> ${fmtDate(e.event_date)}</span></div>
    <div class="meta-row"><span class="meta-icon">⌛</span><span><strong>Deadline:</strong> ${fmtDate(e.deadline)}</span></div>
    <div class="meta-row"><span class="meta-icon">⌖</span><span>${escapeHtml([e.city,e.state].filter(Boolean).join(", "))}</span></div></div>
    <p class="event-description">${escapeHtml(e.description)}</p>
    <div class="event-bottom"><span class="fee">${escapeHtml(e.fee || "Check official page")}</span>${reg ? `<a class="event-link" href="${escapeHtml(reg)}" target="_blank" rel="noopener noreferrer">Official page ↗</a>` : `<span class="fee">Link unavailable</span>`}</div></div></article>`;
}
function render() {
  const q = $("searchInput").value.trim().toLowerCase();
  let events = allEvents.filter(e => {
    const haystack = [e.title,e.organizer,e.city,e.state,e.category,e.venue,e.description].join(" ").toLowerCase();
    return (!q || haystack.includes(q)) && (!stateFilter.value || e.state === stateFilter.value) && (!categoryFilter.value || e.category === categoryFilter.value);
  });
  if (sortFilter.value === "deadline") events.sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999"));
  else if (sortFilter.value === "newest") events.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
  else events.sort((a,b)=>(a.event_date||"9999").localeCompare(b.event_date||"9999"));
  $("eventGrid").innerHTML = events.length ? events.map(cardHtml).join("") : "";
  $("eventGrid").classList.toggle("hidden", !events.length);
  $("emptyState").hidden = !!events.length;
  $("resultsCount").textContent = `${events.length} event${events.length===1?"":"s"} found`;
}
function clearFilters() { $("searchInput").value="";stateFilter.value="";categoryFilter.value="";sortFilter.value="date";render(); }
async function loadEvents() {
  if (!validConfig()) {
    $("eventGrid").innerHTML = '<div class="loading-card">Add your Supabase URL and publishable key to <strong>config.js</strong>, then refresh this page.</div>';
    $("resultsCount").textContent = "Setup required"; return;
  }
  const {data,error} = await supabaseClient.from("events").select("*").eq("status","approved");
  if (error) {
    $("eventGrid").innerHTML = '<div class="loading-card">Could not load events. Check your Supabase connection and events-table read policy, then refresh.</div>';
    $("resultsCount").textContent = "Could not load"; console.error(error); return;
  }
  allEvents = data || []; populateStates(allEvents); render();
  if (!allEvents.length) $("dataNote").textContent = "No approved events yet. Approved events submitted by organizers will appear here.";
}
$("searchInput").addEventListener("input",render);
[stateFilter,categoryFilter,sortFilter].forEach(el=>el.addEventListener("change",render));
$("clearFilters").addEventListener("click",clearFilters); $("emptyClear").addEventListener("click",clearFilters);
const menuToggle = $("menuToggle"), mainNav = $("mainNav");
menuToggle.addEventListener("click",()=>{const open=mainNav.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open));});
loadEvents();
