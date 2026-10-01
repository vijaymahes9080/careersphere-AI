/**
 * CareerSphere AI — Settings Controller
 * User account & security, password changes, theme, target role selection,
 * demo data management, privacy, architecture status, pipeline log.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('SettingsController', [
      '$location',
      'ProfileService',
      'AuthService',
      'NotificationService',
      function ($location, ProfileService, AuthService, NotificationService) {
        var vm = this;

        vm.state = ProfileService.state;
        vm.currentUser = function () {
          return AuthService.getCurrentUser();
        };

        // Password change form
        vm.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        vm.changingPassword = false;
        vm.passwordSuccess = '';
        vm.passwordError = '';

        vm.changePassword = function () {
          vm.passwordSuccess = '';
          vm.passwordError = '';

          if (!vm.passwordForm.currentPassword) {
            vm.passwordError = 'Current password is required.';
            return;
          }
          if (!vm.passwordForm.newPassword || vm.passwordForm.newPassword.length < 6) {
            vm.passwordError = 'New password must be at least 6 characters.';
            return;
          }
          if (vm.passwordForm.newPassword !== vm.passwordForm.confirmPassword) {
            vm.passwordError = 'New passwords do not match.';
            return;
          }

          var user = AuthService.getCurrentUser();
          if (!user) return;

          vm.changingPassword = true;
          AuthService.changePassword(user.userId, vm.passwordForm.currentPassword, vm.passwordForm.newPassword)
            .then(function () {
              vm.changingPassword = false;
              vm.passwordSuccess = 'Password updated successfully!';
              vm.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
              NotificationService.success('Password updated successfully.');
            })
            .catch(function (err) {
              vm.changingPassword = false;
              vm.passwordError = (err && err.message) || 'Failed to update password.';
              NotificationService.error(vm.passwordError);
            });
        };

        vm.logout = function () {
          AuthService.logout();
          ProfileService.switchUser(null);
          NotificationService.info('You have been signed out.');
          $location.path('/login');
        };

        vm.roles = function () {
          return ProfileService.state.profile.targetRoles;
        };

        vm.selectedRoleId = function () {
          var a = ProfileService.state.analyses;
          return a && a.coverage ? 'role:' + a.coverage.role.title.toLowerCase().replace(/[^a-z0-9]/g, '_') : ProfileService.state.settings.selectedRoleId;
        };

        vm.pendingRole = ProfileService.state.settings.selectedRoleId || '';
        vm.$onInit = function () {
          vm.pendingRole = ProfileService.state.settings.selectedRoleId || '';
        };

        vm.saveRole = function () {
          ProfileService.updateSettings({ selectedRoleId: vm.pendingRole || '' });
          vm.pendingRole = ProfileService.state.settings.selectedRoleId || '';
          NotificationService.success('Target role updated — coverage and gaps recomputed.');
        };

        vm.setTheme = function (theme) {
          ProfileService.setTheme(theme);
        };

        vm.clearAll = function () {
          if (window.confirm('Delete ALL career data for your account in this browser? This cannot be undone.')) {
            ProfileService.clearAllData();
          }
        };

        vm.loadDemo = function () {
          ProfileService.loadDemo();
        };

        vm.purgeDemo = function () {
          ProfileService.purgeDemo();
        };

        vm.hasDemo = function () {
          return ProfileService.state.datasets.some(function (d) { return d.isDemo; });
        };

        vm.pipelineLog = function () {
          return ProfileService.state.pipelineLog;
        };

        vm.storageUsed = function () {
          try {
            var total = 0;
            var user = AuthService.getCurrentUser();
            var prefix = user ? ('careersphere_u_' + user.userId) : 'careersphere';
            for (var i = 0; i < localStorage.length; i++) {
              var key = localStorage.key(i);
              if (key && key.indexOf(prefix) === 0) {
                total += (localStorage.getItem(key) || '').length;
              }
            }
            return Math.round(total / 1024) + ' KB';
          } catch (e) {
            return 'n/a';
          }
        };
      }
    ]);

})(angular);
