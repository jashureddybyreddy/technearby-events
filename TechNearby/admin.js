const loginPanel=document.getElementById("loginPanel"),dashboardPanel=document.getElementById("dashboardPanel"),loginMessage=document.getElementById("loginMessage"),adminMessage=document.getElementById("adminMessage"),pendingList=document.getElementById("pendingList");
const validConfig=()=>SUPABASE_URL&&SUPABASE_PUBLISHABLE_KEY&&!SUPABASE_URL.includes("PASTE_")&&!SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");
function notice(el,text,type="info"){el.textContent=text;el.className=`notice ${type}`;}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function date(s){if(!s)return "Not set";const d=new Date(s+"T00:00:00");return Number.isNaN(d.getTime())?s:d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});}
function validUrl(s){try{const u=new URL(s);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch{return "";}}
async function isAdmin(){const {data,error}=await supabaseClient.rpc("is_technearby_admin");if(error)throw error;return data===true;}
async function showDashboard(){
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(!session){loginPanel.classList.remove("hidden");dashboardPanel.classList.add("hidden");return;}
 try{if(!(await isAdmin())){await supabaseClient.auth.signOut();loginPanel.classList.remove("hidden");dashboardPanel.classList.add("hidden");notice(loginMessage,"This account is signed in but is not authorized as a TechNearby administrator.","error");return;}}
 catch(err){console.error(err);notice(loginMessage,"Could not verify admin permissions. Check the is_technearby_admin() function and admin_users allowlist.","error");return;}
 loginPanel.classList.add("hidden");dashboardPanel.classList.remove("hidden");await loadPending();
}
async function loadPending(){
 pendingList.innerHTML='<div class="loading-card">Loading submissions…</div>';
 const {data,error}=await supabaseClient.from("events").select("*").eq("status","pending").order("created_at",{ascending:true});
 if(error){pendingList.innerHTML="";notice(adminMessage,"Could not load pending events. Check the admin SELECT policy and database permissions.","error");console.error(error);return;}
 if(!data?.length){pendingList.innerHTML='<div class="empty-state"><div class="empty-icon">✓</div><h3>All caught up</h3><p>There are no pending event submissions.</p></div>';return;}
 pendingList.innerHTML=data.map(e=>{
  const url=validUrl(e.registration_url),poster=validUrl(e.poster_url);
  return `<article class="pending-item" data-id="${esc(e.id)}"><div>${poster?`<p><a href="${esc(poster)}" target="_blank" rel="noopener noreferrer">View poster ↗</a></p>`:""}<h3>${esc(e.title)}</h3><p><strong>Organizer:</strong> ${esc(e.organizer)} · <strong>Category:</strong> ${esc(e.category)}</p><p><strong>Location:</strong> ${esc([e.city,e.state].filter(Boolean).join(", "))} · <strong>Venue:</strong> ${esc(e.venue)}</p><p><strong>Event date:</strong> ${date(e.event_date)} · <strong>Deadline:</strong> ${date(e.deadline)}</p><p><strong>Fee:</strong> ${esc(e.fee)}</p><p>${esc(e.description)}</p><p><strong>Official link:</strong> ${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)} ↗</a>`:"Invalid URL"}</p><p class="helper">Submitted ${e.created_at?new Date(e.created_at).toLocaleString("en-IN"):"date unknown"}</p></div><div class="pending-actions"><button class="button button-small button-approve" data-action="approved">Approve</button><button class="button button-small button-reject" data-action="rejected">Reject</button></div></article>`;
 }).join("");
}
pendingList.addEventListener("click",async ev=>{
 const btn=ev.target.closest("button[data-action]");if(!btn)return;
 const item=btn.closest(".pending-item"),id=item?.dataset.id,status=btn.dataset.action;if(!id)return;
 if(status==="rejected"&&!confirm("Reject this event submission?"))return;
 btn.disabled=true;
 const {data,error}=await supabaseClient.from("events").update({status}).eq("id",id).eq("status","pending").select("id");
 btn.disabled=false;
 if(error){notice(adminMessage,"Update failed. Check the admin UPDATE policy. "+error.message,"error");return;}
 if(!data?.length){notice(adminMessage,"No row updated. It may already have been reviewed or the admin policy is not active.","error");return;}
 notice(adminMessage,status==="approved"?"Event approved and published on the homepage.":"Event rejected.","success");await loadPending();
});
document.getElementById("loginForm").addEventListener("submit",async ev=>{
 ev.preventDefault();if(!validConfig()){notice(loginMessage,"Add your Supabase URL and publishable key in config.js first.","error");return;}
 const btn=document.getElementById("loginBtn");btn.disabled=true;btn.textContent="Signing in…";
 const {error}=await supabaseClient.auth.signInWithPassword({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value});
 btn.disabled=false;btn.textContent="Sign in";
 if(error){notice(loginMessage,"Login failed: "+error.message,"error");return;}
 await showDashboard();
});
document.getElementById("logoutBtn").addEventListener("click",async()=>{await supabaseClient.auth.signOut();await showDashboard();});
document.getElementById("refreshBtn").addEventListener("click",loadPending);
document.getElementById("menuToggle").addEventListener("click",()=>{const nav=document.getElementById("mainNav"),open=nav.classList.toggle("open");document.getElementById("menuToggle").setAttribute("aria-expanded",String(open));});
if(validConfig())showDashboard();else notice(loginMessage,"Add your Supabase URL and publishable key in config.js first.","error");
