import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { 
  Pledge, 
  Contribution, 
  Expense, 
  Profile, 
  MinistryNews, 
  Testimonial 
} from './types/database.types';
import { Header } from './components/Header';
import { ScriptureBanner } from './components/ScriptureBanner';
import { MinistryNewsTicker } from './components/MinistryNewsTicker';
import { TestimonialSection } from './components/TestimonialSection';
import { PartnerDashboard } from './components/PartnerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { PledgeFormModal } from './components/PledgeFormModal';
import { ContributionFormModal } from './components/ContributionFormModal';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AdminNewsModal } from './components/AdminNewsModal';
import { TestimonialModal } from './components/TestimonialModal';
import { AdminTestimonialsModal } from './components/AdminTestimonialsModal';
import { EmblemLogo } from './components/EmblemLogo';
import { 
  HeartHandshake, 
  Receipt, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Radio, 
  Users, 
  Globe2, 
  ShieldCheck, 
  Loader2, 
  ArrowRight,
  Database,
  Calendar
} from 'lucide-react';

// Starter announcement items
const DEFAULT_NEWS: MinistryNews[] = [
  {
    id: 'news-1',
    title: 'Mradi wa Ujenzi wa Hekalu Kuu la Ibada Unaendelea kwa Kasi',
    content: 'Tunawashukuru washirika wote wanaoendelea kutoa kwa uaminifu. Ujenzi wa nguzo kuu za madhabahu umeanza rasmi. Bwana awabariki.',
    category: 'Ujenzi wa Hekalu',
    is_urgent: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'news-2',
    title: 'Semina Maalum ya Uamsho wa Kiroho na Maombi ya Kufunga',
    content: 'Ibada na semina ya uamsho wa kiroho itafanyika wiki hii Makao Makuu kuanzia saa kumi jioni. Karibuni wote kupokea baraka za Mungu.',
    category: 'Uinjilisti & Misheni',
    is_urgent: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'news-3',
    title: 'Vyombo Vipya vya Muziki na Mfumo wa Sauti Vimepokelewa',
    content: 'Mifumo ya kisasa ya sauti na ala za muziki imewasili kwa ajili ya kuboresha sifa na ibada zetu. Ahadi zote za vyombo vya muziki zinaendelea kukusanywa.',
    category: 'Vyombo vya Ibada',
    is_urgent: false,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Starter testimonials
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    user_id: 'seed-1',
    author_name: 'Mchungaji Daniel Jackson',
    fellowship_center: 'Makao Makuu (Dar es Salaam)',
    title: 'Muujiza wa Uponyaji na Baraka Baada ya Ahadi ya Hekalu',
    content: 'Nilipoweka ahadi ya kuchangia ujenzi wa madhabahu ya Bwana mwaka jana, biashara yangu iliyokuwa imedorora ilifunguka kwa namna ya ajabu. Mungu amethibitisha neno lake kuwa haachi wenye agano naye!',
    category: 'Utoaji na Miujiza ya Kifedha',
    is_approved: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'test-2',
    user_id: 'seed-2',
    author_name: 'Dada Grace Mwakyusa',
    fellowship_center: 'Tawi la Arusha',
    title: 'Amani ya Familia na Uponyaji wa Mtoto Wangu',
    content: 'Baada ya maombi na kujiunga kama Mshirika wa Fedha wa Jerusalem Ministry of Gospel, mtoto wangu aliyekuwa amelazwa hospitalini kwa miezi miwili alipona ghafla bila operesheni. Namshukuru Mungu wa madhabahu haya!',
    category: 'Uponyaji wa Kimuujiza',
    is_approved: true,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'test-3',
    user_id: 'seed-3',
    author_name: 'Ndugu Emmanuel Kimaro',
    fellowship_center: 'Tawi la Dodoma',
    title: 'Kupata Ajira Mpya ya Kipekee Baada ya Kutoa Dhabihu',
    content: 'Nilikuwa sina kazi kwa miaka miwili. Niliamua kutoa dhabihu yangu ya mwisho kwenye uinjilisti wa vijijini. Ndani ya wiki tatu niliitwa kwenye usaili na kupata ajira yenye mshahara mzuri sana. Utukufu kwa Mungu!',
    category: 'Kazi, Biashara & Ajira Mpya',
    is_approved: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function MainAppContent() {
  const { user, profile, isAdmin, loading: authLoading, isConfigured } = useAuth();
  const { isDark } = useTheme();

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [pledgeModalOpen, setPledgeModalOpen] = useState(false);
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [supabaseConfigModalOpen, setSupabaseConfigModalOpen] = useState(false);

  // New Feature Modals
  const [adminNewsModalOpen, setAdminNewsModalOpen] = useState(false);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [adminTestimonialsModalOpen, setAdminTestimonialsModalOpen] = useState(false);

  // Selected entities
  const [activeReceiptContribution, setActiveReceiptContribution] = useState<Contribution | null>(null);
  const [targetPledgeIdForGiving, setTargetPledgeIdForGiving] = useState<string | undefined>(undefined);

  // Data states
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [allPartners, setAllPartners] = useState<Profile[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [newsList, setNewsList] = useState<MinistryNews[]>(DEFAULT_NEWS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch News and Testimonials (Public & Authenticated)
  const fetchNewsAndTestimonials = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      // 1. Fetch News
      const { data: newsData } = await supabase
        .from('ministry_news')
        .select('*')
        .order('created_at', { ascending: false });

      if (newsData && newsData.length > 0) {
        setNewsList(newsData as MinistryNews[]);
      }

      // 2. Fetch Testimonials
      const { data: testData } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (testData && testData.length > 0) {
        setTestimonials(testData as Testimonial[]);
      }
    } catch (err) {
      console.warn('Note on news/testimonials load:', err);
    }
  }, []);

  // Fetch all pertinent data from Supabase
  const fetchData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    setDataLoading(true);

    try {
      await fetchNewsAndTestimonials();

      if (isAdmin) {
        // Fetch all data for admin oversight
        const [
          { data: pledgesData },
          { data: contribsData },
          { data: profilesData },
          { data: expensesData },
        ] = await Promise.all([
          supabase.from('pledges').select('*, profiles(*)').order('created_at', { ascending: false }),
          supabase.from('contributions').select('*, profiles(*), pledges(*)').order('contribution_date', { ascending: false }),
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
        ]);

        if (pledgesData) setPledges(pledgesData as Pledge[]);
        if (contribsData) setContributions(contribsData as Contribution[]);
        if (profilesData) setAllPartners(profilesData as Profile[]);
        if (expensesData) setAllExpenses(expensesData as Expense[]);
      } else {
        // Fetch partner's own private records
        const [
          { data: pledgesData },
          { data: contribsData },
        ] = await Promise.all([
          supabase.from('pledges').select('*, profiles(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('contributions').select('*, profiles(*), pledges(*)').eq('user_id', user.id).order('contribution_date', { ascending: false }),
        ]);

        if (pledgesData) setPledges(pledgesData as Pledge[]);
        if (contribsData) setContributions(contribsData as Contribution[]);
      }
    } catch (err) {
      console.error('Hitilafu wakati wa kusoma data kutoka Supabase:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, isAdmin, fetchNewsAndTestimonials]);

  // Initial load
  useEffect(() => {
    fetchNewsAndTestimonials();
    if (user) {
      fetchData();
    } else {
      setPledges([]);
      setContributions([]);
      setAllPartners([]);
      setAllExpenses([]);
    }
  }, [user, fetchData, fetchNewsAndTestimonials]);

  // Supabase Realtime synchronization
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('church-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pledges' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ministry_news' }, () => fetchNewsAndTestimonials())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => fetchNewsAndTestimonials())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData, fetchNewsAndTestimonials]);

  // Open Receipt
  const handleViewReceipt = (c: Contribution) => {
    setActiveReceiptContribution(c);
    setReceiptModalOpen(true);
  };

  // Open Contribution with optional pledge ID
  const handleOpenContribution = (pledgeId?: string) => {
    setTargetPledgeIdForGiving(pledgeId);
    setContributionModalOpen(true);
  };

  // Current user's testimonials
  const userTestimonials = testimonials.filter((t) => t.user_id === user?.id);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0716] flex flex-col items-center justify-center p-4">
        <EmblemLogo size="lg" />
        <div className="flex items-center gap-2 mt-4 text-amber-200 font-serif font-bold text-base">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span>Inapakia Mfumo wa Ushirika wa Jerusalem Ministry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0716] text-slate-100 transition-colors duration-200">
      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLogin={() => {
          setAuthMode('login');
          setAuthModalOpen(true);
        }}
        onOpenRegister={() => {
          setAuthMode('register');
          setAuthModalOpen(true);
        }}
        onOpenPledgeModal={() => setPledgeModalOpen(true)}
        onOpenContributionModal={() => handleOpenContribution()}
        onOpenSupabaseConfig={() => setSupabaseConfigModalOpen(true)}
      />

      {/* Animated News Ticker: Continuous animated television news crawler */}
      <MinistryNewsTicker
        newsList={newsList}
        isAdmin={isAdmin}
        onOpenManageNews={() => setAdminNewsModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If user is logged in */}
        {user ? (
          <div>
            {currentTab === 'admin' && isAdmin ? (
              <AdminDashboard
                allPartners={allPartners}
                allPledges={pledges}
                allContributions={contributions}
                allExpenses={allExpenses}
                onOpenPledgeModal={() => setPledgeModalOpen(true)}
                onOpenContributionModal={() => handleOpenContribution()}
                onOpenExpenseModal={() => setExpenseModalOpen(true)}
                onViewReceipt={handleViewReceipt}
                onOpenManageNews={() => setAdminNewsModalOpen(true)}
                onOpenManageTestimonials={() => setAdminTestimonialsModalOpen(true)}
                onRefreshData={fetchData}
              />
            ) : (
              <div className="space-y-8">
                <PartnerDashboard
                  pledges={pledges}
                  contributions={contributions}
                  loading={dataLoading}
                  onOpenPledgeModal={() => setPledgeModalOpen(true)}
                  onOpenContributionModal={handleOpenContribution}
                  onViewReceipt={handleViewReceipt}
                  onOpenTestimonialModal={() => setTestimonialModalOpen(true)}
                  currentSubTab={currentTab as any}
                  newsList={newsList}
                />

                {/* Also show inspirational testimonies to authenticated partner */}
                <TestimonialSection
                  testimonials={testimonials}
                  isLoggedIn={true}
                  onOpenSubmitModal={() => setTestimonialModalOpen(true)}
                />
              </div>
            )}
          </div>
        ) : (
          /* Public Landing Page for Ministry Giving & Partnership */
          <div>
            <ScriptureBanner
              onJoinClick={() => {
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
              onLoginClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
            />

            {/* Testimonials on public/login page for everyone to see */}
            <TestimonialSection
              testimonials={testimonials}
              isLoggedIn={false}
              onOpenSubmitModal={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
            />

            {/* Ministry Mission & Giving Pillars */}
            <div className="my-12">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
                  NGAZO ZA USHIRIKA WA HUDUMA
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-amber-100">
                  Miradi ya Utoaji na Maendeleo ya Injili
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/80 mt-2">
                  Unapotoa kwa ajili ya Jerusalem Ministry of Gospel, unashiriki katika kueneza injili 
                  ya wokovu na kujenga makazi ya sifa za Mungu.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#150a22] rounded-3xl p-6 border border-purple-800/40 shadow-md hover:border-amber-400/50 transition">
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/80 text-amber-300 flex items-center justify-center mb-4 border border-purple-700/50">
                    <Building2 className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-amber-200 mb-1">
                    Ujenzi wa Hekalu Kuu
                  </h3>
                  <p className="text-xs text-purple-200/70 leading-relaxed">
                    Kujenga na kukarabati nyumba ya ibada kwa ajili ya mikutano mikubwa ya uamsho na ibada za kila wiki.
                  </p>
                </div>

                <div className="bg-[#150a22] rounded-3xl p-6 border border-purple-800/40 shadow-md hover:border-amber-400/50 transition">
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/80 text-amber-300 flex items-center justify-center mb-4 border border-purple-700/50">
                    <Globe2 className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-amber-200 mb-1">
                    Uinjilisti & Misheni
                  </h3>
                  <p className="text-xs text-purple-200/70 leading-relaxed">
                    Kufikia mikoa na vijiji mbalimbali kwa njia ya mikutano ya hadhara ya injili na upandaji wa makanisa.
                  </p>
                </div>

                <div className="bg-[#150a22] rounded-3xl p-6 border border-purple-800/40 shadow-md hover:border-amber-400/50 transition">
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/80 text-amber-300 flex items-center justify-center mb-4 border border-purple-700/50">
                    <Radio className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-amber-200 mb-1">
                    Vyombo vya Muziki & Sauti
                  </h3>
                  <p className="text-xs text-purple-200/70 leading-relaxed">
                    Uboreshaji wa mifumo ya kisasa ya sauti, vyombo vya muziki, na kurusha ibada mbashara mtandaoni.
                  </p>
                </div>

                <div className="bg-[#150a22] rounded-3xl p-6 border border-purple-800/40 shadow-md hover:border-amber-400/50 transition">
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/80 text-amber-300 flex items-center justify-center mb-4 border border-purple-700/50">
                    <Users className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-amber-200 mb-1">
                    Misaada ya Jamii & Yatima
                  </h3>
                  <p className="text-xs text-purple-200/70 leading-relaxed">
                    Kugusa maisha ya wenye mahitaji, wajane, na watoto yatima kwa upendo halisi wa Kristo.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps to Become a Partner */}
            <div className="bg-[#150a22] rounded-3xl p-8 sm:p-12 border border-purple-800/50 shadow-lg mb-12">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  HATUA NYEPESI 3
                </span>
                <h3 className="text-2xl font-serif font-bold text-amber-100 mt-1">
                  Jinsi ya Kuanza Ushirika Wako Leo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
                  <div className="p-4 rounded-2xl bg-[#1c0f2d] border border-purple-800/40">
                    <span className="w-8 h-8 rounded-full bg-purple-900 text-amber-300 font-bold text-sm flex items-center justify-center mb-3 border border-amber-400/40">
                      1
                    </span>
                    <h4 className="font-bold text-sm text-slate-100 mb-1">Fungua Akaunti</h4>
                    <p className="text-xs text-purple-200/70">
                      Sajili jina lako, kituo cha ibada, na kategoria yako ya ushirika kupitia Supabase Auth salama.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#1c0f2d] border border-purple-800/40">
                    <span className="w-8 h-8 rounded-full bg-amber-500 text-purple-950 font-bold text-sm flex items-center justify-center mb-3">
                      2
                    </span>
                    <h4 className="font-bold text-sm text-slate-100 mb-1">Weka Ahadi Yako</h4>
                    <p className="text-xs text-purple-200/70">
                      Chagua mradi unaokusudia kuunga mkono na weka tarehe ya kutimiza ahadi yako.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#1c0f2d] border border-purple-800/40">
                    <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-3">
                      3
                    </span>
                    <h4 className="font-bold text-sm text-slate-100 mb-1">Toa na Pata Stakabadhi</h4>
                    <p className="text-xs text-purple-200/70">
                      Toa sadaka kwa njia ya simu au benki, rekodi mchango wako, na upakue stakabadhi rasmi yenye muhuri.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 text-amber-300 font-bold text-sm shadow-md hover:from-purple-800 hover:to-purple-700 transition flex items-center gap-2 border border-amber-500/30"
                  >
                    <span>Anza Sasa — Kuwa Mshirika</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#10071c] text-purple-200 py-10 px-4 sm:px-6 lg:px-8 border-t border-purple-900/60 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-center md:text-left">
            <EmblemLogo size="md" />
            <div>
              <span className="font-serif font-black text-white text-base tracking-wide block">
                JERUSALEM MINISTRY OF GOSPEL
              </span>
              <span className="text-xs text-amber-400 font-semibold block">
                Mpango wa Ushirika na Utoaji (Partnership & Giving Program)
              </span>
              <span className="text-[11px] text-purple-300 font-serif italic">
                Ufunuo wa Yohana 21:1-6 • Zaburi 50:5
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-purple-300">
            <button
              onClick={() => setSupabaseConfigModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-amber-300 border border-purple-700 transition"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Hali ya Supabase & SQL</span>
            </button>
            <span className="text-center">
              © {new Date().getFullYear()} Jerusalem Ministry of Gospel. Haki zote zimehifadhiwa.
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onOpenConfig={() => setSupabaseConfigModalOpen(true)}
      />

      <PledgeFormModal
        isOpen={pledgeModalOpen}
        onClose={() => setPledgeModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        partnerList={allPartners}
      />

      <ContributionFormModal
        isOpen={contributionModalOpen}
        onClose={() => setContributionModalOpen(false)}
        onSuccess={(newContribId) => {
          fetchData();
          if (newContribId) {
            setTimeout(() => {
              supabase
                .from('contributions')
                .select('*, profiles(*), pledges(*)')
                .eq('id', newContribId)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setActiveReceiptContribution(data as Contribution);
                    setReceiptModalOpen(true);
                  }
                });
            }, 300);
          }
        }}
        userPledges={pledges}
        partnerList={allPartners}
        initialPledgeId={targetPledgeIdForGiving}
      />

      <ExpenseFormModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setActiveReceiptContribution(null);
        }}
        contribution={activeReceiptContribution}
        partner={profile}
      />

      <SupabaseConfigModal
        isOpen={supabaseConfigModalOpen}
        onClose={() => setSupabaseConfigModalOpen(false)}
      />

      {/* Admin News Modal */}
      <AdminNewsModal
        isOpen={adminNewsModalOpen}
        onClose={() => setAdminNewsModalOpen(false)}
        newsList={newsList}
        onRefresh={fetchNewsAndTestimonials}
      />

      {/* Partner Testimonial Modal */}
      <TestimonialModal
        isOpen={testimonialModalOpen}
        onClose={() => setTestimonialModalOpen(false)}
        userTestimonials={userTestimonials}
        onSuccess={fetchNewsAndTestimonials}
      />

      {/* Admin Testimonials Management Modal */}
      <AdminTestimonialsModal
        isOpen={adminTestimonialsModalOpen}
        onClose={() => setAdminTestimonialsModalOpen(false)}
        testimonials={testimonials}
        onRefresh={fetchNewsAndTestimonials}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
