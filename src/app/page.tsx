"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarDays, MapPin, CheckCircle2, Loader2, Mail, ArrowRight, Clock, ShieldCheck, Smartphone, Zap, XCircle } from "lucide-react";

type Market = {
  id: string;
  name: string;
  day_of_week: number;
  location: string;
  description: string;
};

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error("Error fetching markets:", error);
    } else {
      setMarkets(data || []);
    }
    setLoading(false);
  };

  const showModal = (type: "success" | "error", message: string) => {
    setModalType(type);
    setModalMessage(message);
    setModalOpen(true);
  };

  const handleSubscribe = async (marketId: string) => {
    if (!name || !email) {
      showModal("error", "Please provide your full name and email address in the section above before subscribing to a market.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubscribing(marketId);

    const { error } = await supabase
      .from("subscribers")
      .insert([{ name, email, market_id: marketId }]);

    if (error) {
      if (error.code === '23505') {
        showModal("error", "You are already subscribed to this market with this email address.");
      } else {
        showModal("error", "Failed to securely save your subscription. Please try again.");
      }
    } else {
      showModal("success", "Subscription confirmed! We will notify you 24 hours before market day.");
    }
    
    setSubscribing(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      
      {/* BEAUTIFUL MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`h-2 w-full ${modalType === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <div className="p-8 text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${modalType === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                {modalType === 'success' ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {modalType === 'success' ? 'Success!' : 'Action Required'}
              </h3>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                {modalMessage}
              </p>
              <button 
                onClick={() => setModalOpen(false)}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all shadow-lg ${modalType === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}
              >
                Okay, got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#020617] pt-32 pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-[#020617] to-[#020617] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse delay-1000 opacity-30"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-8 backdrop-blur-md uppercase tracking-wider">
            <Clock className="w-4 h-4 mr-2" /> Never miss a market day again
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 tracking-tight leading-[1.1]">
            Weekly Market <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
              Intelligence
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed mb-16">
            The official digital scheduling and reminder system for Zungeru and surrounding rural markets. Stay informed with automated, timely notifications.
          </p>

          {/* Email Setup Card */}
          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 backdrop-blur-2xl p-8 md:p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transform hover:scale-[1.02] transition-transform duration-500">
            <label className="flex items-center justify-center text-sm font-bold text-white mb-6 uppercase tracking-widest">
              <Mail className="w-5 h-5 mr-3 text-emerald-400" />
              Step 1: Enter Your Details
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name..."
                className="flex-grow p-5 bg-black/40 border border-slate-700 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-500 text-lg shadow-inner"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-grow p-5 bg-black/40 border border-slate-700 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-500 text-lg shadow-inner"
              />
            </div>
            <p className="text-sm text-slate-400 mt-6 font-medium">
              After entering your details, scroll down to subscribe to specific markets.
            </p>
          </div>
        </div>
        
        {/* Curved bottom separator */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-none z-0">
          <svg className="relative block w-full h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.8,200.7,114.9C241.9,112.06,283.47,97.64,321.39,56.44Z" className="fill-slate-50"></path>
          </svg>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Simple Process</h2>
          <h3 className="text-4xl font-extrabold text-slate-900 mb-16">How The System Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform hover:-translate-y-2 transition-transform duration-300">
                <ShieldCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">1. Enter Details</h4>
              <p className="text-slate-600 leading-relaxed">Enter your full name and email address in the secure portal above to associate them with your device.</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform hover:-translate-y-2 transition-transform duration-300">
                <MapPin className="w-10 h-10 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">2. Select Markets</h4>
              <p className="text-slate-600 leading-relaxed">Browse the active markets below and subscribe to the ones you wish to attend.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform hover:-translate-y-2 transition-transform duration-300">
                <Zap className="w-10 h-10 text-amber-500" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">3. Get Notified</h4>
              <p className="text-slate-600 leading-relaxed">Our automated system will dispatch an alert to your inbox exactly 24 hours before market day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE MARKETS SECTION */}
      <section className="py-24 bg-white border-t border-slate-200 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Step 2</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Available Markets</h3>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Click "Subscribe to Alerts" on any market below to register for notifications.</p>
          </div>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-6">
              <div className="relative w-20 h-20">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-500 font-medium animate-pulse text-lg">Synchronizing secure database...</p>
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center p-20 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner max-w-3xl mx-auto">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <CalendarDays className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">No Markets Scheduled</h3>
              <p className="text-slate-500 text-lg">The administration has not yet published the market schedules. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {markets.map((market) => (
                <div 
                  key={market.id} 
                  className="bg-white rounded-3xl border border-slate-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col overflow-hidden"
                >
                  <div className="h-3 w-full bg-gradient-to-r from-emerald-400 to-blue-500"></div>
                  <div className="p-8 md:p-10 flex-grow">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight mb-8">
                      {market.name}
                    </h3>
                    
                    <div className="space-y-5 mb-8">
                      <div className="flex items-center text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                        <CalendarDays className="w-6 h-6 mr-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Schedule</p>
                          <p className="font-bold text-lg text-slate-900">Every {DAYS_OF_WEEK[market.day_of_week]}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-blue-50 transition-colors">
                        <MapPin className="w-6 h-6 mr-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                          <p className="font-bold text-slate-900">{market.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    {market.description && (
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-slate-600 leading-relaxed text-sm italic">
                          "{market.description}"
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => handleSubscribe(market.id)}
                      disabled={subscribing === market.id}
                      className="w-full flex items-center justify-center py-4 px-6 bg-[#020617] hover:bg-emerald-600 text-white rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-70 group/btn shadow-lg hover:shadow-emerald-500/30"
                    >
                      {subscribing === market.id ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          Subscribe to Alerts
                          <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-2 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT PROJECT SECTION */}
      <section className="py-24 bg-[#020617] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-300 mb-8">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">Academic Implementation</h3>
          <p className="text-lg text-slate-400 leading-relaxed">
            This platform was engineered as a final-year academic project titled 
            <span className="text-white font-semibold"> "Design and Implementation of a Weekly Market Day Reminder System for Zungeru and Surrounding Villages"</span>.
          </p>

          {/* Student Details Card */}
          <div className="mt-12 inline-block p-[2px] rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-shadow duration-500">
            <div className="bg-[#020617] rounded-2xl p-8 md:px-16 md:py-10 text-center relative overflow-hidden">
              <p className="text-emerald-400 font-bold text-xs uppercase tracking-[0.3em] mb-4">Designed & Developed By</p>
              <h4 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
                Abdullahi Ibrahim Wushishi
              </h4>
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mr-3">Matric No:</span>
                <span className="text-base text-emerald-300 font-extrabold font-mono tracking-widest">NDCS/024/2793</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-12 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h4 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Market Reminder System</h4>
            <p className="text-slate-500 font-medium">Zungeru & Surrounding Villages</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Final Year Project Implementation. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
