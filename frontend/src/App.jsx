import React, { useEffect, useState } from "react";
import { api, getToken, imageUrl } from "./api";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { AlertCircle, MapPin, Plus, Search, ShieldCheck, LogOut, Camera, ListFilter, X } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const statusClass = (s) => `status ${s}`;
function Auth({ onDone }) {
  const [mode, setMode] = useState("login"), [username, setUsername] = useState(""), [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault(); setError("");
    try {
      const data = await api(`/auth/${mode}/`, { method: "POST", body: JSON.stringify({ username, password }) });
      localStorage.setItem("civic_token", data.token); onDone();
    } catch (err) { setError(err.message); }
  }
  return <div className="auth-wrap"><div className="auth-card"><div className="brand-mark">CC</div><p className="eyebrow">NEIGHBORHOOD CIVIC PLATFORM</p><h1>{mode === "login" ? "Welcome back" : "Create resident account"}</h1><p className="muted">Report local problems. Help make your neighborhood better.</p>
    <form onSubmit={submit}><label>Username</label><input required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Choose a username"/><label>Password</label><input required minLength="8" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/>{error && <p className="error">{error}</p>}<button className="primary full">{mode === "login" ? "Sign in" : "Create account"}</button></form>
    <p className="switch">{mode === "login" ? "New here?" : "Already registered?"} <button className="link" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Create an account":"Sign in"}</button></p>
  </div></div>;
}
function PickLocation({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position ? <Marker position={position}><Popup>Selected issue location</Popup></Marker> : null;
}
function ReportModal({ categories, wards, onClose, onCreated }) {
  const [form, setForm] = useState({title:"", description:"", category:"", ward:"", latitude:"", longitude:"", address_hint:""});
  const [photo, setPhoto] = useState(null), [position, setPosition] = useState([11.0168, 76.9558]), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  useEffect(()=>setForm(f=>({...f, latitude:position[0], longitude:position[1]})),[position]);
  function locate() { navigator.geolocation?.getCurrentPosition(p=>setPosition([p.coords.latitude,p.coords.longitude]),()=>setError("Location permission unavailable. Click the map to select a location.")); }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      const fieldValue = key === "latitude" || key === "longitude"
        ? Number(value).toFixed(6)
        : value;
      data.append(key, fieldValue);
    });
    if(photo) data.append("image",photo);
    try { await api("/reports/", {method:"POST", body:data}); onCreated(); onClose(); }
    catch(err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="overlay"><div className="modal"><div className="modal-head"><div><p className="eyebrow">NEW COMMUNITY REPORT</p><h2>Report an issue</h2></div><button className="icon-btn" onClick={onClose}><X/></button></div>
    <form onSubmit={submit}><div className="form-grid"><div className="span-2"><label>Issue title</label><input required maxLength="140" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Large pothole near bus stop"/></div>
    <div><label>Category</label><select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="">Choose category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div><label>Municipal ward</label><select required value={form.ward} onChange={e=>setForm({...form,ward:e.target.value})}><option value="">Choose ward</option>{wards.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
    <div className="span-2"><label>Description</label><textarea required rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the issue and nearby landmark..."/></div>
    <div className="span-2"><label>Pin the location <span className="muted">(click on map)</span></label><div className="map-wrap"><MapContainer center={position} zoom={13} scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><PickLocation position={position} setPosition={setPosition}/></MapContainer></div><button type="button" className="secondary small" onClick={locate}><MapPin size={15}/> Use my current location</button><div className="coords">Lat: {Number(position[0]).toFixed(6)} · Lng: {Number(position[1]).toFixed(6)}</div></div>
    <div className="span-2"><label>Nearby landmark / address (optional)</label><input value={form.address_hint} onChange={e=>setForm({...form,address_hint:e.target.value})} placeholder="Street, landmark, area"/></div>
    <div className="span-2"><label>Photo evidence (optional)</label><label className="upload"><Camera size={18}/><span>{photo ? photo.name : "Choose an image from your device"}</span><input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0])}/></label></div></div>
    {error && <p className="error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button disabled={busy} className="primary">{busy?"Submitting...":"Submit report"}</button></div></form>
  </div></div>;
}
function App() {
  const [logged, setLogged] = useState(!!getToken()), [user, setUser] = useState(null), [reports, setReports] = useState([]), [categories, setCategories] = useState([]), [wards, setWards] = useState([]);
  const [showModal, setShowModal] = useState(false), [selected, setSelected] = useState(null), [search, setSearch] = useState(""), [filter, setFilter] = useState("all"), [loading, setLoading] = useState(true), [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try {
      const [r,c,w] = await Promise.all([api(`/reports/${search?`?search=${encodeURIComponent(search)}`:""}`),api("/categories/"),api("/wards/")]);
      setReports(r); setCategories(c); setWards(w);
      if(getToken()) { try { setUser(await api("/auth/me/")); } catch { localStorage.removeItem("civic_token"); setLogged(false); } }
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(()=>{load();},[logged]);
  useEffect(()=>{const t=setTimeout(()=>{if(logged) load();},350);return ()=>clearTimeout(t);},[search]);
  const visible = reports.filter(r=>filter==="all" || r.status===filter);
  const counts = {total:reports.length, open:reports.filter(r=>!["resolved","rejected"].includes(r.status)).length, resolved:reports.filter(r=>r.status==="resolved").length, escalated:reports.filter(r=>r.is_escalated).length};
  if(!logged) return <Auth onDone={()=>setLogged(true)}/>;
  return <div className="app-shell"><aside className="sidebar"><div className="logo"><span>CC</span><div><b>CivicConnect</b><small>Community reporting</small></div></div><div className="side-label">WORKSPACE</div><button className="side-active"><ListFilter size={17}/> Issue dashboard</button><div className="side-note"><ShieldCheck size={18}/><div><b>Your voice matters</b><p>Every report helps build a safer, cleaner neighborhood.</p></div></div><div className="sidebar-bottom"><div className="avatar">{user?.username?.[0]?.toUpperCase()||"R"}</div><div className="user-meta"><b>{user?.username||"Resident"}</b><small>Resident account</small></div><button className="icon-btn" title="Sign out" onClick={()=>{localStorage.removeItem("civic_token");setLogged(false);setUser(null);}}><LogOut size={17}/></button></div></aside>
    <main className="main"><header className="topbar"><div><p className="eyebrow">CIVIC ISSUE MANAGEMENT</p><h1>Neighborhood dashboard</h1></div><button className="primary" onClick={()=>setShowModal(true)}><Plus size={18}/> Report an issue</button></header>
    <section className="welcome"><div><h2>Make your neighborhood better.</h2><p>Spot a problem? Report it. Track progress. Be part of the solution.</p></div><div className="welcome-icon"><MapPin size={34}/></div></section>
    <section className="stats"><div className="stat"><span>Total reports</span><b>{counts.total}</b><small>Community submissions</small></div><div className="stat"><span>Open issues</span><b>{counts.open}</b><small>Awaiting resolution</small></div><div className="stat"><span>Resolved</span><b>{counts.resolved}</b><small>Issues fixed</small></div><div className="stat"><span>Escalated</span><b>{counts.escalated}</b><small>Needs attention</small></div></section>
    <section className="reports-section"><div className="section-head"><div><h2>Community reports</h2><p className="muted">Recent civic issues reported by residents</p></div><div className="filters"><div className="search"><Search size={16}/><input placeholder="Search reports..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option><option value="submitted">Submitted</option><option value="acknowledged">Acknowledged</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option></select></div></div>
    {error && <div className="notice"><AlertCircle size={18}/>{error}</div>}
    {loading ? <div className="empty">Loading community reports...</div> : visible.length===0 ? <div className="empty"><div className="empty-icon"><MapPin/></div><b>No reports found</b><p>Be the first to report an issue in your neighborhood.</p><button className="primary" onClick={()=>setShowModal(true)}><Plus size={16}/> Create first report</button></div> :
    <div className="report-grid">{visible.map(r=><article className="report-card" key={r.id} onClick={()=>setSelected(r)}><div className="report-image">{r.attachments?.[0]?.url ? <img src={imageUrl(r.attachments[0].url)} alt="Issue evidence"/> : <div className="placeholder"><MapPin size={25}/><span>Location report</span></div>}<span className={statusClass(r.status)}>{r.status_label}</span></div><div className="report-body"><div className="report-category">{r.category_name} <span>·</span> {r.ward_name}</div><h3>{r.title}</h3><p>{r.description}</p><div className="report-foot"><span><MapPin size={14}/>{Number(r.latitude).toFixed(3)}, {Number(r.longitude).toFixed(3)}</span><small>{new Date(r.created_at).toLocaleDateString()}</small></div>{r.is_escalated && <div className="escalated">Escalated for review</div>}</div></article>)}</div>}
    </section><footer>Built for better neighborhoods <span>·</span> CivicConnect</footer></main>
    {showModal && <ReportModal categories={categories} wards={wards} onClose={()=>setShowModal(false)} onCreated={load}/>}
    {selected && <div className="overlay" onClick={()=>setSelected(null)}><div className="modal detail-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">REPORT #{selected.id}</p><h2>{selected.title}</h2></div><button className="icon-btn" onClick={()=>setSelected(null)}><X/></button></div><span className={statusClass(selected.status)}>{selected.status_label}</span><p>{selected.description}</p>{selected.attachments?.[0]?.url && <img className="detail-image" src={imageUrl(selected.attachments[0].url)} alt="Issue evidence"/>}<p className="muted">{selected.category_name} · {selected.ward_name} · Reported by {selected.reporter_name}</p><p><MapPin size={15}/> {selected.address_hint || `${selected.latitude}, ${selected.longitude}`}</p>{selected.is_escalated && <p className="escalated">{selected.escalation_note}</p>}<a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}>Open location in OpenStreetMap ↗</a></div></div>}
  </div>;
}
export default App;
