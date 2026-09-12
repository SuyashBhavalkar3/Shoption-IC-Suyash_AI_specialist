import { useEffect, useState, useRef } from 'react';
import { API_BASE_URL, API_KEY, getEvents, getFunnel, getOverview, getProjects, getModularFunnels } from '../services/api';
import type { AnalyticsOverview, EventItem, FunnelResponse, Project, ModularFunnelsResponse } from '../types';
import EventTable from '../components/EventTable';
import FunnelChart from '../components/FunnelChart';
import StatsCards from '../components/StatsCards';
import ModularFunnelWidget from '../components/ModularFunnelWidget';
import AnalyticsTrendChart from '../components/AnalyticsTrendChart';
import EventBreakdownChart from '../components/EventBreakdownChart';
import { formatToIST, formatEventName } from '../utils/format';
import logoImage from '../assets/funnel_logo.png';

const eventTypeStyles: Record<string, string> = {
  purchase: 'border-[#16A34A] text-[#16A34A]',
  add_to_cart: 'border-[#2563EB] text-[#2563EB]',
  product_view: 'border-[#2563EB] text-[#2563EB]',
  checkout_started: 'border-[#2563EB] text-[#2563EB]',
  login: 'border-[#F97316] text-[#F97316]',
};

function getEventStyle(eventName: string) {
  return eventTypeStyles[eventName] ?? 'border-[#CBD5E1] text-[#6B7280]';
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [modularFunnels, setModularFunnels] = useState<ModularFunnelsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'modular'>('overview');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [page, setPage] = useState(1);
  const [eventName, setEventName] = useState('');
  const [pageSize] = useState(10);
  const [days, setDays] = useState(30);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectsDebugPayload, setProjectsDebugPayload] = useState<unknown>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            setCurrentUser(payload || null);
          } catch (e) {
            setCurrentUser(null);
          }
        }
      }
    } catch (err) {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener('click', onDocClick);
    }

    return () => document.removeEventListener('click', onDocClick);
  }, [isProfileOpen]);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError(null);

      try {
        const list = await getProjects();
        console.log('Current API Key:', API_KEY);
        console.log('API Base URL:', API_BASE_URL);
        console.log('Projects Response (raw):', list);
        console.log('Projects Response type:', typeof list, Array.isArray(list));
        console.log('Projects Count (raw):', (list as any)?.length);
        console.log('Projects keys:', (list as any)?.map?.((p: any) => ({ id: p.id, api_key: p.api_key })));
        setProjects(list);
        setProjectsDebugPayload(list);

        if (list.length > 0) {
          setSelectedProject(list[0]);
        } else {
          setError(
            `No projects available for API key ${API_KEY}. Projects returned: ${list.length}. Response payload: ${JSON.stringify(
              list
            )}`
          );
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load projects:', e);
        setError(e instanceof Error ? e.message : 'Failed to load projects.');
        setLoading(false);
      }
    }
    void fetchProjects();
  }, []);

  const activeProjectId = selectedProject?.id;

  useEffect(() => {
    if (!activeProjectId) {
      return;
    }

    const projectId = activeProjectId;
    let cancelled = false;
    let intervalId: number | null = null;

    async function loadData(isAutoRefresh = false) {
      const isInitialLoad = !isAutoRefresh;
      
      if (isInitialLoad) {
        setLoading(true);
      } else {
        console.log('🔄 [AUTO-REFRESH] Refreshing events and analytics...', {
          projectId,
          timestamp: new Date().toISOString(),
          page,
          eventName,
          pageSize,
        });
        setIsAutoRefreshing(true);
      }
      
      setError(null);

      try {
        const startTime = performance.now();
        
       const [overviewData, funnelData, eventsData, modularData] = await Promise.all([
        getOverview(projectId, days),
        getFunnel(projectId, days),
        getEvents({
                   projectId,
                   days,
                   page,
                   pageSize,
                   eventName,
                 }),
                getModularFunnels(projectId),
              ]);
        const endTime = performance.now();
        const fetchDuration = Math.round(endTime - startTime);

        if (!cancelled) {
          setOverview(overviewData);
          setFunnel(funnelData);
          setModularFunnels(modularData);
          const rawEventsData = eventsData as any;

          const eventsArray = rawEventsData?.data ?? rawEventsData?.items ?? rawEventsData?.results ?? rawEventsData?.events ?? [];
          setEvents(eventsArray);

          const totalCount =
            rawEventsData?.total ?? rawEventsData?.total_count ?? rawEventsData?.count ?? eventsArray.length;

          setTotal(totalCount);
          setTotalPages(eventsData?.total_pages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

          const now = new Date();
          setLastRefreshTime(now);

          if (isAutoRefresh) {
            console.log('✅ [AUTO-REFRESH] Events updated successfully', {
              eventsCount: eventsArray.length,
              totalEvents: totalCount,
              fetchDurationMs: fetchDuration,
              timestamp: now.toISOString(),
            });
          } else {
            console.log('✅ [INITIAL LOAD] Dashboard loaded', {
              eventsCount: eventsArray.length,
              totalEvents: totalCount,
              fetchDurationMs: fetchDuration,
              timestamp: now.toISOString(),
            });
          }
        }
      } catch (fetchError) {
        console.error('❌ [REFRESH ERROR] Failed to load analytics data:', {
          projectId,
          isAutoRefresh,
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          timestamp: new Date().toISOString(),
        });
        
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load analytics data');
        }
      } finally {
        if (!cancelled) {
          if (isInitialLoad) {
            setLoading(false);
          } else {
            setIsAutoRefreshing(false);
          }
        }
      }
    }

    // Initial load
    loadData(false);

    // Set up auto-refresh interval (every 15 seconds)
    intervalId = window.setInterval(() => {
      void loadData(true);
    }, 15000);

    console.log('📊 [DASHBOARD] Auto-refresh initialized', {
      projectId,
      intervalMs: 15000,
      timestamp: new Date().toISOString(),
    });

    return () => {
      cancelled = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        console.log('🛑 [DASHBOARD] Auto-refresh cleanup', {
          projectId,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, [activeProjectId, eventName, page, pageSize, days]);


  return (
    <main className="min-h-screen bg-[#F5F1EA] text-[#3E362E]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] px-5 py-5 shadow-soft flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="Funnel Analytics logo" className="h-16 w-16 object-contain" />
            <div>
              <p className="text-sm font-bold text-[#3E362E]">Funnel Analytics</p>
              <p className="text-sm text-[#6F665E]">Performance dashboard for customer funnels</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">

              <div className="inline-flex items-center rounded-[12px] border border-[#DDD3C6] bg-[#FFFDF9] px-4 py-3 shadow-soft">
              <select value={days}onChange={(e) => setDays(Number(e.target.value))}className="bg-transparent text-sm font-semibold text-[#6F665E] outline-none">
                 <option value={1}>Last 1 Day</option>
                 <option value={2}>Last 2 Days</option>
                 <option value={3}>Last 3 Days</option>
                 <option value={7}>Last 7 Days</option>
                 <option value={15}>Last 15 Days</option>
                 <option value={30}>Last 30 Days</option>
             </select>
             </div>
            {lastRefreshTime && (
              <div className="inline-flex items-center gap-2 rounded-3xl border border-[#DDD3C6] bg-[#F8F4ED] px-4 py-3 text-sm text-[#6F665E] font-medium">
                <svg className={`h-4 w-4 ${isAutoRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Updated {lastRefreshTime.toLocaleTimeString()}</span>
              </div>
            )}
            {/* Profile / User menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((s) => !s)}
                className="inline-flex items-center gap-3 rounded-full border border-[#DDD3C6] bg-[#F8F4ED] px-3 py-2 text-sm text-[#3E362E] font-medium focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isProfileOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EADFCF] text-sm font-semibold text-[#3E362E]">
                    {currentUser && (currentUser.name || currentUser.full_name || currentUser.first_name)
                      ? String((currentUser.name || currentUser.full_name || currentUser.first_name)[0]).toUpperCase()
                      : 'U'}
                  </div>
                  <div className="hidden min-w-0 flex-col truncate sm:flex">
                    <span className="text-sm font-semibold text-[#3E362E] truncate">{currentUser?.name || currentUser?.email || 'User'}</span>
                    <span className="text-xs text-[#6F665E] truncate">{currentUser?.email || ''}</span>
                  </div>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[#E7DCC9] bg-[#FFFDF9] p-4 shadow-md" role="menu">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EADFCF] text-lg font-bold text-[#3E362E]">
                      {currentUser && (currentUser.name || currentUser.full_name || currentUser.first_name)
                        ? String((currentUser.name || currentUser.full_name || currentUser.first_name)[0]).toUpperCase()
                        : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#3E362E] truncate">{currentUser?.name || 'Unnamed User'}</div>
                      <div className="mt-1 text-xs text-[#6F665E] truncate">{currentUser?.email || 'No email'}</div>
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-[#F1E7D9] px-2.5 py-0.5 text-xs font-semibold text-[#8A6A3E]">{(currentUser?.role || currentUser?.roles || currentUser?.is_admin) ? (currentUser?.role || (currentUser?.is_admin ? 'Admin' : 'User')) : 'User'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-3 h-px bg-[#EDE1D4]" />

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        try {
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          sessionStorage.removeItem('token');
                          sessionStorage.removeItem('user');
                          sessionStorage.clear();
                        } finally {
                          window.location.assign('/');
                        }
                      }}
                      className="w-full rounded-lg bg-[#B89B72] px-3 py-2 text-sm font-semibold text-white hover:bg-[#A88A61]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="mb-8 rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] px-6 py-7 shadow-soft">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-[#3E362E]">Funnel Analytics</h1>
              <p className="mt-3 text-sm leading-7 text-[#6F665E]">
                Track login-to-purchase behavior, inspect individual events, and surface a concise dashboard for the product funnel.
              </p>
            </div>
          </div>
        </section>
        {error ? (
          <div className="mb-6 flex items-center justify-between rounded-[24px] border border-[#DDD3C6] bg-[#FFFDF9] px-6 py-4 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D97706]"></span>
              </span>
              <div>
                <p className="text-sm font-bold text-[#3E362E]">Analytics Server Reconnecting</p>
                <p className="text-xs text-[#6F665E]">Showing live preview mode while connecting to backend.</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-[#B89B72] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8C6D43] shadow-button"
            >
              Retry Connection
            </button>
          </div>
        ) : null}

        <div className="mb-8 flex gap-4 rounded-full border border-[#DDD3C6] bg-[#F8F4ED] px-3 py-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-[#B89B72] text-white shadow-button'
                : 'text-[#6F665E] hover:text-[#3E362E]'
            }`}
          >
            Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab('modular')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeTab === 'modular'
                ? 'bg-[#B89B72] text-white shadow-button'
                : 'text-[#6F665E] hover:text-[#3E362E]'
            }`}
          >
            Categorized Funnels
          </button>
        </div>

        {loading ? (
          <div className="rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] px-6 py-16 text-center text-[#3E362E] shadow-soft font-medium">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#B89B72] border-t-transparent mb-3" />
            Loading analytics dashboard data...
          </div>
        ) : (
          <>
            {activeTab === 'overview' ? (
              <>
                <StatsCards overview={overview} />

                {/* Main Interactive Charts Row */}
                <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] mb-8">
                  <AnalyticsTrendChart events={events} days={days} />
                  <EventBreakdownChart events={events} />
                </div>

                {/* Funnel & Recent Activity Row */}
                <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] mb-8">
                  <FunnelChart data={funnel} />
                  <div className="rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] p-6 shadow-soft">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#6F665E] font-medium">Live Feed</p>
                        <h2 className="mt-1 text-xl font-bold text-[#3E362E]">Recent Activity</h2>
                      </div>
                      <div className="divide-y divide-[#E2D8CD]">
                        {((overview?.recent_events && overview.recent_events.length > 0)
                          ? overview.recent_events
                          : events.slice(0, 5)
                        ).map((event) => {
                          const style = getEventStyle(event.event_name);
                          return (
                            <div key={event.id} className={`flex items-center gap-3 border-l-4 ${style} py-3.5 pl-4 bg-[#FFFDF9]`}> 
                              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${style}`} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#3E362E]">{formatEventName(event.event_name)}</p>
                                <div className="customer-info mt-0.5">
                                  <div className="customer-name text-xs text-[#6F665E] font-medium truncate">
                                    {event.properties?.customer_name || event.properties?.customer_email || event.user_id || event.anonymous_id || 'Anonymous user'}
                                  </div>
                                </div>
                              </div>
                              <p className="ml-auto text-[11px] font-medium text-[#9B8F7E]">{formatToIST(event.created_at)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {modularFunnels ? (
                  <div className="grid gap-8 md:grid-cols-2 mb-8">
                    <ModularFunnelWidget data={modularFunnels.authentication} />
                    <ModularFunnelWidget data={modularFunnels.discovery} />
                    <ModularFunnelWidget data={modularFunnels.cart} />
                    <ModularFunnelWidget data={modularFunnels.checkout} />
                    <ModularFunnelWidget data={modularFunnels.orders} />
                  </div>
                ) : (
                  <div className="rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] px-6 py-10 text-center text-[#3E362E] shadow-soft font-medium mb-8">
                    No modular funnels data available.
                  </div>
                )}
              </>
            )}

            <EventTable
              events={events}
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              eventName={eventName}
              onEventNameChange={(value) => {
                setPage(1);
                setEventName(value);
              }}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </main>
  );
}

