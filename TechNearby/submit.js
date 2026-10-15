const form = document.getElementById("eventForm"), message = document.getElementById("formMessage"), submitBtn = document.getElementById("submitBtn");
const validConfig = () => SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && !SUPABASE_URL.includes("PASTE_") && !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");
function showMessage(text,type="info"){message.textContent=text;message.className=`notice ${type}`;}
function urlOk(s){try{const u=new URL(s);return u.protocol==="https:"||u.protocol==="http:";}catch{return false;}}
const today = new Date(); today.setHours(0,0,0,0);
const minDate = today.toISOString().slice(0,10);
document.getElementById("event_date").min = minDate;
document.getElementById("deadline").min = minDate;
document.getElementById("menuToggle").addEventListener("click",()=>{const nav=document.getElementById("mainNav"),open=nav.classList.toggle("open");document.getElementById("menuToggle").setAttribute("aria-expanded",String(open));});
form.addEventListener("submit",async(ev)=>{
 ev.preventDefault(); if(!validConfig()){showMessage("Add your Supabase URL and publishable key in config.js first.","error");return;}
 const f=new FormData(form), registrationUrl=String(f.get("registration_url")||"").trim();
 const eventDate=String(f.get("event_date")), deadline=String(f.get("deadline"));
 if(!urlOk(registrationUrl)){showMessage("Enter a valid http:// or https:// registration URL.","error");return;}
 if(deadline>eventDate){showMessage("The registration deadline cannot be after the event date.","error");return;}
 const description=String(f.get("description")||"").trim();
 if(description.length<20){showMessage("Please enter at least 20 characters in the description.","error");return;}
 submitBtn.disabled=true;submitBtn.textContent="Submitting…";
 try{
  let posterUrl=null; const poster=document.getElementById("poster").files[0];
  if(poster){
   if(poster.size>3*1024*1024)throw new Error("Poster must be 3 MB or smaller.");
   if(!["image/png","image/jpeg","image/webp"].includes(poster.type))throw new Error("Poster must be PNG, JPG, or WebP.");
   const ext=poster.type==="image/png"?"png":poster.type==="image/webp"?"webp":"jpg";
   const path=`${crypto.randomUUID()}.${ext}`;
   const {error:uploadError}=await supabaseClient.storage.from("event-posters").upload(path,poster,{contentType:poster.type,upsert:false});
   if(uploadError)throw new Error("Poster upload failed. Check the event-posters storage bucket and upload policy, or submit without a poster. Details: "+uploadError.message);
   const {data}=supabaseClient.storage.from("event-posters").getPublicUrl(path); posterUrl=data.publicUrl;
  }
  const payload={title:String(f.get("title")).trim(),organizer:String(f.get("organizer")).trim(),category:String(f.get("category")),city:String(f.get("city")).trim(),state:String(f.get("state")),venue:String(f.get("venue")).trim(),event_date:eventDate,deadline,fee:String(f.get("fee")||"").trim()||"Check official page",registration_url:registrationUrl,poster_url:posterUrl,description,status:"pending"};
  const {error}=await supabaseClient.from("events").insert(payload);
  if(error)throw error;
  form.reset();showMessage("Submission received! Your event is pending admin review. It will appear publicly only after approval.","success");
 }catch(err){console.error(err);showMessage(err.message||"Submission failed. Please try again.","error");}
 finally{submitBtn.disabled=false;submitBtn.textContent="Submit for review →";}
});
