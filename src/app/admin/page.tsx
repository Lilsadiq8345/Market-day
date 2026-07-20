"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, LogOut, LayoutDashboard, CalendarDays, Loader2, MapPin, AlignLeft, ShieldCheck, Users, Search, Download, Activity, Edit2, Menu, X, Home, Clock, History, AlertCircle, CheckCircle2 } from "lucide-react";

type Village = { id: string; name: string; lga: string; state: string; };
type Market = { id: string; name: string; village_id: string; day_of_week: number; start_time: string; location: string; description: string; villages?: { name: string }; };
type User = { id: string; full_name: string; email: string; phone: string; preferred_channel: string; created_at: string; villages?: { name: string }; };
type Subscription = { id: string; user_id: string; market_id: string; users?: { full_name: string; email: string }; markets?: { name: string }; };
type ReminderLog = { id: string; user_id: string; market_id: string; channel: string; sent_at: string; status: string; error_message: string; users?: { email: string }; markets?: { name: string }; };

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"markets" | "villages" | "users" | "logs">("markets");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data State
  const [villages, setVillages] = useState<Village[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [logs, setLogs] = useState<ReminderLog[]>([]);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Forms State
  const [submitting, setSubmitting] = useState(false);
  
  // Village Form
  const [editVillageId, setEditVillageId] = useState<string | null>(null);
  const [vName, setVName] = useState("");
  const [vLga, setVLga] = useState("");
  const [vState, setVState] = useState("");

  // Market Form
  const [editMarketId, setEditMarketId] = useState<string | null>(null);
  const [mName, setMName] = useState("");
  const [mVillageId, setMVillageId] = useState("");
  const [mDay, setMDay] = useState("0");
  const [mTime, setMTime] = useState("08:00");
  const [mLoc, setMLoc] = useState("");
  const [mDesc, setMDesc] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const [vRes, mRes, uRes, sRes, lRes] = await Promise.all([
      supabase.from("villages").select("*").order("name"),
      supabase.from("markets").select("*, villages(name)").order("day_of_week"),
      supabase.from("users").select("*, villages(name)").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*, users(full_name, email), markets(name)"),
      supabase.from("reminder_logs").select("*, users(email), markets(name)").order("sent_at", { ascending: false }).limit(100)
    ]);
    
    if (vRes.data) setVillages(vRes.data);
    if (mRes.data) setMarkets(mRes.data);
    if (uRes.data) setUsers(uRes.data);
    if (sRes.data) setSubscriptions(sRes.data);
    if (lRes.data) setLogs(lRes.data);
    
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
    setIsLoggingIn(false);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  // VILLAGE HANDLERS
  const resetVillageForm = () => { setEditVillageId(null); setVName(""); setVLga(""); setVState(""); };
  const saveVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (editVillageId) {
      await supabase.from("villages").update({ name: vName, lga: vLga, state: vState }).eq('id', editVillageId);
    } else {
      await supabase.from("villages").insert([{ name: vName, lga: vLga, state: vState }]);
    }
    resetVillageForm();
    await fetchAllData();
    setSubmitting(false);
  };
  const deleteVillage = async (id: string) => {
    if (window.confirm("Delete village? This deletes all associated markets.")) {
      await supabase.from("villages").delete().eq("id", id);
      fetchAllData();
    }
  };

  // MARKET HANDLERS
  const resetMarketForm = () => { setEditMarketId(null); setMName(""); setMVillageId(""); setMDay("0"); setMTime("08:00"); setMLoc(""); setMDesc(""); };
  const saveMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data = { name: mName, village_id: mVillageId, day_of_week: parseInt(mDay), start_time: mTime, location: mLoc, description: mDesc };
    if (editMarketId) {
      await supabase.from("markets").update(data).eq('id', editMarketId);
    } else {
      await supabase.from("markets").insert([data]);
    }
    resetMarketForm();
    await fetchAllData();
    setSubmitting(false);
  };
  const deleteMarket = async (id: string) => {
    if (window.confirm("Delete market? This removes all subscriptions to it.")) {
      await supabase.from("markets").delete().eq("id", id);
      fetchAllData();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 w-full max-w-md p-6 md:p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6"><ShieldCheck className="w-8 h-8" /></div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Admin Portal</h1>
          </div>
          {loginError && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3.5 bg-black/40 border border-zinc-700 text-white rounded-xl" placeholder="Admin Email" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3.5 bg-black/40 border border-zinc-700 text-white rounded-xl" placeholder="Password" required />
            <button type="submit" disabled={isLoggingIn} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">{isLoggingIn ? "Logging in..." : "Secure Login"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex text-zinc-200">
      {/* Sidebar */}
      <aside className={`w-72 bg-black border-r border-zinc-800 flex flex-col fixed h-full shadow-2xl z-40 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-8 border-b border-zinc-800"><h2 className="text-white font-bold text-xl">Admin Dashboard</h2></div>
        <nav className="flex-1 p-6 space-y-2">
          <button onClick={() => setActiveTab('villages')} className={`w-full flex items-center p-4 rounded-xl font-semibold ${activeTab === 'villages' ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-900'}`}><Home className="w-5 h-5 mr-3" /> Villages</button>
          <button onClick={() => setActiveTab('markets')} className={`w-full flex items-center p-4 rounded-xl font-semibold ${activeTab === 'markets' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900'}`}><CalendarDays className="w-5 h-5 mr-3" /> Markets</button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center p-4 rounded-xl font-semibold ${activeTab === 'users' ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-400 hover:bg-zinc-900'}`}><Users className="w-5 h-5 mr-3" /> Users & Subs</button>
          <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center p-4 rounded-xl font-semibold ${activeTab === 'logs' ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:bg-zinc-900'}`}><History className="w-5 h-5 mr-3" /> Reminder Logs</button>
        </nav>
        <div className="p-6 border-t border-zinc-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center p-4 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400"><LogOut className="w-5 h-5 mr-3" /> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-6 lg:p-10 relative">
        {activeTab === 'villages' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Manage Villages</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-6">{editVillageId ? 'Edit' : 'Add'} Village</h2>
                <form onSubmit={saveVillage} className="space-y-4">
                  <input type="text" value={vName} onChange={e=>setVName(e.target.value)} placeholder="Village Name" required className="w-full p-3 bg-black border border-zinc-700 rounded-xl outline-none focus:border-indigo-500" />
                  <input type="text" value={vLga} onChange={e=>setVLga(e.target.value)} placeholder="LGA" required className="w-full p-3 bg-black border border-zinc-700 rounded-xl outline-none focus:border-indigo-500" />
                  <input type="text" value={vState} onChange={e=>setVState(e.target.value)} placeholder="State" required className="w-full p-3 bg-black border border-zinc-700 rounded-xl outline-none focus:border-indigo-500" />
                  <button type="submit" disabled={submitting} className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">{submitting ? 'Saving...' : 'Save'}</button>
                  {editVillageId && <button type="button" onClick={resetVillageForm} className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold mt-2">Cancel</button>}
                </form>
              </div>
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="text-zinc-400 border-b border-zinc-800">
                    <tr><th className="pb-3">Name</th><th className="pb-3">LGA</th><th className="pb-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {villages.map(v => (
                      <tr key={v.id}>
                        <td className="py-4 font-semibold text-white">{v.name}</td>
                        <td className="py-4 text-zinc-400">{v.lga}, {v.state}</td>
                        <td className="py-4 text-right">
                          <button onClick={() => { setEditVillageId(v.id); setVName(v.name); setVLga(v.lga); setVState(v.state); }} className="text-blue-400 mr-4"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteVillage(v.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'markets' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Manage Markets</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-6">{editMarketId ? 'Edit' : 'Add'} Market</h2>
                <form onSubmit={saveMarket} className="space-y-4">
                  <input type="text" value={mName} onChange={e=>setMName(e.target.value)} placeholder="Market Name" required className="w-full p-3 bg-black border border-zinc-700 rounded-xl" />
                  <select value={mVillageId} onChange={e=>setMVillageId(e.target.value)} required className="w-full p-3 bg-black border border-zinc-700 rounded-xl">
                    <option value="">Select Village</option>
                    {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <select value={mDay} onChange={e=>setMDay(e.target.value)} required className="w-full p-3 bg-black border border-zinc-700 rounded-xl">
                    {DAYS_OF_WEEK.map((d,i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <input type="time" value={mTime} onChange={e=>setMTime(e.target.value)} required className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-white" />
                  <input type="text" value={mLoc} onChange={e=>setMLoc(e.target.value)} placeholder="Location details" required className="w-full p-3 bg-black border border-zinc-700 rounded-xl" />
                  <button type="submit" disabled={submitting} className="w-full p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">{submitting ? 'Saving...' : 'Save'}</button>
                  {editMarketId && <button type="button" onClick={resetMarketForm} className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold mt-2">Cancel</button>}
                </form>
              </div>
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="text-zinc-400 border-b border-zinc-800">
                    <tr><th className="pb-3">Market</th><th className="pb-3">Village</th><th className="pb-3">Schedule</th><th className="pb-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {markets.map(m => (
                      <tr key={m.id}>
                        <td className="py-4 font-semibold text-white">{m.name}</td>
                        <td className="py-4 text-zinc-400">{m.villages?.name}</td>
                        <td className="py-4 text-emerald-400 font-bold text-sm">{DAYS_OF_WEEK[m.day_of_week]} @ {m.start_time.substring(0,5)}</td>
                        <td className="py-4 text-right">
                          <button onClick={() => { setEditMarketId(m.id); setMName(m.name); setMVillageId(m.village_id); setMDay(m.day_of_week.toString()); setMTime(m.start_time); setMLoc(m.location); setMDesc(m.description || ""); }} className="text-blue-400 mr-4"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteMarket(m.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Users & Subscriptions</h1>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="text-zinc-400 border-b border-zinc-800">
                  <tr><th className="pb-3">User</th><th className="pb-3">Contact</th><th className="pb-3">Home Village</th><th className="pb-3">Subscriptions</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map(u => {
                    const userSubs = subscriptions.filter(s => s.user_id === u.id);
                    return (
                      <tr key={u.id}>
                        <td className="py-4 text-white font-medium">{u.full_name}</td>
                        <td className="py-4 text-zinc-400 text-sm">{u.email}<br/>{u.phone}</td>
                        <td className="py-4 text-zinc-400 text-sm">{u.villages?.name || 'N/A'}</td>
                        <td className="py-4 text-sm">
                          {userSubs.map(s => <span key={s.id} className="inline-block bg-blue-500/20 text-blue-400 px-2 py-1 rounded mr-2 mb-1">{s.markets?.name}</span>)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Reminder Logs</h1>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="text-zinc-400 border-b border-zinc-800">
                  <tr><th className="pb-3">Date Sent</th><th className="pb-3">User Email</th><th className="pb-3">Market</th><th className="pb-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="py-4 text-zinc-300 text-sm">{new Date(log.sent_at).toLocaleString()}</td>
                      <td className="py-4 text-zinc-300">{log.users?.email}</td>
                      <td className="py-4 text-zinc-300">{log.markets?.name}</td>
                      <td className="py-4">
                        {log.status === 'success' ? 
                          <span className="flex items-center text-emerald-400 text-sm"><CheckCircle2 className="w-4 h-4 mr-1"/> Success</span> : 
                          <span className="flex items-center text-red-400 text-sm" title={log.error_message}><AlertCircle className="w-4 h-4 mr-1"/> Failed</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
