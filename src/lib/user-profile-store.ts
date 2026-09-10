import type { UserProfile } from "@/types/user-profile";

const USER_PROFILES_KEY = "schedula_user_profiles";

export function getUserProfiles(): UserProfile[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(USER_PROFILES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUserProfiles(profiles: UserProfile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
  window.dispatchEvent(new Event("schedula_user_profiles_updated"));
}

export function getUserProfile(id: string): UserProfile | undefined {
  return getUserProfiles().find(p => p.id === id);
}

export function updateUserProfile(profile: UserProfile) {
  const profiles = getUserProfiles();
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index !== -1) {
    profiles[index] = profile;
  } else {
    profiles.push(profile);
  }
  saveUserProfiles(profiles);
}
