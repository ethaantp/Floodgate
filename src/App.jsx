import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Droplets,
  Activity,
  Pill,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Download,
  Upload,
  Printer,
  Moon,
  Sun,
  Heart,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Sliders,
  RefreshCw,
  Stethoscope,
  X,
  Server,
  Database,
  CheckCircle2,
  User
} from 'lucide-react';

// Relaxed 30-second polling interval for phone & tablet LAN consistency
const POLL_INTERVAL_MS = 30000;

// ============================================================================
// CLINICAL CONSTANTS & PRESET OPTIONS
// ============================================================================
const BLEEDING_LEVELS = [
  { id: 'none', label: 'None', score: 0, drops: 0, desc: 'No bleeding today', color: 'bg-stone-100 text-stone-600 border-stone-200', activeColor: 'bg-stone-700 text-white border-stone-700', dotColor: 'bg-stone-300' },
  { id: 'spotting', label: 'Spotting', score: 1, drops: 1, desc: 'Drops / pantyliner only', color: 'bg-rose-50 text-rose-700 border-rose-200', activeColor: 'bg-rose-400 text-white border-rose-500', dotColor: 'bg-rose-300' },
  { id: 'light', label: 'Light', score: 2, drops: 2, desc: 'Light flow, regular change', color: 'bg-rose-50 text-rose-800 border-rose-200', activeColor: 'bg-rose-500 text-white border-rose-600', dotColor: 'bg-rose-400' },
  { id: 'medium', label: 'Medium', score: 3, drops: 3, desc: 'Moderate typical flow', color: 'bg-rose-100 text-rose-900 border-rose-300', activeColor: 'bg-rose-600 text-white border-rose-700', dotColor: 'bg-rose-500' },
  { id: 'heavy', label: 'Heavy', score: 4, drops: 4, desc: 'High volume / frequent changes', color: 'bg-rose-100 text-rose-950 border-rose-300', activeColor: 'bg-rose-700 text-white border-rose-800', dotColor: 'bg-rose-700' },
  { id: 'flooding', label: 'Flooding', score: 5, drops: 5, desc: 'Soaking hourly / double protection', color: 'bg-red-100 text-red-950 border-red-300', activeColor: 'bg-red-800 text-white border-red-900', dotColor: 'bg-red-800' }
];

const CLOT_SIZES = [
  { id: 'small', label: 'Small (<1cm)', desc: 'Pea-sized or smaller' },
  { id: 'medium', label: 'Medium (1–2cm)', desc: 'Grape / 5p coin sized' },
  { id: 'large', label: 'Large (>2cm)', desc: '10p/50p coin or larger' },
  { id: 'tissue', label: 'Decidual / Tissue-like', desc: 'Fleshy or cast-like clots' }
];

const PAIN_LOCATIONS = [
  'Pelvic / Uterine',
  'Lower Back',
  'Abdomen',
  'Left Ovary',
  'Right Ovary',
  'Legs / Sciatic',
  'Rectal / Shooting',
  'Shoulder Tip',
  'Painful Urination'
];

const PAIN_TYPES = [
  'Deep Cramping',
  'Sharp / Stabbing',
  'Pulling / Tugging',
  'Throbbing Ache',
  'Burning',
  'Pelvic Heaviness'
];

const BOWEL_SEVERITIES = [
  { id: 'none', label: 'None', score: 0, activeColor: 'bg-stone-700 text-white border-stone-700' },
  { id: 'mild', label: 'Mild', score: 1, activeColor: 'bg-amber-500 text-white border-amber-600' },
  { id: 'moderate', label: 'Moderate', score: 2, activeColor: 'bg-orange-600 text-white border-orange-700' },
  { id: 'severe', label: 'Severe', score: 3, activeColor: 'bg-red-700 text-white border-red-800' }
];

const BOWEL_SYMPTOMS = [
  'Bloating / "Endo Belly"',
  'Constipation',
  'Diarrhea / Loose Stools',
  'Painful Bowel Movement',
  'Nausea',
  'Intestinal Cramping',
  'Urgency',
  'Acid Reflux'
];

const PRESET_MEDICATIONS = [
  { name: 'Ibuprofen', defaultDose: '400mg', category: 'NSAID' },
  { name: 'Paracetamol', defaultDose: '1000mg', category: 'Analgesic' },
  { name: 'Mefenamic Acid', defaultDose: '500mg', category: 'NSAID' },
  { name: 'Naproxen', defaultDose: '500mg', category: 'NSAID' },
  { name: 'Codeine / Co-codamol', defaultDose: '30mg', category: 'Opioid' },
  { name: 'Buscopan', defaultDose: '20mg', category: 'Antispasmodic' },
  { name: 'Tranexamic Acid', defaultDose: '1000mg', category: 'Anti-fibrinolytic' },
  { name: 'Dienogest / Hormones', defaultDose: '2mg', category: 'Hormonal' },
  { name: 'Magnesium / Supplements', defaultDose: 'Daily', category: 'Supplement' }
];

const MED_EFFECTIVENESS = [
  { id: 'helped', label: 'Helped', activeClass: 'bg-emerald-600 text-white border-emerald-700' },
  { id: 'partial', label: 'Partial', activeClass: 'bg-amber-500 text-white border-amber-600' },
  { id: 'none', label: 'No Relief', activeClass: 'bg-stone-600 text-white border-stone-700' }
];

const EXTERNAL_FACTORS = [
  { id: 'heat_pad', label: 'Heat Pad / Hot Water Bottle', type: 'relief' },
  { id: 'tens', label: 'TENS Machine', type: 'relief' },
  { id: 'warm_bath', label: 'Warm Bath', type: 'relief' },
  { id: 'rest_day', label: 'Rest / Bed Day', type: 'relief' },
  { id: 'stretches', label: 'Pelvic Stretches', type: 'relief' },
  { id: 'poor_sleep', label: 'Poor Sleep / Insomnia', type: 'trigger' },
  { id: 'high_stress', label: 'High Stress', type: 'trigger' },
  { id: 'fatigue', label: 'Severe Fatigue', type: 'trigger' },
  { id: 'brain_fog', label: 'Brain Fog', type: 'trigger' },
  { id: 'trigger_food', label: 'Trigger Foods (Dairy/Gluten/Caffeine)', type: 'trigger' },
  { id: 'exercise', label: 'Gentle Walk / Exercise', type: 'activity' },
  { id: 'ovulation', label: 'Suspected Ovulation', type: 'cycle' }
];

// ============================================================================
// DATE & FORMATTING HELPERS
// ============================================================================
const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateFriendly = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  });
};

const addDays = (dateStr, delta) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
};

const createEmptyEntry = (dateStr) => ({
  date: dateStr,
  bleedingSeverity: 'none',
  padCount: 0,
  tamponCount: 0,
  cupCount: 0,
  leakedThrough: false,
  hasClots: false,
  clotCount: 0,
  clotSizes: [],
  painScore: 0,
  painLocations: [],
  painTypes: [],
  bowelSeverity: 'none',
  bowelSymptoms: [],
  bowelMovementsCount: 1,
  medications: [], // Array of { id, name, dose, timeNotes, effective }
  externalFactors: [],
  notes: '',
  updatedAt: new Date().toISOString()
});

const normalizeEntry = (dateStr, raw) => {
  if (!raw) return createEmptyEntry(dateStr);
  return {
    ...createEmptyEntry(dateStr),
    ...raw,
    date: dateStr,
    clotSizes: Array.isArray(raw.clotSizes) ? raw.clotSizes : [],
    painLocations: Array.isArray(raw.painLocations) ? raw.painLocations : [],
    painTypes: Array.isArray(raw.painTypes) ? raw.painTypes : [],
    bowelSymptoms: Array.isArray(raw.bowelSymptoms) ? raw.bowelSymptoms : [],
    medications: Array.isArray(raw.medications) ? raw.medications : [],
    externalFactors: Array.isArray(raw.externalFactors) ? raw.externalFactors : []
  };
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // Local SQLite Sync State
  const [syncState, setSyncState] = useState('connecting'); // 'connecting' | 'synced' | 'saving' | 'error'
  const [syncError, setSyncError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [logsMap, setLogsMap] = useState({}); // { 'YYYY-MM-DD': entryObject }

  // Navigation & Theme State
  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'calendar' | 'insights' | 'data'
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('floodgate-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Active Day Form State
  const [formData, setFormData] = useState(() => createEmptyEntry(getTodayStr()));
  const [isDirty, setIsDirty] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Refs to prevent background polling from clobbering active unsaved edits
  const isDirtyRef = useRef(false);
  const selectedDateRef = useRef(selectedDate);
  const hasInitializedWebhookRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  // Persist dark mode preference & toggle .dark on <html>
  useEffect(() => {
    try {
      localStorage.setItem('floodgate-theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Custom Medication Input State
  const [customMedName, setCustomMedName] = useState('');
  const [customMedDose, setCustomMedDose] = useState('');
  const [customMedTime, setCustomMedTime] = useState('');

  // Calendar View State
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Insights Range State
  const [insightsDays, setInsightsDays] = useState(30); // 30 | 60 | 90 | 365

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm, confirmText, danger }

  // User Profile / Name State
  const [ownerName, setOwnerName] = useState(() => {
    try {
      return localStorage.getItem('floodgate-owner-name') || '';
    } catch {
      return '';
    }
  });
  const [nameDraft, setNameDraft] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const hasCheckedOnboardingRef = useRef(false);

  // Local Home Server Webhook State
  const [homeServerUrl, setHomeServerUrl] = useState('');
  const [webhookStatus, setWebhookStatus] = useState(null);

  // Keep document title & localStorage synced with ownerName
  useEffect(() => {
    try {
      if (ownerName) {
        localStorage.setItem('floodgate-owner-name', ownerName);
      } else {
        localStorage.removeItem('floodgate-owner-name');
      }
    } catch {
      // ignore storage errors
    }
    document.title = ownerName
      ? `Floodgate — ${ownerName}'s Journal`
      : 'Floodgate — Period & Endometriosis Tracker';
  }, [ownerName]);

  // Helper to show non-intrusive toast
  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === msg ? null : prev));
    }, 3200);
  }, []);

  // Save owner name to local SQLite server & localStorage
  const saveOwnerName = async (newNameValue, { closeModal = true } = {}) => {
    const cleaned = (newNameValue ?? nameDraft).trim();
    setOwnerName(cleaned);
    setNameDraft(cleaned);
    try {
      localStorage.setItem('floodgate-onboarding-done', 'true');
    } catch {
      // ignore storage errors
    }
    if (closeModal) {
      setShowNameModal(false);
    }
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerName: cleaned })
      });
      showToast(cleaned ? `Personalised journal for ${cleaned}` : 'Updated profile name');
    } catch {
      showToast('Saved name locally (server offline)', 'info');
    }
  };

  // --------------------------------------------------------------------------
  // 1. LOCAL SQLITE SERVER POLLING & SYNC EFFECT
  // --------------------------------------------------------------------------
  const fetchServerState = useCallback(async ({ silent = true } = {}) => {
    try {
      if (!silent) setSyncState('connecting');
      const res = await fetch('/api/state', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const serverLogs = data.logsByDate || {};

      setLogsMap(serverLogs);
      if (typeof data.settings?.ownerName === 'string') {
        const serverOwner = data.settings.ownerName.trim();
        setOwnerName(serverOwner);
        if (!hasCheckedOnboardingRef.current) {
          hasCheckedOnboardingRef.current = true;
          setNameDraft(serverOwner);
          try {
            const onboardingDone = localStorage.getItem('floodgate-onboarding-done');
            if (!serverOwner && !onboardingDone) {
              setShowNameModal(true);
            }
          } catch {
            // ignore storage errors
          }
        }
      }
      if (typeof data.settings?.homeServerUrl === 'string' && !hasInitializedWebhookRef.current) {
        setHomeServerUrl(data.settings.homeServerUrl);
        hasInitializedWebhookRef.current = true;
      }

      // Only refresh current formData if the user does not have unsaved local edits
      if (!isDirtyRef.current) {
        const currentDate = selectedDateRef.current;
        setFormData(normalizeEntry(currentDate, serverLogs[currentDate]));
      }

      setSyncState('synced');
      setSyncError('');
      setLastSyncedAt(new Date());
      if (!silent) {
        showToast('Synced with local Floodgate database');
      }
    } catch (err) {
      console.error('Error syncing with local SQLite server:', err);
      setSyncState('error');
      setSyncError('Cannot reach Floodgate server on local network. Changes held in memory.');
    }
  }, [showToast]);

  useEffect(() => {
    fetchServerState({ silent: true });

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchServerState({ silent: true });
      }
    }, POLL_INTERVAL_MS);

    const handleFocus = () => fetchServerState({ silent: true });
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServerState({ silent: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchServerState]);

  // --------------------------------------------------------------------------
  // 2. LOAD SELECTED DATE INTO FORM WHEN DATE CHANGES
  // --------------------------------------------------------------------------
  useEffect(() => {
    setFormData(normalizeEntry(selectedDate, logsMap[selectedDate]));
    setIsDirty(false);
    isDirtyRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // --------------------------------------------------------------------------
  // 3. SAVE / DELETE / BATCH HELPERS AGAINST LOCAL SQLITE API
  // --------------------------------------------------------------------------
  const saveDayEntry = async (customEntry = null, targetDate = selectedDate, { silentToast = false } = {}) => {
    const entryToSave = {
      ...(customEntry || formData),
      date: targetDate,
      updatedAt: new Date().toISOString()
    };

    // Optimistic local state update
    setLogsMap((prev) => ({
      ...prev,
      [targetDate]: entryToSave
    }));
    if (targetDate === selectedDateRef.current) {
      setIsDirty(false);
      isDirtyRef.current = false;
    }

    try {
      setSyncState('saving');
      const res = await fetch(`/api/logs/${encodeURIComponent(targetDate)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToSave)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const payload = await res.json();
      if (payload?.record) {
        setLogsMap((prev) => ({
          ...prev,
          [targetDate]: payload.record
        }));
      }
      setSyncState('synced');
      setSyncError('');
      setLastSyncedAt(new Date());
      if (!silentToast) {
        showToast(`Saved ${ownerName ? `${ownerName}'s ` : ''}log for ${formatShortDate(targetDate)}`);
      }
    } catch (err) {
      console.error('Failed to save entry:', err);
      setSyncState('error');
      setSyncError('Failed to write to local SQLite server.');
      showToast('Saved in browser, but server write failed', 'error');
    }
  };

  // Safe date switch: auto-saves unsaved changes on the current date before navigating
  const handleSelectDate = async (nextDate) => {
    if (!nextDate || nextDate === selectedDate) return;
    if (isDirty) {
      await saveDayEntry(formData, selectedDate, { silentToast: true });
      showToast(`Auto-saved changes for ${formatShortDate(selectedDate)}`);
    }
    setSelectedDate(nextDate);
  };

  // Safe tab switch: auto-saves unsaved changes on the current date before switching tabs
  const handleSwitchTab = async (nextTab) => {
    if (nextTab === activeTab) return;
    if (isDirty) {
      await saveDayEntry(formData, selectedDate, { silentToast: true });
      showToast(`Auto-saved changes for ${formatShortDate(selectedDate)}`);
    }
    if (nextTab === 'data') {
      setNameDraft(ownerName);
    }
    setActiveTab(nextTab);
  };

  // Delete an entry from SQLite
  const deleteDayEntry = async (dateToDelete) => {
    setLogsMap((prev) => {
      const copy = { ...prev };
      delete copy[dateToDelete];
      return copy;
    });
    if (dateToDelete === selectedDate) {
      setFormData(createEmptyEntry(selectedDate));
      setIsDirty(false);
      isDirtyRef.current = false;
    }

    try {
      setSyncState('saving');
      const res = await fetch(`/api/logs/${encodeURIComponent(dateToDelete)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setSyncState('synced');
      setLastSyncedAt(new Date());
      showToast(`Deleted log for ${formatShortDate(dateToDelete)}`);
    } catch (err) {
      console.error('Error deleting entry:', err);
      setSyncState('error');
      showToast('Could not delete from server', 'error');
    }
  };

  // Copy yesterday's medications into today's log
  const copyYesterdayMedications = () => {
    const prevDate = addDays(selectedDate, -1);
    const prevLog = logsMap[prevDate];
    if (!prevLog || !Array.isArray(prevLog.medications) || prevLog.medications.length === 0) {
      showToast(`No medications found on ${formatShortDate(prevDate)}`, 'info');
      return;
    }
    const copiedMeds = prevLog.medications.map((m) => ({
      ...m,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    }));
    updateField('medications', [...formData.medications, ...copiedMeds]);
    showToast(`Copied ${copiedMeds.length} medication(s) from yesterday`);
  };

  // Form field updater helper
  const updateField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'clotCount' && value > 0) {
        updated.hasClots = true;
      }
      if (field === 'hasClots' && !value) {
        updated.clotCount = 0;
        updated.clotSizes = [];
      }
      if (field === 'bleedingSeverity' && value === 'none') {
        updated.leakedThrough = false;
      }
      return updated;
    });
    setIsDirty(true);
    isDirtyRef.current = true;
  };

  const toggleArrayItem = (field, item) => {
    const current = Array.isArray(formData[field]) ? formData[field] : [];
    const exists = current.includes(item);
    const next = exists ? current.filter((i) => i !== item) : [...current, item];
    updateField(field, next);
  };

  // Add Medication Handler
  const handleAddPresetMed = (preset) => {
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const newMed = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: preset.name,
      dose: preset.defaultDose,
      timeNotes: nowTime,
      effective: 'helped'
    };
    updateField('medications', [...formData.medications, newMed]);
  };

  const handleAddCustomMed = (e) => {
    e.preventDefault();
    if (!customMedName.trim()) return;
    const nowTime = customMedTime.trim() || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const newMed = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: customMedName.trim(),
      dose: customMedDose.trim() || 'Standard dose',
      timeNotes: nowTime,
      effective: 'helped'
    };
    updateField('medications', [...formData.medications, newMed]);
    setCustomMedName('');
    setCustomMedDose('');
    setCustomMedTime('');
  };

  const updateMedicationItem = (id, key, val) => {
    const updated = formData.medications.map((m) => (m.id === id ? { ...m, [key]: val } : m));
    updateField('medications', updated);
  };

  const removeMedicationItem = (id) => {
    updateField(
      'medications',
      formData.medications.filter((m) => m.id !== id)
    );
  };

  // --------------------------------------------------------------------------
  // 4. DERIVED DATA FOR CALENDAR, INSIGHTS & GP REPORT
  // --------------------------------------------------------------------------
  const sortedLogs = useMemo(() => {
    return Object.values(logsMap)
      .filter((item) => item && item.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logsMap]);

  // Recent 7-day strip around selectedDate
  const weekStripDates = useMemo(() => {
    const dates = [];
    for (let i = -5; i <= 1; i++) {
      dates.push(addDays(selectedDate, i));
    }
    return dates;
  }, [selectedDate]);

  // Filtered logs for Insights timeframe
  const insightsData = useMemo(() => {
    const today = getTodayStr();
    const cutoffDate = addDays(today, -insightsDays);
    const periodLogs = sortedLogs.filter((l) => l.date >= cutoffDate && l.date <= today);

    const totalLoggedDays = periodLogs.length;
    const bleedingDays = periodLogs.filter((l) => l.bleedingSeverity && l.bleedingSeverity !== 'none');
    const heavyDays = periodLogs.filter((l) => l.bleedingSeverity === 'heavy' || l.bleedingSeverity === 'flooding');
    const clotDays = periodLogs.filter((l) => l.hasClots || l.clotCount > 0);
    const largeClotDays = periodLogs.filter((l) => Array.isArray(l.clotSizes) && (l.clotSizes.includes('large') || l.clotSizes.includes('tissue')));
    const totalClotsCount = periodLogs.reduce((acc, l) => acc + (Number(l.clotCount) || 0), 0);

    const painLogs = periodLogs.filter((l) => Number(l.painScore) > 0);
    const avgPainAll = totalLoggedDays > 0
      ? (periodLogs.reduce((acc, l) => acc + (Number(l.painScore) || 0), 0) / totalLoggedDays).toFixed(1)
      : '0.0';
    const highPainDays = periodLogs.filter((l) => Number(l.painScore) >= 6);

    const bowelFlareDays = periodLogs.filter((l) => l.bowelSeverity === 'moderate' || l.bowelSeverity === 'severe');

    // Tally frequencies
    const painLocationCounts = {};
    const bowelSymptomCounts = {};
    const medCounts = {};
    const factorCounts = {};

    periodLogs.forEach((l) => {
      (l.painLocations || []).forEach((loc) => {
        painLocationCounts[loc] = (painLocationCounts[loc] || 0) + 1;
      });
      (l.bowelSymptoms || []).forEach((sym) => {
        bowelSymptomCounts[sym] = (bowelSymptomCounts[sym] || 0) + 1;
      });
      (l.medications || []).forEach((m) => {
        medCounts[m.name] = (medCounts[m.name] || 0) + 1;
      });
      (l.externalFactors || []).forEach((fId) => {
        const found = EXTERNAL_FACTORS.find((ef) => ef.id === fId);
        const label = found ? found.label : fId;
        factorCounts[label] = (factorCounts[label] || 0) + 1;
      });
    });

    const sortCounts = (obj) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    return {
      periodLogs,
      totalLoggedDays,
      bleedingDaysCount: bleedingDays.length,
      heavyDaysCount: heavyDays.length,
      clotDaysCount: clotDays.length,
      largeClotDaysCount: largeClotDays.length,
      totalClotsCount,
      avgPainAll,
      highPainDaysCount: highPainDays.length,
      painDaysCount: painLogs.length,
      bowelFlareDaysCount: bowelFlareDays.length,
      topPainLocations: sortCounts(painLocationCounts),
      topBowelSymptoms: sortCounts(bowelSymptomCounts),
      topMedications: sortCounts(medCounts),
      topFactors: sortCounts(factorCounts)
    };
  }, [sortedLogs, insightsDays]);

  // --------------------------------------------------------------------------
  // 5. EXPORT / IMPORT / DEMO DATA UTILITIES
  // --------------------------------------------------------------------------
  const getSafeOwnerSlug = () => {
    if (!ownerName || !ownerName.trim()) return '';
    return `_${ownerName.trim().replace(/[^a-zA-Z0-9_-]+/g, '_')}`;
  };

  const exportJSON = () => {
    const payload = {
      app: 'Floodgate',
      owner: ownerName || 'User',
      exportedAt: new Date().toISOString(),
      recordCount: Object.keys(logsMap).length,
      logs: logsMap
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Floodgate${getSafeOwnerSlug()}_Backup_${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported JSON backup file');
  };

  const exportCSV = () => {
    const headers = [
      'Date',
      'Bleeding_Severity',
      'Pads',
      'Tampons',
      'Cups_Underwear',
      'Leaked_Through',
      'Clots_Present',
      'Clot_Count',
      'Clot_Sizes',
      'Pain_Score_0_to_10',
      'Pain_Locations',
      'Pain_Types',
      'Bowel_Severity',
      'Bowel_Symptoms',
      'Bowel_Movements',
      'Medications_Taken',
      'External_Factors',
      'Daily_Notes'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = sortedLogs.map((l) => [
      escapeCSV(l.date),
      escapeCSV(l.bleedingSeverity),
      escapeCSV(l.padCount || 0),
      escapeCSV(l.tamponCount || 0),
      escapeCSV(l.cupCount || 0),
      escapeCSV(l.leakedThrough ? 'Yes' : 'No'),
      escapeCSV(l.hasClots ? 'Yes' : 'No'),
      escapeCSV(l.clotCount || 0),
      escapeCSV((l.clotSizes || []).join('; ')),
      escapeCSV(l.painScore || 0),
      escapeCSV((l.painLocations || []).join('; ')),
      escapeCSV((l.painTypes || []).join('; ')),
      escapeCSV(l.bowelSeverity || 'none'),
      escapeCSV((l.bowelSymptoms || []).join('; ')),
      escapeCSV(l.bowelMovementsCount ?? ''),
      escapeCSV((l.medications || []).map((m) => `${m.name} (${m.dose} @ ${m.timeNotes}${m.effective ? ` - ${m.effective}` : ''})`).join('; ')),
      escapeCSV((l.externalFactors || []).join('; ')),
      escapeCSV(l.notes || '')
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Floodgate${getSafeOwnerSlug()}_Report_${getTodayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported CSV spreadsheet for Excel/GP');
  };

  const batchUpsertLogs = async (entriesArray, successToastText) => {
    try {
      setSyncState('saving');
      const res = await fetch('/api/logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: entriesArray })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.logsByDate) {
        setLogsMap(data.logsByDate);
        if (!isDirtyRef.current) {
          setFormData(normalizeEntry(selectedDateRef.current, data.logsByDate[selectedDateRef.current]));
        }
      }
      setSyncState('synced');
      setLastSyncedAt(new Date());
      showToast(successToastText);
    } catch (err) {
      console.error('Batch upsert failed:', err);
      setSyncState('error');
      showToast('Failed to save batch logs to server', 'error');
    }
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedLogs = parsed.logs || parsed;
        if (typeof importedLogs !== 'object' || importedLogs === null) {
          showToast('Invalid JSON backup format', 'error');
          return;
        }
        const entries = Object.entries(importedLogs)
          .map(([key, item]) => {
            if (!item || typeof item !== 'object') return null;
            const dateStr = item.date || item.dateKey || key;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
            return normalizeEntry(dateStr, item);
          })
          .filter(Boolean);

        if (entries.length === 0) {
          showToast('No valid dated entries found in file', 'error');
          return;
        }

        await batchUpsertLogs(entries, `Imported ${entries.length} day logs successfully`);
      } catch (err) {
        console.error('Import error:', err);
        showToast('Could not parse JSON file', 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Sample realistic endometriosis cycle generator for demonstration if desired
  const loadSampleCycleData = async () => {
    const today = getTodayStr();
    const sampleEntries = [
      {
        offset: -14,
        bleedingSeverity: 'none',
        painScore: 4,
        painLocations: ['Left Ovary', 'Pelvic / Uterine'],
        painTypes: ['Sharp / Stabbing'],
        bowelSeverity: 'mild',
        bowelSymptoms: ['Bloating / "Endo Belly"'],
        medications: [{ id: 's1', name: 'Ibuprofen', dose: '400mg', timeNotes: '14:00', effective: 'helped' }],
        externalFactors: ['ovulation', 'heat_pad'],
        notes: 'Sharp left-sided ovulation pain in the afternoon.'
      },
      {
        offset: -5,
        bleedingSeverity: 'spotting',
        padCount: 1,
        painScore: 5,
        painLocations: ['Pelvic / Uterine', 'Lower Back'],
        painTypes: ['Deep Cramping', 'Pelvic Heaviness'],
        bowelSeverity: 'moderate',
        bowelSymptoms: ['Bloating / "Endo Belly"', 'Constipation'],
        medications: [{ id: 's2', name: 'Paracetamol', dose: '1000mg', timeNotes: '19:30', effective: 'partial' }],
        externalFactors: ['fatigue', 'heat_pad', 'poor_sleep'],
        notes: 'Pre-period spotting started. Endo belly very noticeable by evening.'
      },
      {
        offset: -4,
        bleedingSeverity: 'heavy',
        padCount: 5,
        tamponCount: 2,
        leakedThrough: true,
        hasClots: true,
        clotCount: 4,
        clotSizes: ['medium', 'large'],
        painScore: 8,
        painLocations: ['Pelvic / Uterine', 'Lower Back', 'Legs / Sciatic', 'Rectal / Shooting'],
        painTypes: ['Deep Cramping', 'Sharp / Stabbing', 'Throbbing Ache'],
        bowelSeverity: 'severe',
        bowelSymptoms: ['Bloating / "Endo Belly"', 'Painful Bowel Movement', 'Diarrhea / Loose Stools', 'Nausea'],
        medications: [
          { id: 's3', name: 'Mefenamic Acid', dose: '500mg', timeNotes: '08:00, 14:00, 20:00', effective: 'partial' },
          { id: 's4', name: 'Codeine / Co-codamol', dose: '30mg', timeNotes: '10:30, 21:00', effective: 'helped' },
          { id: 's5', name: 'Buscopan', dose: '20mg', timeNotes: '12:00', effective: 'helped' }
        ],
        externalFactors: ['heat_pad', 'tens', 'rest_day', 'fatigue'],
        notes: 'Day 1 full flow. Passed two large clots (>2cm) in the morning. Shooting sciatic pain down left leg.'
      },
      {
        offset: -3,
        bleedingSeverity: 'flooding',
        padCount: 6,
        tamponCount: 3,
        leakedThrough: true,
        hasClots: true,
        clotCount: 6,
        clotSizes: ['small', 'medium', 'large'],
        painScore: 9,
        painLocations: ['Pelvic / Uterine', 'Lower Back', 'Abdomen', 'Rectal / Shooting'],
        painTypes: ['Deep Cramping', 'Pulling / Tugging'],
        bowelSeverity: 'severe',
        bowelSymptoms: ['Bloating / "Endo Belly"', 'Painful Bowel Movement', 'Intestinal Cramping'],
        medications: [
          { id: 's6', name: 'Mefenamic Acid', dose: '500mg', timeNotes: '07:30, 13:30, 19:30', effective: 'partial' },
          { id: 's7', name: 'Tranexamic Acid', dose: '1000mg', timeNotes: '08:00, 16:00', effective: 'helped' },
          { id: 's8', name: 'Codeine / Co-codamol', dose: '30mg', timeNotes: '09:00, 18:00', effective: 'helped' }
        ],
        externalFactors: ['heat_pad', 'tens', 'rest_day', 'poor_sleep'],
        notes: 'Heaviest day. Woke up at 3am needing to change pad. TENS machine helped take the edge off lower back pain.'
      },
      {
        offset: -2,
        bleedingSeverity: 'medium',
        padCount: 4,
        hasClots: true,
        clotCount: 2,
        clotSizes: ['small'],
        painScore: 6,
        painLocations: ['Pelvic / Uterine', 'Lower Back'],
        painTypes: ['Deep Cramping', 'Throbbing Ache'],
        bowelSeverity: 'moderate',
        bowelSymptoms: ['Bloating / "Endo Belly"', 'Constipation'],
        medications: [
          { id: 's9', name: 'Ibuprofen', dose: '400mg', timeNotes: '09:00, 17:00', effective: 'helped' },
          { id: 's10', name: 'Buscopan', dose: '20mg', timeNotes: '11:00', effective: 'helped' }
        ],
        externalFactors: ['heat_pad', 'warm_bath', 'fatigue'],
        notes: 'Flow slowing down after Tranexamic acid. Still exhausted and bloated.'
      },
      {
        offset: -1,
        bleedingSeverity: 'light',
        padCount: 2,
        hasClots: false,
        clotCount: 0,
        clotSizes: [],
        painScore: 3,
        painLocations: ['Pelvic / Uterine'],
        painTypes: ['Pelvic Heaviness'],
        bowelSeverity: 'mild',
        bowelSymptoms: ['Bloating / "Endo Belly"'],
        medications: [
          { id: 's11', name: 'Magnesium / Supplements', dose: 'Daily', timeNotes: '21:00', effective: 'helped' }
        ],
        externalFactors: ['stretches', 'exercise'],
        notes: 'Much more manageable today. Managed a short 15-minute walk.'
      }
    ];

    const entries = sampleEntries.map((item) => {
      const dateStr = addDays(today, item.offset);
      const copy = { ...item };
      delete copy.offset;
      return normalizeEntry(dateStr, {
        ...copy,
        date: dateStr,
        updatedAt: new Date().toISOString()
      });
    });

    await batchUpsertLogs(entries, 'Loaded sample cycle history');
  };

  // Push JSON backup to optional local network home server
  const pushToHomeServer = async () => {
    setWebhookStatus('sending');
    try {
      // Save webhook URL preference to local SQLite settings
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeServerUrl })
      }).catch(() => {});

      const response = await fetch(homeServerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: 'Floodgate',
          owner: ownerName || 'User',
          pushedAt: new Date().toISOString(),
          logs: logsMap
        })
      });
      if (response.ok) {
        setWebhookStatus('success');
        showToast('Backed up directly to local home server!');
      } else {
        setWebhookStatus('error');
        showToast(`Server responded with ${response.status}`, 'error');
      }
    } catch {
      setWebhookStatus('error');
      showToast('Could not reach local server URL (check CORS / IP)', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // CALENDAR HELPER CALCULATIONS
  // --------------------------------------------------------------------------
  const calendarGrid = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-first week index (0 = Mon ... 6 = Sun)
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      cells.push({
        dayNumber: d,
        dateStr,
        log: logsMap[dateStr] || null
      });
    }
    return cells;
  }, [calendarMonth, logsMap]);

  // Pain badge color helper
  const getPainBadgeStyle = (score) => {
    const s = Number(score) || 0;
    if (s === 0) return 'bg-stone-100 text-stone-600';
    if (s <= 3) return 'bg-emerald-100 text-emerald-800';
    if (s <= 6) return 'bg-amber-100 text-amber-900';
    if (s <= 8) return 'bg-orange-100 text-orange-900';
    return 'bg-red-100 text-red-900 font-bold';
  };

  // ============================================================================
  // RENDER UI
  // ============================================================================
  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-stone-950 text-stone-100' : 'bg-[#FAF7F5] text-stone-800'} pb-24 md:pb-10`}>
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 no-print animate-fade-in">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium ${
            toastMessage.type === 'error'
              ? 'bg-red-900 text-white border-red-700'
              : 'bg-stone-900 text-stone-50 border-stone-700'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print">
          <div className={`max-w-md w-full rounded-3xl p-6 shadow-xl border ${
            darkMode ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-800'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold">{confirmModal.title}</h3>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="p-1.5 rounded-lg hover:bg-stone-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${
                  darkMode ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-300 hover:bg-stone-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white ${
                  confirmModal.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE / NAME MODAL */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveOwnerName(nameDraft, { closeModal: true });
            }}
            className={`max-w-md w-full rounded-3xl p-6 shadow-xl border ${
              darkMode ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {ownerName ? 'Personalise Your Journal' : 'Welcome to Floodgate'}
                  </h3>
                  <p className="text-xs opacity-70">Self-hosted Period &amp; Endometriosis Tracker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('floodgate-onboarding-done', 'true');
                  } catch {
                    // ignore storage errors
                  }
                  setShowNameModal(false);
                }}
                className="p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-sm mb-4 leading-relaxed ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
              Enter your name to personalise your daily symptom journal, exported backups, and printable GP / specialist summaries across your devices.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                Your Name
              </label>
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="e.g. Alex, Sarah..."
                autoFocus
                maxLength={40}
                className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-rose-500 ${
                  darkMode
                    ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500'
                    : 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('floodgate-onboarding-done', 'true');
                  } catch {
                    // ignore storage errors
                  }
                  setShowNameModal(false);
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${
                  darkMode ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-300 hover:bg-stone-100'
                }`}
              >
                {ownerName ? 'Cancel' : 'Skip for Now'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700"
              >
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          TOP HEADER BAR
      ==================================================================== */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md no-print ${
        darkMode ? 'bg-stone-900/90 border-stone-800' : 'bg-white/85 border-rose-100'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand & Personal Greeting */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-xs">
              <Heart className="w-5 h-5 fill-rose-200/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">Floodgate</h1>
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(ownerName);
                    setShowNameModal(true);
                  }}
                  title="Click to set or change your name"
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50 hover:bg-rose-900/70'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{ownerName ? `${ownerName}'s Journal` : 'Set Your Name'}</span>
                </button>
              </div>
              <p className={`text-xs hidden sm:block ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                Period, Clots, Pain &amp; Endometriosis Symptom Tracker
              </p>
            </div>
          </div>

          {/* Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-200/50 dark:bg-stone-800 p-1 rounded-2xl">
            {[
              { id: 'log', label: 'Daily Log', icon: Droplets },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'insights', label: 'Insights & GP Report', icon: Stethoscope },
              { id: 'data', label: 'Sync & Backup', icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSwitchTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-rose-600 text-white shadow-xs'
                      : darkMode
                        ? 'text-stone-300 hover:bg-stone-800'
                        : 'text-stone-600 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sync Status & Comfort Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSwitchTab('data')}
              title="Phone & Tablet Local Network Sync Status"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border ${
                syncState === 'synced'
                  ? darkMode
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : syncState === 'saving'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : syncState === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300'
                      : 'bg-stone-100 border-stone-200 text-stone-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                syncState === 'synced'
                  ? 'bg-emerald-500'
                  : syncState === 'saving'
                    ? 'bg-amber-500 animate-pulse'
                    : syncState === 'error'
                      ? 'bg-red-500'
                      : 'bg-stone-400'
              }`} />
              <span className="hidden sm:inline">
                {syncState === 'synced'
                  ? 'Synced'
                  : syncState === 'saving'
                    ? 'Saving...'
                    : syncState === 'error'
                      ? 'Offline'
                      : 'Connecting...'}
              </span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to Warm Daylight Mode' : 'Switch to Low-Glare Flare Comfort Mode'}
              className={`p-2.5 rounded-xl border transition-colors ${
                darkMode
                  ? 'bg-stone-800 border-stone-700 text-amber-300 hover:bg-stone-700'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          MAIN CONTENT CONTAINER
      ==================================================================== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">

        {/* ==================================================================
            TAB 1: DAILY SYMPTOM & PERIOD LOG
        ================================================================== */}
        {activeTab === 'log' && (
          <div className="space-y-6">
            {/* DATE NAVIGATOR & 7-DAY STRIP */}
            <div className={`rounded-3xl p-4 sm:p-5 border shadow-xs ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/60 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectDate(addDays(selectedDate, -1))}
                    className={`p-2.5 rounded-xl border ${
                      darkMode ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-200 hover:bg-stone-50'
                    }`}
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="px-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold">
                        {formatDateFriendly(selectedDate)}
                      </h2>
                      {selectedDate === getTodayStr() && (
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Today
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                      {logsMap[selectedDate] ? 'Logged entry saved for this date' : 'No entry saved yet for this date'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectDate(addDays(selectedDate, 1))}
                    className={`p-2.5 rounded-xl border ${
                      darkMode ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-200 hover:bg-stone-50'
                    }`}
                    aria-label="Next day"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Date Picker & Quick Today Button */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {selectedDate !== getTodayStr() && (
                    <button
                      onClick={() => handleSelectDate(getTodayStr())}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                    >
                      Jump to Today
                    </button>
                  )}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && handleSelectDate(e.target.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border ${
                      darkMode ? 'bg-stone-800 border-stone-700 text-stone-100' : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  />
                  {logsMap[selectedDate] && (
                    <button
                      onClick={() =>
                        setConfirmModal({
                          title: 'Clear This Day’s Log?',
                          message: `Are you sure you want to delete the logged symptoms for ${formatDateFriendly(selectedDate)}?`,
                          confirmText: 'Delete Log',
                          danger: true,
                          onConfirm: () => deleteDayEntry(selectedDate)
                        })
                      }
                      title="Clear this day's entry"
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 7-Day Quick Selector Strip */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-4">
                {weekStripDates.map((dStr) => {
                  const [y, m, d] = dStr.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
                  const isSelected = dStr === selectedDate;
                  const dayLog = logsMap[dStr];
                  const bleedInfo = BLEEDING_LEVELS.find((b) => b.id === (dayLog?.bleedingSeverity || 'none'));

                  return (
                    <button
                      key={dStr}
                      onClick={() => handleSelectDate(dStr)}
                      className={`flex flex-col items-center py-2 px-1 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : darkMode
                            ? 'bg-stone-800/60 border-stone-800 hover:bg-stone-800 text-stone-300'
                            : 'bg-stone-50/80 border-stone-200/70 hover:bg-rose-50/50 text-stone-700'
                      }`}
                    >
                      <span className={`text-[11px] font-medium ${isSelected ? 'text-rose-100' : 'opacity-70'}`}>
                        {dayName}
                      </span>
                      <span className="text-sm sm:text-base font-bold my-0.5">{d}</span>
                      {/* Mini Status Dots */}
                      <div className="flex items-center gap-1 h-2 mt-0.5">
                        {dayLog?.bleedingSeverity && dayLog.bleedingSeverity !== 'none' && (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : bleedInfo?.dotColor || 'bg-rose-500'}`} />
                        )}
                        {dayLog?.hasClots && (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-200' : 'bg-purple-600'}`} />
                        )}
                        {Number(dayLog?.painScore) >= 6 && (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-200' : 'bg-amber-500'}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN TWO-COLUMN LOGGING GRID FOR TABLET & DESKTOP */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 1. BLEEDING & CLOTS CARD */}
              <section className={`rounded-3xl p-5 sm:p-6 border shadow-xs space-y-6 ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Period &amp; Bleeding</h3>
                      <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        Flow severity, sanitary products &amp; blood clots
                      </p>
                    </div>
                  </div>
                </div>

                {/* Flow Severity Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-75">
                    Bleeding Severity
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {BLEEDING_LEVELS.map((level) => {
                      const active = formData.bleedingSeverity === level.id;
                      return (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() => updateField('bleedingSeverity', level.id)}
                          className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                            active
                              ? level.activeColor + ' shadow-xs scale-[1.01]'
                              : darkMode
                                ? 'bg-stone-800/70 border-stone-700 text-stone-200 hover:bg-stone-800'
                                : level.color + ' hover:brightness-95'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-bold text-sm">{level.label}</span>
                            <div className="flex gap-0.5">
                              {Array.from({ length: Math.max(1, level.drops) }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`w-1.5 h-2.5 rounded-full ${
                                    level.drops === 0
                                      ? 'bg-stone-400/40'
                                      : active
                                        ? 'bg-white'
                                        : 'bg-rose-500'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className={`text-[11px] leading-tight ${active ? 'text-rose-100' : 'opacity-75'}`}>
                            {level.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sanitary Count & Flooding / Leak Toggle */}
                {formData.bleedingSeverity !== 'none' && (
                  <div className={`p-4 rounded-2xl border space-y-4 ${
                    darkMode ? 'bg-stone-800/40 border-stone-800' : 'bg-rose-50/40 border-rose-100'
                  }`}>
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-75">
                      Protection Used Today (Optional)
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { field: 'padCount', label: 'Pads' },
                        { field: 'tamponCount', label: 'Tampons' },
                        { field: 'cupCount', label: 'Cups / Pants' }
                      ].map((item) => (
                        <div
                          key={item.field}
                          className={`p-2.5 rounded-xl border text-center ${
                            darkMode ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
                          }`}
                        >
                          <div className="text-xs font-medium mb-1.5">{item.label}</div>
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => updateField(item.field, Math.max(0, (formData[item.field] || 0) - 1))}
                              className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-sm">{formData[item.field] || 0}</span>
                            <button
                              type="button"
                              onClick={() => updateField(item.field, (formData[item.field] || 0) + 1)}
                              className="p-1.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 hover:bg-rose-200"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Leaked through clothes/bedding */}
                    <button
                      type="button"
                      onClick={() => updateField('leakedThrough', !formData.leakedThrough)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        formData.leakedThrough
                          ? 'bg-red-700 text-white border-red-800'
                          : darkMode
                            ? 'bg-stone-900 border-stone-700 text-stone-300'
                            : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      <span>Leaked through clothes or bedding today</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        formData.leakedThrough ? 'bg-white text-red-700' : 'border border-stone-300'
                      }`}>
                        {formData.leakedThrough && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  </div>
                )}

                {/* CLOTS TRACKER SECTION */}
                <div className={`p-4 rounded-2xl border space-y-4 ${
                  formData.hasClots
                    ? darkMode
                      ? 'bg-purple-950/30 border-purple-800/70'
                      : 'bg-purple-50/60 border-purple-200'
                    : darkMode
                      ? 'bg-stone-800/40 border-stone-800'
                      : 'bg-stone-50/70 border-stone-200/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <span>Blood Clots Tracker</span>
                        {formData.hasClots && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-semibold">
                            {formData.clotCount || 1} logged
                          </span>
                        )}
                      </h4>
                      <p className="text-xs opacity-75">Did you pass any blood clots today?</p>
                    </div>

                    <div className="flex rounded-xl p-1 bg-stone-200/70 dark:bg-stone-900">
                      <button
                        type="button"
                        onClick={() => updateField('hasClots', false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          !formData.hasClots
                            ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-white shadow-2xs'
                            : 'text-stone-500'
                        }`}
                      >
                        No Clots
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateField('hasClots', true);
                          if (!formData.clotCount) updateField('clotCount', 1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          formData.hasClots
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-stone-500'
                        }`}
                      >
                        Yes, Clots
                      </button>
                    </div>
                  </div>

                  {formData.hasClots && (
                    <div className="space-y-4 pt-2 border-t border-purple-200/60 dark:border-purple-900/50">
                      {/* How Many Clots Stepper */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Approximate number of clots:</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateField('clotCount', Math.max(1, (formData.clotCount || 1) - 1))}
                            className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-purple-200 dark:border-stone-700 hover:bg-purple-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-base font-bold w-8 text-center">
                            {formData.clotCount || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateField('clotCount', (formData.clotCount || 0) + 1)}
                            className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Clot Size Selector */}
                      <div>
                        <span className="block text-xs font-semibold mb-2">Clot Size(s) Observed:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {CLOT_SIZES.map((sz) => {
                            const selected = (formData.clotSizes || []).includes(sz.id);
                            return (
                              <button
                                key={sz.id}
                                type="button"
                                onClick={() => toggleArrayItem('clotSizes', sz.id)}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  selected
                                    ? 'bg-purple-700 text-white border-purple-700'
                                    : darkMode
                                      ? 'bg-stone-900 border-stone-700 text-stone-200'
                                      : 'bg-white border-purple-200 text-stone-800 hover:bg-purple-50'
                                }`}
                              >
                                <div className="text-xs font-bold">{sz.label}</div>
                                <div className={`text-[10px] ${selected ? 'text-purple-200' : 'opacity-70'}`}>
                                  {sz.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 2. PAIN & PELVIC SYMPTOMS CARD */}
              <section className={`rounded-3xl p-5 sm:p-6 border shadow-xs space-y-6 ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Endo Pain &amp; Cramping</h3>
                      <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        Severity scale (0–10), body locations &amp; pain sensations
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-2xl text-sm font-bold ${getPainBadgeStyle(formData.painScore)}`}>
                    {formData.painScore} / 10
                  </div>
                </div>

                {/* 0-10 Pain Scale Interactive Buttons + Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium opacity-75">
                    <span>0 • No Pain</span>
                    <span>5 • Moderate</span>
                    <span>10 • Bedbound</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={formData.painScore}
                    onChange={(e) => updateField('painScore', Number(e.target.value))}
                    className="w-full accent-rose-600 h-2.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
                  />
                  <div className="grid grid-cols-11 gap-1">
                    {Array.from({ length: 11 }).map((_, num) => {
                      const active = Number(formData.painScore) === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => updateField('painScore', num)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            active
                              ? 'bg-rose-600 text-white border-rose-600 scale-105 shadow-xs'
                              : darkMode
                                ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-rose-50'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pain Location Tags */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-75">
                    Where is the pain located?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAIN_LOCATIONS.map((loc) => {
                      const active = (formData.painLocations || []).includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleArrayItem('painLocations', loc)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                              : darkMode
                                ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50'
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pain Character / Sensation Tags */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-75">
                    Type of Pain
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAIN_TYPES.map((pt) => {
                      const active = (formData.painTypes || []).includes(pt);
                      return (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => toggleArrayItem('painTypes', pt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            active
                              ? 'bg-stone-800 text-white border-stone-900 dark:bg-rose-500 dark:border-rose-400'
                              : darkMode
                                ? 'bg-stone-800/50 border-stone-700 text-stone-300'
                                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {pt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* 3. BOWEL & GI ISSUES CARD */}
              <section className={`rounded-3xl p-5 sm:p-6 border shadow-xs space-y-6 ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Bowel &amp; GI Symptoms</h3>
                      <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        &ldquo;Endo belly&rdquo; bloating, bowel pain &amp; digestive changes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bowel Severity Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-75">
                    Overall Bowel / GI Distress
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {BOWEL_SEVERITIES.map((sev) => {
                      const active = formData.bowelSeverity === sev.id;
                      return (
                        <button
                          key={sev.id}
                          type="button"
                          onClick={() => updateField('bowelSeverity', sev.id)}
                          className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition-all ${
                            active
                              ? sev.activeColor + ' shadow-xs'
                              : darkMode
                                ? 'bg-stone-800 border-stone-700 text-stone-300'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {sev.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Bowel Symptoms Tags */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-75">
                    Specific Bowel &amp; GI Symptoms
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BOWEL_SYMPTOMS.map((sym) => {
                      const active = (formData.bowelSymptoms || []).includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => {
                            toggleArrayItem('bowelSymptoms', sym);
                            if (formData.bowelSeverity === 'none' && !active) {
                              updateField('bowelSeverity', 'mild');
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-orange-600 text-white border-orange-700 shadow-2xs'
                              : darkMode
                                ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-orange-50'
                          }`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bowel Movements Stepper */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                  darkMode ? 'bg-stone-800/50 border-stone-800' : 'bg-stone-50 border-stone-200/80'
                }`}>
                  <div>
                    <div className="text-xs font-bold">Bowel Movements Today</div>
                    <div className="text-[11px] opacity-70">Helpful for tracking constipation vs frequency</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('bowelMovementsCount', Math.max(0, (formData.bowelMovementsCount || 0) - 1))}
                      className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm w-6 text-center">{formData.bowelMovementsCount ?? 0}</span>
                    <button
                      type="button"
                      onClick={() => updateField('bowelMovementsCount', (formData.bowelMovementsCount || 0) + 1)}
                      className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* 4. MEDICATIONS & EXTERNAL FACTORS CARD */}
              <section className={`rounded-3xl p-5 sm:p-6 border shadow-xs space-y-6 ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Medication &amp; Relief</h3>
                      <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        Painkillers, hormones, heat therapy &amp; daily triggers
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyYesterdayMedications}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    Copy Yesterday&apos;s Meds
                  </button>
                </div>

                {/* Quick-Tap Medication Presets */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                    Tap to Log Medication
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_MEDICATIONS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleAddPresetMed(preset)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          darkMode
                            ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-emerald-950 hover:border-emerald-700'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{preset.name}</span>
                        <span className="opacity-60 text-[10px]">({preset.defaultDose})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Medication Adder */}
                <form onSubmit={handleAddCustomMed} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Custom medication..."
                    value={customMedName}
                    onChange={(e) => setCustomMedName(e.target.value)}
                    className={`sm:col-span-4 px-3 py-2 rounded-xl text-xs border ${
                      darkMode ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Dose (e.g. 500mg)"
                    value={customMedDose}
                    onChange={(e) => setCustomMedDose(e.target.value)}
                    className={`sm:col-span-3 px-3 py-2 rounded-xl text-xs border ${
                      darkMode ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Time (optional)"
                    value={customMedTime}
                    onChange={(e) => setCustomMedTime(e.target.value)}
                    className={`sm:col-span-2 px-3 py-2 rounded-xl text-xs border ${
                      darkMode ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                  <button
                    type="submit"
                    className="sm:col-span-3 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    + Add Med
                  </button>
                </form>

                {/* List of Logged Medications Today */}
                {formData.medications.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold opacity-75">Taken on {formatShortDate(selectedDate)}:</div>
                    {formData.medications.map((med) => (
                      <div
                        key={med.id}
                        className={`flex flex-col gap-2 p-3 rounded-2xl border ${
                          darkMode ? 'bg-stone-800/70 border-stone-700' : 'bg-emerald-50/40 border-emerald-200/80'
                        }`}
                      >
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-[130px]">
                            <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-xs">{med.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={med.dose}
                              onChange={(e) => updateMedicationItem(med.id, 'dose', e.target.value)}
                              placeholder="Dose"
                              className={`w-24 px-2 py-1 rounded-lg text-xs border ${
                                darkMode ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
                              }`}
                            />
                            <input
                              type="text"
                              value={med.timeNotes}
                              onChange={(e) => updateMedicationItem(med.id, 'timeNotes', e.target.value)}
                              placeholder="Time(s)"
                              className={`flex-1 min-w-[80px] px-2 py-1 rounded-lg text-xs border ${
                                darkMode ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => removeMedicationItem(med.id)}
                              className="p-1.5 text-stone-400 hover:text-red-600"
                              title="Remove medication"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Medication Effectiveness Selector */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/40 dark:border-stone-700/60">
                          <span className="text-[11px] opacity-70">Relief effectiveness:</span>
                          <div className="flex items-center gap-1">
                            {MED_EFFECTIVENESS.map((eff) => {
                              const active = (med.effective || 'helped') === eff.id;
                              return (
                                <button
                                  key={eff.id}
                                  type="button"
                                  onClick={() => updateMedicationItem(med.id, 'effective', eff.id)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                                    active
                                      ? eff.activeClass
                                      : darkMode
                                        ? 'bg-stone-900 border-stone-700 text-stone-400'
                                        : 'bg-white border-stone-200 text-stone-600'
                                  }`}
                                >
                                  {eff.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* External Factors & Non-Drug Relief */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-75">
                    Relief Methods &amp; External Factors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EXTERNAL_FACTORS.map((ef) => {
                      const active = (formData.externalFactors || []).includes(ef.id);
                      return (
                        <button
                          key={ef.id}
                          type="button"
                          onClick={() => toggleArrayItem('externalFactors', ef.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                              : darkMode
                                ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-emerald-50'
                          }`}
                        >
                          {ef.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            {/* DAILY NOTES & SAVE BAR */}
            <section className={`rounded-3xl p-5 sm:p-6 border shadow-xs ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold">{ownerName ? `${ownerName}'s Daily Notes` : 'Daily Notes'}</h3>
              </div>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Write any extra details about today (e.g. specific foods eaten, how sleep went, questions for the GP or gynecologist)..."
                className={`w-full p-3.5 rounded-2xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-rose-500 ${
                  darkMode
                    ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500'
                    : 'bg-stone-50/70 border-stone-200 text-stone-800 placeholder-stone-400'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-stone-200/60 dark:border-stone-800">
                <div className="text-xs opacity-75 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>
                    {isDirty
                      ? 'You have unsaved changes for this day (will also auto-save if you switch dates).'
                      : 'All changes saved to your local Floodgate database across phone & tablet.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => saveDayEntry()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Log for {formatShortDate(selectedDate)}</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ==================================================================
            TAB 2: INTERACTIVE CALENDAR & HISTORY VIEW
        ================================================================== */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Calendar Grid (8 cols on lg) */}
            <div className={`lg:col-span-8 rounded-3xl p-5 sm:p-6 border shadow-xs ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              {/* Month Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">
                    {new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h2>
                  <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    Tap any date to inspect or edit {ownerName ? `${ownerName}'s` : 'your'} daily log
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCalendarMonth((prev) => {
                        const d = new Date(prev.year, prev.month - 1, 1);
                        return { year: d.getFullYear(), month: d.getMonth() };
                      })
                    }
                    className={`p-2 rounded-xl border ${
                      darkMode ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
                      handleSelectDate(getTodayStr());
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                  >
                    Current Month
                  </button>
                  <button
                    onClick={() =>
                      setCalendarMonth((prev) => {
                        const d = new Date(prev.year, prev.month + 1, 1);
                        return { year: d.getFullYear(), month: d.getMonth() };
                      })
                    }
                    className={`p-2 rounded-xl border ${
                      darkMode ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs mb-4 pb-3 border-b border-stone-200/60 dark:border-stone-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Period / Bleeding
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> Blood Clots
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> High Pain (≥6)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-600 inline-block" /> Bowel Flare
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Meds Taken
                </span>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold opacity-60 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarGrid.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="h-16 sm:h-22 rounded-2xl bg-transparent" />;
                  }
                  const { dayNumber, dateStr, log } = cell;
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === getTodayStr();
                  const hasBleeding = log?.bleedingSeverity && log.bleedingSeverity !== 'none';
                  const bleedObj = BLEEDING_LEVELS.find((b) => b.id === log?.bleedingSeverity);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleSelectDate(dateStr)}
                      className={`h-16 sm:h-22 p-1.5 sm:p-2 rounded-2xl border flex flex-col justify-between text-left transition-all relative ${
                        isSelected
                          ? 'ring-2 ring-rose-600 border-rose-600 bg-rose-50/40 dark:bg-rose-950/30'
                          : darkMode
                            ? 'bg-stone-800/50 border-stone-800 hover:bg-stone-800'
                            : 'bg-stone-50/60 border-stone-200/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs sm:text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday ? 'bg-rose-600 text-white' : ''
                        }`}>
                          {dayNumber}
                        </span>
                        {log?.painScore > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${getPainBadgeStyle(log.painScore)}`}>
                            {log.painScore}
                          </span>
                        )}
                      </div>

                      {/* Visual Badges inside Calendar Cell */}
                      <div className="space-y-1 w-full">
                        {hasBleeding && (
                          <div className={`w-full text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate text-white ${
                            bleedObj?.dotColor || 'bg-rose-500'
                          }`}>
                            {bleedObj?.label}
                          </div>
                        )}
                        <div className="flex items-center gap-1 flex-wrap">
                          {log?.hasClots && (
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" title={`Clots: ${log.clotCount}`} />
                          )}
                          {(log?.bowelSeverity === 'moderate' || log?.bowelSeverity === 'severe') && (
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" title={`Bowel: ${log.bowelSeverity}`} />
                          )}
                          {log?.medications?.length > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" title="Medication taken" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Inspector Sidebar (4 cols on lg) */}
            <div className={`lg:col-span-4 rounded-3xl p-5 sm:p-6 border shadow-xs flex flex-col justify-between ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b pb-4 border-stone-200/60 dark:border-stone-800">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                      Selected Date
                    </span>
                    <h3 className="text-lg font-bold">{formatDateFriendly(selectedDate)}</h3>
                  </div>
                  <button
                    onClick={() => handleSwitchTab('log')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Edit Day Log
                  </button>
                </div>

                {logsMap[selectedDate] ? (
                  <div className="space-y-4 text-sm">
                    {/* Bleeding & Clots summary */}
                    <div className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-stone-800/60 border-stone-700' : 'bg-rose-50/50 border-rose-100'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                        Bleeding &amp; Clots
                      </div>
                      <div className="font-semibold capitalize">
                        Flow: {logsMap[selectedDate].bleedingSeverity}
                        {logsMap[selectedDate].leakedThrough && ' (Flooded/Leaked)'}
                      </div>
                      {(logsMap[selectedDate].padCount > 0 || logsMap[selectedDate].tamponCount > 0 || logsMap[selectedDate].cupCount > 0) && (
                        <div className="text-xs opacity-80 mt-1">
                          Used: {logsMap[selectedDate].padCount || 0} pads, {logsMap[selectedDate].tamponCount || 0} tampons, {logsMap[selectedDate].cupCount || 0} cups
                        </div>
                      )}
                      {logsMap[selectedDate].hasClots ? (
                        <div className="mt-2 pt-2 border-t border-rose-200/50 dark:border-stone-700 text-purple-700 dark:text-purple-300 font-semibold text-xs">
                          Clots: {logsMap[selectedDate].clotCount} passed ({(logsMap[selectedDate].clotSizes || []).join(', ') || 'size not specified'})
                        </div>
                      ) : (
                        <div className="text-xs opacity-60 mt-1">No blood clots logged</div>
                      )}
                    </div>

                    {/* Pain Summary */}
                    <div className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-stone-800/60 border-stone-700' : 'bg-amber-50/40 border-amber-100'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Pain Level</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${getPainBadgeStyle(logsMap[selectedDate].painScore)}`}>
                          {logsMap[selectedDate].painScore} / 10
                        </span>
                      </div>
                      {(logsMap[selectedDate].painLocations || []).length > 0 && (
                        <div className="text-xs mt-1">
                          <span className="font-semibold">Locations:</span> {logsMap[selectedDate].painLocations.join(', ')}
                        </div>
                      )}
                      {(logsMap[selectedDate].painTypes || []).length > 0 && (
                        <div className="text-xs mt-1 opacity-80">
                          <span className="font-semibold">Character:</span> {logsMap[selectedDate].painTypes.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Bowel Summary */}
                    <div className={`p-3.5 rounded-2xl border ${
                      darkMode ? 'bg-stone-800/60 border-stone-700' : 'bg-orange-50/40 border-orange-100'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                        Bowel &amp; GI ({logsMap[selectedDate].bowelSeverity})
                      </div>
                      {(logsMap[selectedDate].bowelSymptoms || []).length > 0 ? (
                        <div className="text-xs">{logsMap[selectedDate].bowelSymptoms.join(', ')}</div>
                      ) : (
                        <div className="text-xs opacity-60">No specific GI symptoms tagged</div>
                      )}
                    </div>

                    {/* Medications Summary */}
                    {(logsMap[selectedDate].medications || []).length > 0 && (
                      <div className={`p-3.5 rounded-2xl border ${
                        darkMode ? 'bg-stone-800/60 border-stone-700' : 'bg-emerald-50/40 border-emerald-100'
                      }`}>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                          Medications Taken
                        </div>
                        <ul className="space-y-1 text-xs">
                          {logsMap[selectedDate].medications.map((m) => (
                            <li key={m.id} className="flex justify-between">
                              <span className="font-semibold">{m.name} ({m.dose})</span>
                              <span className="opacity-75">{m.timeNotes}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Notes */}
                    {logsMap[selectedDate].notes && (
                      <div className={`p-3.5 rounded-2xl border text-xs italic ${
                        darkMode ? 'bg-stone-800/40 border-stone-700' : 'bg-stone-50 border-stone-200'
                      }`}>
                        &ldquo;{logsMap[selectedDate].notes}&rdquo;
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <CalendarIcon className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-700" />
                    <p className="text-sm font-medium">No symptoms logged for this date yet.</p>
                    <button
                      onClick={() => handleSwitchTab('log')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200"
                    >
                      + Log Symptoms for {formatShortDate(selectedDate)}
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-6 border-t border-stone-200/60 dark:border-stone-800 text-xs opacity-70 flex items-center justify-between">
                <span>Total days tracked: {Object.keys(logsMap).length}</span>
                <button
                  onClick={() => handleSwitchTab('insights')}
                  className="text-rose-600 font-semibold hover:underline"
                >
                  View GP Report &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 3: INSIGHTS & DOCTOR (GP / GYNECOLOGIST) REPORT VIEW
        ================================================================== */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Report Controls Bar */}
            <div className={`rounded-3xl p-5 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-rose-600" />
                  <span>{ownerName ? `${ownerName}'s ` : ''}Endometriosis Insights &amp; GP Report</span>
                </h2>
                <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  Symptom correlations, clot tracking &amp; printable clinical summary
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { days: 30, label: '30 Days' },
                  { days: 60, label: '60 Days' },
                  { days: 90, label: '90 Days' },
                  { days: 365, label: '1 Year' }
                ].map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setInsightsDays(opt.days)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      insightsDays === opt.days
                        ? 'bg-rose-600 text-white border-rose-600'
                        : darkMode
                          ? 'bg-stone-800 border-stone-700 text-stone-300'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-stone-800 text-white hover:bg-stone-900 dark:bg-stone-100 dark:text-stone-900"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print GP Summary</span>
                </button>
              </div>
            </div>

            {/* PRINT-ONLY CLINICAL HEADER */}
            <div className="hidden print-only border-b pb-4 mb-6">
              <h1 className="text-2xl font-bold">
                Floodgate Clinical Symptom Summary{ownerName ? ` — ${ownerName}` : ''}
              </h1>
              <p className="text-sm text-stone-600">
                Report Window: Last {insightsDays} Days (Generated {formatDateFriendly(getTodayStr())})
              </p>
            </div>

            {/* 4 SUMMARY KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-3xl border shadow-xs ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100'
              }`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">
                  Bleeding Days
                </div>
                <div className="text-3xl font-extrabold">{insightsData.bleedingDaysCount}</div>
                <div className="text-xs opacity-75 mt-1">
                  {insightsData.heavyDaysCount} heavy or flooding day(s)
                </div>
              </div>

              <div className={`p-5 rounded-3xl border shadow-xs ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100'
              }`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">
                  Blood Clot Episodes
                </div>
                <div className="text-3xl font-extrabold">{insightsData.totalClotsCount}</div>
                <div className="text-xs opacity-75 mt-1">
                  Across {insightsData.clotDaysCount} day(s) • {insightsData.largeClotDaysCount} with &gt;2cm clots
                </div>
              </div>

              <div className={`p-5 rounded-3xl border shadow-xs ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100'
              }`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
                  Average Pain Score
                </div>
                <div className="text-3xl font-extrabold">{insightsData.avgPainAll} <span className="text-base font-normal">/ 10</span></div>
                <div className="text-xs opacity-75 mt-1">
                  {insightsData.highPainDaysCount} severe pain day(s) (≥6/10)
                </div>
              </div>

              <div className={`p-5 rounded-3xl border shadow-xs ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100'
              }`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">
                  Bowel / GI Flare Days
                </div>
                <div className="text-3xl font-extrabold">{insightsData.bowelFlareDaysCount}</div>
                <div className="text-xs opacity-75 mt-1">
                  Moderate or severe GI distress days
                </div>
              </div>
            </div>

            {/* VISUAL CORRELATION TIMELINE CHART */}
            <div className={`rounded-3xl p-5 sm:p-6 border shadow-xs ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    Pain, Bleeding &amp; Bowel Correlation Timeline
                  </h3>
                  <p className="text-xs opacity-75">
                    Visualizing how {ownerName ? `${ownerName}'s` : 'daily'} pain score (0–10), period flow, clots, and bowel flares align
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> Pain (0–10)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" /> Bleeding</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> Clots</span>
                </div>
              </div>

              {insightsData.periodLogs.length > 0 ? (
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[540px] flex items-end gap-2 h-48 pt-6 px-2 border-b border-stone-200 dark:border-stone-800">
                    {insightsData.periodLogs.map((log) => {
                      const painHeight = Math.max(6, (Number(log.painScore) || 0) * 10);
                      const bleedObj = BLEEDING_LEVELS.find((b) => b.id === log.bleedingSeverity);
                      const bleedScore = bleedObj ? bleedObj.score : 0;
                      const bleedHeight = bleedScore * 18;

                      return (
                        <div
                          key={log.date}
                          onClick={async () => {
                            await handleSelectDate(log.date);
                            setActiveTab('log');
                          }}
                          className="flex-1 min-w-[28px] flex flex-col items-center group cursor-pointer"
                          title={`${formatDateFriendly(log.date)}: Pain ${log.painScore}/10, Bleeding: ${log.bleedingSeverity}`}
                        >
                          {/* Clot indicator dot at top */}
                          <div className="h-4 flex items-center justify-center mb-1">
                            {log.hasClots && (
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-purple-200" />
                            )}
                          </div>

                          {/* Dual Bars: Pain & Flow */}
                          <div className="w-full flex items-end justify-center gap-1 h-32">
                            <div
                              style={{ height: `${painHeight}%` }}
                              className="w-2.5 sm:w-3 rounded-t-md bg-amber-500 transition-all group-hover:brightness-110"
                            />
                            {bleedScore > 0 && (
                              <div
                                style={{ height: `${bleedHeight}%` }}
                                className="w-2.5 sm:w-3 rounded-t-md bg-rose-500 transition-all group-hover:brightness-110"
                              />
                            )}
                          </div>

                          <span className="text-[10px] opacity-70 mt-2 rotate-0 truncate">
                            {formatShortDate(log.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-sm opacity-75">
                  No logs recorded in this timeframe yet. Log a few days or load the sample cycle in the Sync &amp; Backup tab to preview trends.
                </div>
              )}
            </div>

            {/* SYMPTOM, MEDICATION & EXTERNAL FACTOR BREAKDOWN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Top Pain Locations */}
              <div className={`rounded-3xl p-5 border shadow-xs ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <h4 className="font-bold text-sm uppercase tracking-wider text-amber-600 mb-4">
                  Pain Locations
                </h4>
                {insightsData.topPainLocations.length > 0 ? (
                  <div className="space-y-3">
                    {insightsData.topPainLocations.map(([loc, count]) => (
                      <div key={loc} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{loc}</span>
                          <span>{count}d</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (count / Math.max(1, insightsData.totalLoggedDays)) * 100)}%` }}
                            className="h-full bg-amber-500 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs opacity-60">No pain locations logged yet.</p>
                )}
              </div>

              {/* Top Bowel & GI Symptoms */}
              <div className={`rounded-3xl p-5 border shadow-xs ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <h4 className="font-bold text-sm uppercase tracking-wider text-orange-600 mb-4">
                  Bowel / GI Issues
                </h4>
                {insightsData.topBowelSymptoms.length > 0 ? (
                  <div className="space-y-3">
                    {insightsData.topBowelSymptoms.map(([sym, count]) => (
                      <div key={sym} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{sym}</span>
                          <span>{count}d</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (count / Math.max(1, insightsData.totalLoggedDays)) * 100)}%` }}
                            className="h-full bg-orange-500 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs opacity-60">No bowel symptoms logged yet.</p>
                )}
              </div>

              {/* Top Medications Used */}
              <div className={`rounded-3xl p-5 border shadow-xs ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <h4 className="font-bold text-sm uppercase tracking-wider text-emerald-600 mb-4">
                  Medications Used
                </h4>
                {insightsData.topMedications.length > 0 ? (
                  <div className="space-y-3">
                    {insightsData.topMedications.map(([med, count]) => (
                      <div key={med} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{med}</span>
                          <span>{count}d</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (count / Math.max(1, insightsData.totalLoggedDays)) * 100)}%` }}
                            className="h-full bg-emerald-600 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs opacity-60">No medications logged in this period.</p>
                )}
              </div>

              {/* Top External Factors & Relief */}
              <div className={`rounded-3xl p-5 border shadow-xs ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <h4 className="font-bold text-sm uppercase tracking-wider text-rose-600 mb-4">
                  Relief &amp; Triggers
                </h4>
                {insightsData.topFactors.length > 0 ? (
                  <div className="space-y-3">
                    {insightsData.topFactors.map(([factor, count]) => (
                      <div key={factor} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{factor}</span>
                          <span>{count}d</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (count / Math.max(1, insightsData.totalLoggedDays)) * 100)}%` }}
                            className="h-full bg-rose-500 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs opacity-60">No external factors logged yet.</p>
                )}
              </div>
            </div>

            {/* DETAILED CHRONOLOGICAL LOG TABLE FOR GP CONSULTATION */}
            <div className={`rounded-3xl p-5 sm:p-6 border shadow-xs ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              <h3 className="text-base sm:text-lg font-bold mb-4">
                Chronological Consultation Table ({insightsData.periodLogs.length} Logged Days)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 opacity-75">
                      <th className="py-2.5 pr-3">Date</th>
                      <th className="py-2.5 px-3">Bleeding &amp; Protection</th>
                      <th className="py-2.5 px-3">Clots</th>
                      <th className="py-2.5 px-3">Pain (0–10) &amp; Sites</th>
                      <th className="py-2.5 px-3">Bowel / GI</th>
                      <th className="py-2.5 pl-3">Medications &amp; Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800">
                    {[...insightsData.periodLogs].reverse().map((l) => (
                      <tr key={l.date} className="align-top">
                        <td className="py-3 pr-3 font-bold whitespace-nowrap">
                          {formatShortDate(l.date)}
                        </td>
                        <td className="py-3 px-3 capitalize">
                          <span className="font-semibold">{l.bleedingSeverity}</span>
                          {l.leakedThrough && <span className="text-red-600 font-bold ml-1">(Flooded)</span>}
                          {(l.padCount > 0 || l.tamponCount > 0 || l.cupCount > 0) && (
                            <div className="opacity-75 text-[11px]">
                              {l.padCount ? `${l.padCount}p ` : ''}
                              {l.tamponCount ? `${l.tamponCount}t ` : ''}
                              {l.cupCount ? `${l.cupCount}c` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {l.hasClots ? (
                            <span className="text-purple-700 dark:text-purple-300 font-semibold">
                              {l.clotCount} ({(l.clotSizes || []).join(', ')})
                            </span>
                          ) : (
                            <span className="opacity-50">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded-md font-bold mr-1.5 ${getPainBadgeStyle(l.painScore)}`}>
                            {l.painScore}/10
                          </span>
                          <span>{(l.painLocations || []).join(', ')}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="capitalize font-semibold">{l.bowelSeverity}</span>
                          {(l.bowelSymptoms || []).length > 0 && (
                            <div className="opacity-80">{l.bowelSymptoms.join(', ')}</div>
                          )}
                        </td>
                        <td className="py-3 pl-3">
                          {(l.medications || []).length > 0 && (
                            <div className="font-medium text-emerald-700 dark:text-emerald-300">
                              {l.medications.map((m) => `${m.name} ${m.dose}`).join(', ')}
                            </div>
                          )}
                          {l.notes && <div className="italic opacity-80 mt-0.5">&ldquo;{l.notes}&rdquo;</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 4: CROSS-DEVICE SYNC & LOCAL HOME SERVER BACKUP
        ================================================================== */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            {/* User Profile & Personalisation Card */}
            <div className={`rounded-3xl p-5 sm:p-6 border shadow-xs ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Profile &amp; Personalisation</h2>
                    <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                      Enter your name to personalise your journal, exported files, and printable clinical GP summaries
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveOwnerName(nameDraft, { closeModal: false });
                  }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Enter your name..."
                    maxLength={40}
                    className={`flex-1 sm:w-56 px-3.5 py-2.5 rounded-xl text-xs font-medium border focus:outline-hidden focus:ring-2 focus:ring-rose-500 ${
                      darkMode ? 'bg-stone-800 border-stone-700 text-stone-100' : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shrink-0 cursor-pointer"
                  >
                    Save Name
                  </button>
                </form>
              </div>
            </div>

            {/* Cross-Device Local SQLite Sync Status Card */}
            <div className={`rounded-3xl p-5 sm:p-6 border shadow-xs ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
            }`}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Local Network Sync (Phone &amp; Tablet)</h2>
                    <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                      Symptom logs are stored exclusively in your local SQLite database — zero external cloud storage
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchServerState({ silent: false })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      darkMode
                        ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Now</span>
                  </button>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {Object.keys(logsMap).length} Days Stored
                  </span>
                </div>
              </div>

              <div className={`mt-4 p-4 rounded-2xl border text-xs space-y-2 ${
                darkMode ? 'bg-stone-800/50 border-stone-800' : 'bg-stone-50 border-stone-200/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Database Status:</span>
                  <span className={`font-bold uppercase ${
                    syncState === 'synced' ? 'text-emerald-600' : syncState === 'error' ? 'text-red-500' : 'text-amber-600'
                  }`}>
                    {syncState}
                  </span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold">Storage Engine:</span>
                  <code className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-900 font-mono text-[11px]">
                    Local SQLite (data/floodgate.db)
                  </code>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold">Sync Cadence:</span>
                  <span className="opacity-80">
                    Relaxed 30s polling + instant refresh on phone/tablet wake
                  </span>
                </div>
                {lastSyncedAt && (
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold">Last Synced:</span>
                    <span className="opacity-80">
                      {lastSyncedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                )}
                {syncError && <p className="text-red-500 mt-1">{syncError}</p>}
              </div>
            </div>

            {/* Local File Export & Import (JSON / CSV) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-3xl p-5 sm:p-6 border shadow-xs flex flex-col justify-between space-y-4 ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <div>
                  <h3 className="text-base font-bold mb-1">Local Backups &amp; Spreadsheet Export</h3>
                  <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    Download a full copy of your data for a local NAS/home server or as a CSV spreadsheet for your GP or specialist.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={exportJSON}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold bg-stone-800 text-white hover:bg-stone-900 dark:bg-stone-100 dark:text-stone-900"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON Backup</span>
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export CSV (Excel)</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-xs font-semibold cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800">
                    <Upload className="w-4 h-4 text-rose-600" />
                    <span>Restore / Merge from JSON Backup File</span>
                    <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Optional Local Home Server Webhook Push */}
              <div className={`rounded-3xl p-5 sm:p-6 border shadow-xs flex flex-col justify-between space-y-4 ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-rose-100/80'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="w-4 h-4 text-rose-600" />
                    <h3 className="text-base font-bold">Home Server Direct Webhook</h3>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    Want to also mirror your logs to another container or script on your local LAN server? Enter a local endpoint URL to POST the full JSON database on demand.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <input
                    type="url"
                    value={homeServerUrl}
                    onChange={(e) => setHomeServerUrl(e.target.value)}
                    placeholder="http://192.168.1.100:8080/api/floodgate-backup"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border ${
                      darkMode ? 'bg-stone-800 border-stone-700 text-stone-100' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                  <button
                    onClick={pushToHomeServer}
                    disabled={webhookStatus === 'sending'}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    {webhookStatus === 'sending' ? 'Pushing JSON to LAN Server...' : 'Push Backup to Local Server Now'}
                  </button>
                </div>
              </div>
            </div>

            {/* Demo Cycle Data Helper */}
            <div className={`rounded-3xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              darkMode ? 'bg-stone-900/60 border-stone-800' : 'bg-stone-100/70 border-stone-200'
            }`}>
              <div>
                <h4 className="text-sm font-bold">Preview with Sample Endometriosis Cycle Logs</h4>
                <p className="text-xs opacity-75">
                  Load 6 sample days (showing ovulation, spotting, heavy flow with clots, bowel flare-ups, and medications) to test the Calendar and GP Report views.
                </p>
              </div>
              <button
                onClick={loadSampleCycleData}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 shrink-0"
              >
                Load Sample Logs
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          MOBILE & TABLET BOTTOM NAVIGATION BAR
      ==================================================================== */}
      <nav className={`md:hidden fixed bottom-0 inset-x-0 z-30 border-t backdrop-blur-lg no-print ${
        darkMode ? 'bg-stone-900/95 border-stone-800' : 'bg-white/95 border-rose-100'
      }`}>
        <div className="grid grid-cols-4 h-16">
          {[
            { id: 'log', label: 'Daily Log', icon: Droplets },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'insights', label: 'GP Report', icon: Stethoscope },
            { id: 'data', label: 'Sync/Data', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSwitchTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                  active ? 'text-rose-600' : 'opacity-60'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
