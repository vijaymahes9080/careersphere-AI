/**
 * CareerSphere AI — Admin Controllers
 * AdminDashboardController, AdminUsersController, AdminActivityController
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    // ── Admin Dashboard Controller ────────────────────────────────
    .controller('AdminDashboardController', [
      '$scope',
      'AuthService',
      'NotificationService',
      function ($scope, AuthService, NotificationService) {
        var vm = this;

        vm.currentUser = AuthService.getCurrentUser();
        vm.analytics = null;

        vm.refresh = function () {
          vm.analytics = AuthService.getPlatformAnalytics();
        };

        vm.exportData = function (format) {
          var res = AuthService.exportPlatformData(format);
          var blob = new Blob([res.content], { type: res.mime });
          var url = window.URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = res.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          NotificationService.success('Exported platform analytics as ' + format.toUpperCase());
        };

        // Initialize analytics
        vm.refresh();
      }
    ])

    // ── Admin Users Controller ────────────────────────────────────
    .controller('AdminUsersController', [
      '$scope',
      'AuthService',
      'NotificationService',
      function ($scope, AuthService, NotificationService) {
        var vm = this;

        vm.search = '';
        vm.filterRole = 'all';
        vm.filterStatus = 'all';
        vm.sortBy = 'name'; // name | joined | skills | projects
        vm.sortAsc = true;

        vm.selectedDossier = null;
        vm.dossierTab = 'profile'; // profile | skills | projects | goals | learning

        vm.users = function () {
          var list = AuthService.getUsers();

          if (vm.filterRole !== 'all') {
            list = list.filter(function (u) { return u.role === vm.filterRole; });
          }
          if (vm.filterStatus !== 'all') {
            list = list.filter(function (u) { return u.status === vm.filterStatus; });
          }
          if (vm.search) {
            var q = vm.search.toLowerCase().trim();
            list = list.filter(function (u) {
              return u.name.toLowerCase().indexOf(q) > -1 ||
                u.email.toLowerCase().indexOf(q) > -1 ||
                (u.targetRole && u.targetRole.toLowerCase().indexOf(q) > -1);
            });
          }

          list.sort(function (a, b) {
            var res = 0;
            if (vm.sortBy === 'name') res = a.name.localeCompare(b.name);
            else if (vm.sortBy === 'joined') res = (a.createdAt || '').localeCompare(b.createdAt || '');
            else if (vm.sortBy === 'skills') res = (b.skillsCount || 0) - (a.skillsCount || 0);
            else if (vm.sortBy === 'projects') res = (b.projectsCount || 0) - (a.projectsCount || 0);
            return vm.sortAsc ? res : -res;
          });

          return list;
        };

        vm.setSort = function (field) {
          if (vm.sortBy === field) {
            vm.sortAsc = !vm.sortAsc;
          } else {
            vm.sortBy = field;
            vm.sortAsc = true;
          }
        };

        vm.viewDossier = function (user) {
          vm.selectedDossier = AuthService.getUserDossier(user.id);
          vm.dossierTab = 'profile';
        };

        vm.closeDossier = function () {
          vm.selectedDossier = null;
        };

        vm.toggleStatus = function (user) {
          var newStatus = user.status === 'active' ? 'disabled' : 'active';
          var ok = AuthService.updateUserStatus(user.id, newStatus);
          if (ok) {
            user.status = newStatus;
            NotificationService.info('User ' + user.name + ' is now ' + newStatus);
          } else {
            NotificationService.warn('Cannot change status of this user.');
          }
        };

        vm.deleteUser = function (user) {
          if (confirm('Are you sure you want to delete user "' + user.name + '" and all their data? This action cannot be undone.')) {
            var ok = AuthService.deleteUser(user.id);
            if (ok) {
              if (vm.selectedDossier && vm.selectedDossier.user.id === user.id) {
                vm.selectedDossier = null;
              }
              NotificationService.success('User "' + user.name + '" removed.');
            } else {
              NotificationService.error('Cannot delete this administrator account.');
            }
          }
        };
      }
    ])

    // ── Admin Activity Controller ─────────────────────────────────
    .controller('AdminActivityController', [
      '$scope',
      'AuthService',
      'NotificationService',
      function ($scope, AuthService, NotificationService) {
        var vm = this;

        vm.search = '';
        vm.filterType = 'all'; // all | user | system

        vm.activities = function () {
          var list = AuthService.getActivities();
          if (vm.filterType !== 'all') {
            list = list.filter(function (a) {
              if (vm.filterType === 'system') return a.userRole === 'system' || a.type === 'system';
              return a.userRole !== 'system' && a.type !== 'system';
            });
          }
          if (vm.search) {
            var q = vm.search.toLowerCase().trim();
            list = list.filter(function (a) {
              return (a.action && a.action.toLowerCase().indexOf(q) > -1) ||
                (a.details && a.details.toLowerCase().indexOf(q) > -1) ||
                (a.userName && a.userName.toLowerCase().indexOf(q) > -1);
            });
          }
          return list;
        };

        vm.clearLogs = function () {
          if (confirm('Clear audit activity history?')) {
            AuthService.clearActivities();
            NotificationService.info('Audit history cleared.');
          }
        };

        vm.exportLogs = function () {
          var activities = AuthService.getActivities();
          var csv = 'ID,Timestamp,User,Role,Action,Details\n';
          activities.forEach(function (a) {
            csv += [
              '"' + a.id + '"',
              '"' + a.timestamp + '"',
              '"' + (a.userName || '') + '"',
              '"' + (a.userRole || '') + '"',
              '"' + (a.action || '') + '"',
              '"' + (a.details || '').replace(/"/g, '""') + '"'
            ].join(',') + '\n';
          });

          var blob = new Blob([csv], { type: 'text/csv' });
          var url = window.URL.createObjectURL(blob);
          var aTag = document.createElement('a');
          aTag.href = url;
          aTag.download = 'careersphere-audit-log-' + Date.now() + '.csv';
          document.body.appendChild(aTag);
          aTag.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(aTag);
          NotificationService.success('Audit log exported as CSV.');
        };
      }
    ]);

})(angular);
