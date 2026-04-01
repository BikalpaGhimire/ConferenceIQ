const PREFIX = 'conferenceiq_';

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

export function loadFromStorage(key, fallback = null) {
  try {
    const item = localStorage.getItem(PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function loadSavedProfiles() {
  return loadFromStorage('savedProfiles', []);
}

export function loadRecentSearches() {
  return loadFromStorage('recentSearches', []);
}

export function isProfileSaved(savedProfiles, name) {
  return savedProfiles.some((p) => p.quick_card?.full_name === name);
}

export function getProfileAge(profile) {
  if (!profile?._savedAt) return null;
  const diff = Date.now() - profile._savedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}
