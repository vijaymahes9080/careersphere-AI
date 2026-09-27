/**
 * CareerSphere AI — Overview Controller
 * Career profile, intelligence cards, readiness, central intelligence map,
 * data-quality warnings and source summary.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('OverviewController', ['ProfileService', function (ProfileService) {
      var vm = this;

      vm.state = ProfileService.state;

      vm.analyses = function () { return ProfileService.state.analyses; };

      vm.profile = function () { return ProfileService.state.profile; };

      vm.cards = function () {
        var a = ProfileService.state.analyses;
        return a ? a.cards : [];
      };

      vm.readiness = function () {
        var a = ProfileService.state.analyses;
        return a ? a.readiness : null;
      };

      vm.intelMap = function () {
        var a = ProfileService.state.analyses;
        return a ? a.intelMap : null;
      };

      vm.quality = function () {
        var a = ProfileService.state.analyses;
        if (!a) return { warnings: [], errors: [] };
        return {
          warnings: a.quality.warnings.slice(0, 8),
          errors: a.quality.errors,
          total: a.quality.warnings.length
        };
      };

      vm.demoActive = function () {
        return ProfileService.state.datasets.some(function (d) { return d.isDemo; });
      };

      vm.selectedNode = null;
      vm.onSelectNode = function (node) {
        vm.selectedNode = node;
      };

      vm.primaryTargetRole = function () {
        var a = ProfileService.state.analyses;
        if (a && a.coverage && a.coverage.role) return a.coverage.role.title;
        var roles = ProfileService.state.profile.targetRoles;
        return roles.length ? roles[0].title : null;
      };

      vm.hasData = function () {
        return ProfileService.state.datasets.length > 0;
      };

      vm.gapCount = function () {
        var a = ProfileService.state.analyses;
        if (!a || !a.coverage || !a.coverage.counts) return 0;
        return a.coverage.counts.MISSING + a.coverage.counts.PARTIAL + a.coverage.counts.UNVERIFIED;
      };

      vm.directionText = function () {
        var p = ProfileService.state.profile;
        if (p.targetRoles.length) {
          return p.targetRoles.map(function (r) { return r.title; }).join(' · ');
        }
        return p.careerGoals.length ? p.careerGoals[0] : '—';
      };
    }]);

})(angular);
