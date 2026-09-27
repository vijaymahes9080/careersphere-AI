/**
 * CareerSphere AI — Settings Controller
 * Theme, target role selection, demo data management, privacy, pipeline log.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('SettingsController', ['ProfileService', 'NotificationService',
      function (ProfileService, NotificationService) {
        var vm = this;

        vm.state = ProfileService.state;

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
          if (window.confirm('Delete ALL imported datasets and your profile from this browser? This cannot be undone.')) {
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
            for (var i = 0; i < localStorage.length; i++) {
              var key = localStorage.key(i);
              if (key && key.indexOf('careersphere') === 0) {
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
