/**
 * CareerSphere AI — Storage Service
 * Handles localStorage persistence of the career profile and datasets.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('StorageService', ['$q', function ($q) {
      var PROFILE_KEY = 'careersphere_profile_v1';
      var DATASETS_KEY = 'careersphere_datasets_v1';
      var SETTINGS_KEY = 'careersphere_settings_v1';

      return {
        saveProfile: function (profile) {
          try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            return true;
          } catch (e) {
            console.warn('StorageService: failed to save profile', e);
            return false;
          }
        },

        loadProfile: function () {
          try {
            var raw = localStorage.getItem(PROFILE_KEY);
            return raw ? JSON.parse(raw) : null;
          } catch (e) {
            console.warn('StorageService: failed to load profile', e);
            return null;
          }
        },

        clearProfile: function () {
          localStorage.removeItem(PROFILE_KEY);
        },

        saveDatasets: function (datasets) {
          try {
            localStorage.setItem(DATASETS_KEY, JSON.stringify(datasets));
            return true;
          } catch (e) {
            console.warn('StorageService: failed to save datasets', e);
            return false;
          }
        },

        loadDatasets: function () {
          try {
            var raw = localStorage.getItem(DATASETS_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        },

        saveSettings: function (settings) {
          try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
          } catch (e) { /* ignore */ }
        },

        loadSettings: function () {
          try {
            var raw = localStorage.getItem(SETTINGS_KEY);
            return raw ? JSON.parse(raw) : {};
          } catch (e) {
            return {};
          }
        },

        clearAll: function () {
          localStorage.removeItem(PROFILE_KEY);
          localStorage.removeItem(DATASETS_KEY);
          localStorage.removeItem(SETTINGS_KEY);
        }
      };
    }]);

})(angular);
