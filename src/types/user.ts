/**
 * User types
 */

export interface User {
  id:        string;
  name:      string;
  email:     string;
  phone?:    string;
  createdAt: string;
  avatar?:   string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  currency:       string;
  locale:         string;
  notifications:  boolean;
  newsletter:     boolean;
}

export interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  authLoading:     boolean;
  authError:       string | null;
  accessToken:     string | null;
}

export interface ChakanTreeMembership {
  referralCode: string;
  joinedAt:     string;
  tier:         'seed' | 'sprout' | 'tree';
  isActive:     boolean;
}