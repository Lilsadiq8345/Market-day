"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, LogOut, LayoutDashboard, CalendarDays, Loader2, MapPin, AlignLeft, ShieldCheck, Users, Search, Download, TrendingUp, Activity, BarChart3, Edit2, Menu, X } from "lucide-react";

type Market = {
  id: string;
  name: string;
  day_of_week: number;
  location: string;
  description: string;
};

type Subscriber = {
  id: string;
  email: string;
  created_at: string;
  markets: {
    name: string;
  };
};

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"markets" | "subscribers">("markets");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Form State
  const [editingMarketId, setEditingMarketId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDay, setNewDay] = useState("0");
  const [newLocation, setNewLocation] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchMarkets();
        fetchSubscribers();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchMarkets();
        fetchSubscribers();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMarkets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .order("day_of_week", { ascending: true });

    if (!error && data) {
      setMarkets(data);
    }
    setLoading(false);
  };

  const fetchSubscribers = async () => {
    const { data, error } = await supabase
      .from("subscribers")
      .select("id, email, created_at, markets(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubscribers(data as unknown as Subscriber[]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setLoginError(error.message);
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const resetForm = () => {
    setEditingMarketId(null);
    setNewName("");
    setNewDay("0");
    setNewLocation("");
    setNewDesc("");
  };

  const handleEditClick = (market: Market) => {
    setEditingMarketId(market.id);
    setNewName(market.name);
    setNewDay(market.day_of_week.toString());
    setNewLocation(market.location);
    setNewDesc(market.description || "");
    
    // Scroll to top on mobile to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (editingMarketId) {
      // UPDATE
      const { error } = await supabase
        .from("markets")
        .update({
          name: newName,
          day_of_week: parseInt(newDay),
          location: newLocation,
          description: newDesc,
        })
        .eq('id', editingMarketId);

      if (!error) {
        resetForm();
        fetchMarkets();
      } else {
        alert("Error updating market: " + error.message);
      }
    } else {
      // INSERT
      const { error } = await supabase.from("markets").insert([
        {
          name: newName,
          day_of_week: parseInt(newDay),
          location: newLocation,
          description: newDesc,
        },
      ]);

      if (!error) {
        resetForm();
        fetchMarkets();
      } else {
        alert("Error adding market: " + error.message);
      }
    }
    
    setSubmitting(false);
  };

  const handleDeleteMarket = async (id: string) => {
    if (!window.confirm("Are you sure? This will delete all subscriptions to this market as well.")) return;
    
    const { error } = await supabase.from("markets").delete().eq("id", id);
    if (!error) {
      if (editingMarketId === id) resetForm();
      fetchMarkets();
      fetchSubscribers(); 
    } else {
      alert("Error deleting market");
    }
  };

  const exportToCSV = () => {
    if (subscribers.length === 0) return;
    
    const headers = ["Email", "Market Subscribed", "Registration Date"];
    const rows = subscribers.map(sub => [
      sub.email,
      sub.markets?.name || "Unknown",
      new Date(sub.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `market_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (sub.markets?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md p-6 md:p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transform transition-all hover:scale-[1.01] duration-500">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Admin Portal</h1>
            <p className="text-zinc-400 mt-2 font-medium">Market Day Reminder System</p>
          </div>
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center animate-in fade-in slide-in-from-top-2">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-300 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 bg-black/40 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300"
                placeholder="admin@marketday.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-300 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 bg-black/40 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 flex justify-center items-center group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Secure Login
                  <ShieldCheck className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD SCREEN
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex text-zinc-200">
      
      {/* Mobile Header (Visible only on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-zinc-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center mr-3">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <h2 className="text-white font-bold text-lg">Admin</h2>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 bg-black border-r border-zinc-800 flex flex-col fixed h-full shadow-2xl z-40 transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-8 border-b border-zinc-800 flex items-center hidden lg:flex">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mr-4">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl tracking-tight">Dashboard</h2>
            <p className="text-xs text-zinc-500 font-medium">Market Admin</p>
          </div>
        </div>
        
        <nav className="flex-1 p-6 pt-20 lg:pt-6">
          <ul className="space-y-3">
            <li>
              <button 
                onClick={() => {
                  setActiveTab('markets');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-4 rounded-2xl font-semibold transition-all ${activeTab === 'markets' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-zinc-400 hover:bg-zinc-900 border border-transparent'}`}
              >
                <CalendarDays className="w-5 h-5 mr-3" />
                Manage Markets
              </button>
            </li>
            <li>
              <button 
                onClick={() => {
                  setActiveTab('subscribers');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-4 rounded-2xl font-semibold transition-all ${activeTab === 'subscribers' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-zinc-400 hover:bg-zinc-900 border border-transparent'}`}
              >
                <Users className="w-5 h-5 mr-3" />
                Subscribers
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-6 border-t border-zinc-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-4 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all duration-300 group font-medium"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:ml-72 p-4 pt-24 lg:p-10 lg:pt-14 overflow-y-auto relative min-h-screen">
        {/* Decorative background blur */}
        <div className="fixed top-0 right-0 w-full md:w-1/2 h-1/2 bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none"></div>

        <header className="mb-8 relative z-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {activeTab === 'markets' ? 'Active Markets' : 'Subscriber Database'}
            </h1>
            <p className="text-zinc-400 mt-2 text-sm md:text-lg">
              {activeTab === 'markets' ? 'Configure the schedule for automated email reminders.' : 'View and export all users receiving notifications.'}
            </p>
          </div>
        </header>

        {/* TOP STATISTICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10 relative z-10">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 p-6 rounded-2xl flex items-center shadow-lg">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mr-4 md:mr-5 border border-emerald-500/20 shrink-0">
              <BarChart3 className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-zinc-400 font-semibold text-xs md:text-sm uppercase tracking-wider mb-1">Total Markets</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">{markets.length}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 p-6 rounded-2xl flex items-center shadow-lg">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mr-4 md:mr-5 border border-blue-500/20 shrink-0">
              <Users className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-zinc-400 font-semibold text-xs md:text-sm uppercase tracking-wider mb-1">Total Subscribers</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">{subscribers.length}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 p-6 rounded-2xl flex items-center shadow-lg sm:col-span-2 md:col-span-1">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mr-4 md:mr-5 border border-purple-500/20 shrink-0">
              <Activity className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-zinc-400 font-semibold text-xs md:text-sm uppercase tracking-wider mb-1">System Status</p>
              <h3 className="text-xl md:text-2xl font-extrabold text-white flex items-center">
                Active <span className="relative flex h-3 w-3 ml-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
              </h3>
            </div>
          </div>
        </div>

        {activeTab === 'markets' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10 relative z-10">
            {/* Add/Edit Market Form */}
            <div className="xl:col-span-1">
              <div className="bg-zinc-900/50 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-zinc-800/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <h2 className="text-xl font-bold text-white mb-6 md:mb-8 flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${editingMarketId ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {editingMarketId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  {editingMarketId ? "Edit Market" : "Add New Market"}
                </h2>

                <form onSubmit={handleSaveMarket} className="space-y-5 md:space-y-6">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="block text-xs md:text-sm font-semibold text-zinc-400">Market Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                        className="w-full p-3.5 bg-black/40 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm md:text-base"
                        placeholder="e.g. Zungeru Main Market"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="block text-xs md:text-sm font-semibold text-zinc-400">Day of the Week</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full p-3.5 bg-black/40 border border-zinc-700 text-white rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer text-sm md:text-base"
                    >
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <option key={idx} value={idx} className="bg-zinc-900">{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="block text-xs md:text-sm font-semibold text-zinc-400">Location</label>
                    <div className="relative flex items-center">
                      <MapPin className="w-5 h-5 absolute left-3.5 text-zinc-500" />
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        required
                        className="w-full pl-11 p-3.5 bg-black/40 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm md:text-base"
                        placeholder="e.g. Town Square"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="block text-xs md:text-sm font-semibold text-zinc-400">Description (Optional)</label>
                    <div className="relative flex items-start">
                      <AlignLeft className="w-5 h-5 absolute left-3.5 top-3.5 text-zinc-500" />
                      <textarea
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full pl-11 p-3.5 bg-black/40 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none text-sm md:text-base"
                        rows={3}
                        placeholder="Special notes about this market..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-1 py-3.5 md:py-4 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 flex justify-center items-center shadow-lg text-sm md:text-base ${editingMarketId ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'}`}
                    >
                      {submitting ? "Saving..." : (editingMarketId ? "Update Market" : "Save Market")}
                    </button>
                    {editingMarketId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-3.5 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition-colors text-sm md:text-base"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Markets List */}
            <div className="xl:col-span-2">
              <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-zinc-800/50 shadow-2xl overflow-hidden">
                <div className="p-6 md:p-8 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Registered Markets</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-black/40 text-zinc-400 text-xs md:text-sm uppercase tracking-wider">
                        <th className="p-4 md:p-5 font-semibold">Market Details</th>
                        <th className="p-4 md:p-5 font-semibold">Schedule</th>
                        <th className="p-4 md:p-5 font-semibold">Location</th>
                        <th className="p-4 md:p-5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {markets.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-zinc-500">
                              <CalendarDays className="w-12 h-12 mb-4 opacity-20" />
                              <p className="text-lg font-medium text-zinc-400">No markets found</p>
                              <p className="text-sm">Use the form to add your first market.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        markets.map((market) => (
                          <tr key={market.id} className="hover:bg-zinc-800/30 transition-colors group">
                            <td className="p-4 md:p-5">
                              <p className="font-bold text-white text-base md:text-lg">{market.name}</p>
                              {market.description && (
                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1 max-w-xs">{market.description}</p>
                              )}
                            </td>
                            <td className="p-4 md:p-5">
                              <span className="inline-flex items-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] md:text-xs px-2.5 md:px-3 py-1 md:py-1.5 rounded-full font-bold uppercase tracking-wide whitespace-nowrap">
                                {DAYS_OF_WEEK[market.day_of_week]}
                              </span>
                            </td>
                            <td className="p-4 md:p-5">
                              <div className="flex items-center text-zinc-400 text-xs md:text-sm font-medium">
                                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-zinc-500 shrink-0" />
                                <span className="truncate max-w-[120px] md:max-w-none">{market.location}</span>
                              </div>
                            </td>
                            <td className="p-4 md:p-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditClick(market)}
                                  className="p-2 md:p-2.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all duration-300 opacity-100 lg:opacity-50 lg:group-hover:opacity-100"
                                  title="Edit Market"
                                >
                                  <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMarket(market.id)}
                                  className="p-2 md:p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 opacity-100 lg:opacity-50 lg:group-hover:opacity-100"
                                  title="Delete Market"
                                >
                                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIBERS TAB */}
        {activeTab === 'subscribers' && (
          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-zinc-800/50 shadow-2xl overflow-hidden relative z-10">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex flex-col md:flex-row md:justify-between md:items-center bg-black/20 gap-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="w-5 h-5 mr-3 text-blue-400" />
                Subscriber List
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search emails..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-black/40 border border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
                
                <button
                  onClick={exportToCSV}
                  disabled={subscribers.length === 0}
                  className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.2)] w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-black/40 text-zinc-400 text-xs md:text-sm uppercase tracking-wider">
                    <th className="p-4 md:p-5 font-semibold">Subscriber Email</th>
                    <th className="p-4 md:p-5 font-semibold">Subscribed Market</th>
                    <th className="p-4 md:p-5 font-semibold">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center text-zinc-500">
                          <Users className="w-16 h-16 mb-6 opacity-20" />
                          <p className="text-xl font-medium text-zinc-400 mb-2">No subscribers found</p>
                          <p className="text-sm">
                            {searchQuery ? "Try adjusting your search terms." : "When users subscribe on the public page, they will appear here."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 md:p-5">
                          <div className="flex items-center">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mr-3 font-bold text-xs uppercase shrink-0">
                              {sub.email.charAt(0)}
                            </div>
                            <span className="font-semibold text-white text-sm md:text-base truncate max-w-[200px] md:max-w-none">{sub.email}</span>
                          </div>
                        </td>
                        <td className="p-4 md:p-5">
                          <span className="inline-flex items-center bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] md:text-sm px-2 md:px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                            {sub.markets?.name || 'Unknown Market'}
                          </span>
                        </td>
                        <td className="p-4 md:p-5 text-zinc-400 text-xs md:text-sm font-medium whitespace-nowrap">
                          {new Date(sub.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
