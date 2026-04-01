import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { loadSavedProfiles, loadRecentSearches, loadMyProfile, saveToStorage, saveMyProfile } from '../services/storage';

const AppContext = createContext(null);

const initialState = {
  // Navigation
  currentView: 'search', // search | disambiguation | profile | schedule | saved | my-profile | onboarding | login

  // Auth
  userId: null,

  // User Identity
  myProfile: null,
  onboardingComplete: false,

  // Search
  searchQuery: '',
  contextHints: { field: '', institution: '', conference: '', country: '' },
  recentSearches: [],

  // Disambiguation
  candidates: [],
  disambiguationLoading: false,

  // Profile
  currentProfile: null,
  profileLoading: {
    quickCard: false,
    research: false,
    media: false,
    values: false,
  },

  // Schedule
  extractedNames: [],
  scheduleSource: '',
  selectedForProfiling: [],
  batchProgress: { completed: 0, total: 0 },

  // Saved
  savedProfiles: [],

  // Notes (keyed by profile full_name)
  notes: {},

  // Error
  error: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload, error: null };

    // Auth
    case 'SET_USER_ID': {
      saveToStorage('userId', action.payload);
      return { ...state, userId: action.payload };
    }

    case 'LOGOUT': {
      localStorage.removeItem('conferenceiq_userId');
      localStorage.removeItem('conferenceiq_myProfile');
      localStorage.removeItem('conferenceiq_onboardingComplete');
      localStorage.removeItem('conferenceiq_savedProfiles');
      localStorage.removeItem('conferenceiq_notes');
      localStorage.removeItem('conferenceiq_recentSearches');
      return { ...initialState };
    }

    // User Identity
    case 'SET_MY_PROFILE': {
      saveMyProfile(action.payload);
      return { ...state, myProfile: action.payload };
    }

    case 'SET_ONBOARDING_COMPLETE': {
      saveToStorage('onboardingComplete', action.payload);
      return { ...state, onboardingComplete: action.payload };
    }

    case 'UPDATE_MY_PROFILE': {
      const updated = { ...state.myProfile, ...action.payload };
      saveMyProfile(updated);
      return { ...state, myProfile: updated };
    }

    // Search
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_CONTEXT_HINTS':
      return { ...state, contextHints: { ...state.contextHints, ...action.payload } };

    case 'SET_CANDIDATES':
      return { ...state, candidates: action.payload, disambiguationLoading: false };

    case 'SET_DISAMBIGUATION_LOADING':
      return { ...state, disambiguationLoading: action.payload };

    case 'SET_CURRENT_PROFILE':
      return { ...state, currentProfile: action.payload };

    case 'UPDATE_PROFILE_SECTION':
      return {
        ...state,
        currentProfile: state.currentProfile
          ? { ...state.currentProfile, ...action.payload }
          : action.payload,
      };

    case 'SET_PROFILE_LOADING':
      return {
        ...state,
        profileLoading: { ...state.profileLoading, ...action.payload },
      };

    case 'SET_EXTRACTED_NAMES':
      return {
        ...state,
        extractedNames: action.payload.names,
        scheduleSource: action.payload.source,
      };

    case 'TOGGLE_SELECT_FOR_PROFILING': {
      const name = action.payload;
      const selected = state.selectedForProfiling.includes(name)
        ? state.selectedForProfiling.filter((n) => n !== name)
        : [...state.selectedForProfiling, name];
      return { ...state, selectedForProfiling: selected };
    }

    case 'SELECT_ALL_FOR_PROFILING':
      return {
        ...state,
        selectedForProfiling: state.extractedNames.map((n) => n.name),
      };

    case 'SET_BATCH_PROGRESS':
      return { ...state, batchProgress: action.payload };

    case 'SAVE_PROFILE': {
      const profile = action.payload;
      const exists = state.savedProfiles.find(
        (p) => p.quick_card?.full_name === profile.quick_card?.full_name
      );
      const savedProfiles = exists
        ? state.savedProfiles.map((p) =>
            p.quick_card?.full_name === profile.quick_card?.full_name ? profile : p
          )
        : [...state.savedProfiles, profile];
      saveToStorage('savedProfiles', savedProfiles);
      return { ...state, savedProfiles };
    }

    case 'REMOVE_SAVED_PROFILE': {
      const savedProfiles = state.savedProfiles.filter(
        (p) => p.quick_card?.full_name !== action.payload
      );
      saveToStorage('savedProfiles', savedProfiles);
      return { ...state, savedProfiles };
    }

    case 'SET_SAVED_PROFILES':
      return { ...state, savedProfiles: action.payload };

    case 'SET_NOTE': {
      const notes = { ...state.notes, [action.payload.name]: action.payload.text };
      saveToStorage('notes', notes);
      return { ...state, notes };
    }

    case 'SET_NOTES':
      return { ...state, notes: action.payload };

    case 'ADD_RECENT_SEARCH': {
      const entry = action.payload;
      const filtered = state.recentSearches.filter(
        (r) => r.name !== entry.name
      );
      const recentSearches = [entry, ...filtered].slice(0, 10);
      saveToStorage('recentSearches', recentSearches);
      return { ...state, recentSearches };
    }

    case 'SET_RECENT_SEARCHES':
      return { ...state, recentSearches: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET_SEARCH':
      return {
        ...state,
        searchQuery: '',
        contextHints: { field: '', institution: '', conference: '', country: '' },
        candidates: [],
        currentProfile: null,
        disambiguationLoading: false,
        profileLoading: { quickCard: false, research: false, media: false, values: false },
        extractedNames: [],
        scheduleSource: '',
        selectedForProfiling: [],
        batchProgress: { completed: 0, total: 0 },
        error: null,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const savedProfiles = loadSavedProfiles();
    const recentSearches = loadRecentSearches();
    const notes = JSON.parse(localStorage.getItem('conferenceiq_notes') || '{}');
    const myProfile = loadMyProfile();
    const onboardingComplete = JSON.parse(localStorage.getItem('conferenceiq_onboardingComplete') || 'false');
    const userId = JSON.parse(localStorage.getItem('conferenceiq_userId') || 'null');

    dispatch({ type: 'SET_SAVED_PROFILES', payload: savedProfiles });
    dispatch({ type: 'SET_RECENT_SEARCHES', payload: recentSearches });
    dispatch({ type: 'SET_NOTES', payload: notes });
    if (myProfile) {
      dispatch({ type: 'SET_MY_PROFILE', payload: myProfile });
    }
    if (onboardingComplete) {
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    }
    if (userId) {
      dispatch({ type: 'SET_USER_ID', payload: userId });
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
