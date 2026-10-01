/**
 * CareerSphere AI — Storage Service
 * Handles localStorage persistence with multi-user isolation, sessions, and activity logs.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('StorageService', ['$q', function ($q) {
      // Legacy single-user keys for fallback
      var LEGACY_PROFILE_KEY = 'careersphere_profile_v1';
      var LEGACY_DATASETS_KEY = 'careersphere_datasets_v1';
      var LEGACY_SETTINGS_KEY = 'careersphere_settings_v1';

      // Multi-user & session keys
      var USERS_KEY = 'careersphere_users_v2';
      var SESSION_KEY = 'careersphere_session_v2';
      var ACTIVITY_KEY = 'careersphere_activity_v2';

      function getUserKey(userId, keySuffix) {
        if (!userId) return null;
        return 'careersphere_u_' + userId + '_' + keySuffix;
      }

      function getActiveUserId() {
        try {
          var session = localStorage.getItem(SESSION_KEY);
          if (session) {
            var parsed = JSON.parse(session);
            return parsed && parsed.userId ? parsed.userId : null;
          }
        } catch (e) { /* ignore */ }
        return null;
      }

      return {
        getActiveUserId: getActiveUserId,

        // ── Session ───────────────────────────────────────────────
        saveSession: function (session) {
          try {
            if (session) {
              localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
            return true;
          } catch (e) {
            console.warn('StorageService: failed to save session', e);
            return false;
          }
        },

        loadSession: function () {
          try {
            var raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
          } catch (e) {
            return null;
          }
        },

        clearSession: function () {
          try {
            localStorage.removeItem(SESSION_KEY);
          } catch (e) { /* ignore */ }
        },

        // ── Users Collection ──────────────────────────────────────
        saveUsers: function (users) {
          try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return true;
          } catch (e) {
            console.warn('StorageService: failed to save users', e);
            return false;
          }
        },

        loadUsers: function () {
          try {
            var raw = localStorage.getItem(USERS_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        },

        // ── Activities Collection ─────────────────────────────────
        saveActivities: function (activities) {
          try {
            localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities));
            return true;
          } catch (e) {
            return false;
          }
        },

        loadActivities: function () {
          try {
            var raw = localStorage.getItem(ACTIVITY_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        },

        addActivity: function (entry) {
          var list = this.loadActivities();
          entry.id = 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          entry.timestamp = entry.timestamp || new Date().toISOString();
          list.unshift(entry);
          if (list.length > 200) list.length = 200; // retain latest 200 events
          this.saveActivities(list);
          return entry;
        },

        // ── User-Isolated Profile ─────────────────────────────────
        saveUserProfile: function (userId, profile) {
          try {
            var key = getUserKey(userId, 'profile') || LEGACY_PROFILE_KEY;
            localStorage.setItem(key, JSON.stringify(profile));
            return true;
          } catch (e) {
            console.warn('StorageService: failed to save user profile', e);
            return false;
          }
        },

        loadUserProfile: function (userId) {
          try {
            var key = getUserKey(userId, 'profile');
            var raw = key ? localStorage.getItem(key) : null;
            if (!raw && !userId) raw = localStorage.getItem(LEGACY_PROFILE_KEY);
            return raw ? JSON.parse(raw) : null;
          } catch (e) {
            return null;
          }
        },

        clearUserProfile: function (userId) {
          var key = getUserKey(userId, 'profile');
          if (key) localStorage.removeItem(key);
        },

        // ── User-Isolated Datasets ────────────────────────────────
        saveUserDatasets: function (userId, datasets) {
          try {
            var key = getUserKey(userId, 'datasets') || LEGACY_DATASETS_KEY;
            localStorage.setItem(key, JSON.stringify(datasets));
            return true;
          } catch (e) {
            console.warn('StorageService: failed to save user datasets', e);
            return false;
          }
        },

        loadUserDatasets: function (userId) {
          try {
            var key = getUserKey(userId, 'datasets');
            var raw = key ? localStorage.getItem(key) : null;
            if (!raw && !userId) raw = localStorage.getItem(LEGACY_DATASETS_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        },

        // ── User-Isolated Settings ────────────────────────────────
        saveUserSettings: function (userId, settings) {
          try {
            var key = getUserKey(userId, 'settings') || LEGACY_SETTINGS_KEY;
            localStorage.setItem(key, JSON.stringify(settings));
          } catch (e) { /* ignore */ }
        },

        loadUserSettings: function (userId) {
          try {
            var key = getUserKey(userId, 'settings');
            var raw = key ? localStorage.getItem(key) : null;
            if (!raw && !userId) raw = localStorage.getItem(LEGACY_SETTINGS_KEY);
            return raw ? JSON.parse(raw) : {};
          } catch (e) {
            return {};
          }
        },

        // ── User-Isolated Career Goals ────────────────────────────
        saveUserGoals: function (userId, goals) {
          try {
            var key = getUserKey(userId, 'goals');
            if (key) localStorage.setItem(key, JSON.stringify(goals));
            return true;
          } catch (e) {
            return false;
          }
        },

        loadUserGoals: function (userId) {
          try {
            var key = getUserKey(userId, 'goals');
            var raw = key ? localStorage.getItem(key) : null;
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        },

        // ── User-Isolated Custom Skills ───────────────────────────
        saveUserCustomSkills: function (userId, skills) {
          try {
            var key = getUserKey(userId, 'custom_skills');
            if (key) localStorage.setItem(key, JSON.stringify(skills));
            return true;
          } catch (e) {
            return false;
          }
        },

        loadUserCustomSkills: function (userId) {
          try {
            var key = getUserKey(userId, 'custom_skills');
            var raw = key ? localStorage.getItem(key) : null;
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        },

        // ── User-Isolated Custom Projects ─────────────────────────
        saveUserCustomProjects: function (userId, projects) {
          try {
            var key = getUserKey(userId, 'custom_projects');
            if (key) localStorage.setItem(key, JSON.stringify(projects));
            return true;
          } catch (e) {
            return false;
          }
        },

        loadUserCustomProjects: function (userId) {
          try {
            var key = getUserKey(userId, 'custom_projects');
            var raw = key ? localStorage.getItem(key) : null;
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        },

        // ── Backwards Compatible Shims ────────────────────────────
        saveProfile: function (profile, optUserId) {
          var uid = optUserId || getActiveUserId();
          return this.saveUserProfile(uid, profile);
        },

        loadProfile: function (optUserId) {
          var uid = optUserId || getActiveUserId();
          return this.loadUserProfile(uid);
        },

        clearProfile: function (optUserId) {
          var uid = optUserId || getActiveUserId();
          if (uid) this.clearUserProfile(uid);
          else localStorage.removeItem(LEGACY_PROFILE_KEY);
        },

        saveDatasets: function (datasets, optUserId) {
          var uid = optUserId || getActiveUserId();
          return this.saveUserDatasets(uid, datasets);
        },

        loadDatasets: function (optUserId) {
          var uid = optUserId || getActiveUserId();
          return this.loadUserDatasets(uid);
        },

        saveSettings: function (settings, optUserId) {
          var uid = optUserId || getActiveUserId();
          return this.saveUserSettings(uid, settings);
        },

        loadSettings: function (optUserId) {
          var uid = optUserId || getActiveUserId();
          return this.loadUserSettings(uid);
        },

        clearAll: function (optUserId) {
          var uid = optUserId || getActiveUserId();
          if (uid) {
            localStorage.removeItem(getUserKey(uid, 'profile'));
            localStorage.removeItem(getUserKey(uid, 'datasets'));
            localStorage.removeItem(getUserKey(uid, 'settings'));
            localStorage.removeItem(getUserKey(uid, 'goals'));
            localStorage.removeItem(getUserKey(uid, 'custom_skills'));
            localStorage.removeItem(getUserKey(uid, 'custom_projects'));
          } else {
            localStorage.removeItem(LEGACY_PROFILE_KEY);
            localStorage.removeItem(LEGACY_DATASETS_KEY);
            localStorage.removeItem(LEGACY_SETTINGS_KEY);
          }
        },

        // Clear all data for a specific user completely (used by Admin)
        purgeUserData: function (userId) {
          if (!userId) return;
          localStorage.removeItem(getUserKey(userId, 'profile'));
          localStorage.removeItem(getUserKey(userId, 'datasets'));
          localStorage.removeItem(getUserKey(userId, 'settings'));
          localStorage.removeItem(getUserKey(userId, 'goals'));
          localStorage.removeItem(getUserKey(userId, 'custom_skills'));
          localStorage.removeItem(getUserKey(userId, 'custom_projects'));
        }
      };
    }]);

})(angular);
