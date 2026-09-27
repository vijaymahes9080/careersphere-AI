/**
 * CareerSphere AI — Opportunities Controller
 * Match analysis for imported opportunity/job datasets.
 * Never fabricates job data — only analyzes what was imported.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('OpportunitiesController', ['ProfileService', function (ProfileService) {
      var vm = this;

      vm.state = ProfileService.state;

      vm.analysis = function () {
        var a = ProfileService.state.analyses;
        return a ? a.opportunities : null;
      };

      vm.hasData = function () {
        return ProfileService.state.profile.opportunities.length > 0;
      };

      vm.selectedRow = null;
      vm.expand = function (row) {
        vm.selectedRow = vm.selectedRow === row ? null : row;
      };

      vm.statusClass = function (status) {
        return 'status-' + (status || '').toLowerCase();
      };
    }]);

})(angular);
