/**
 * CareerSphere AI — Notification Service
 * Small toast queue for user feedback (errors, successes).
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('NotificationService', ['$timeout', function ($timeout) {
      var toasts = [];
      var seq = 0;

      function push(type, message) {
        var toast = { id: ++seq, type: type, message: message };
        toasts.push(toast);
        $timeout(function () {
          remove(toast.id);
        }, type === 'error' ? 7000 : 4000);
        return toast;
      }

      function remove(id) {
        for (var i = 0; i < toasts.length; i++) {
          if (toasts[i].id === id) { toasts.splice(i, 1); return; }
        }
      }

      return {
        toasts: toasts,
        success: function (m) { return push('success', m); },
        info: function (m) { return push('info', m); },
        warn: function (m) { return push('warning', m); },
        error: function (m) { return push('error', m); },
        remove: remove
      };
    }]);

})(angular);
