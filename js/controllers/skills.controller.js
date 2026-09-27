/**
 * CareerSphere AI — Skill Intelligence Controller
 * Skill matrix, filters, radar, category distribution and
 * skill gap analysis against a selected target role.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('SkillIntelligenceController', ['$scope', 'ProfileService', function ($scope, ProfileService) {
      var vm = this;

      vm.state = ProfileService.state;
      vm.search = '';
      vm.sortBy = 'strength'; // strength | name | evidence | level
      vm.selectedNode = null;

      vm.filters = function () {
        var a = ProfileService.state.analyses;
        var present = a ? a.skill.categories.map(function (c) { return c.category; }) : [];
        return ['All'].concat(present);
      };

      vm.skills = function () {
        var a = ProfileService.state.analyses;
        if (!a) return [];
        var list = a.skill.skills.slice();
        var filter = ProfileService.state.settings.skillFilter || 'All';
        if (filter !== 'All') {
          list = list.filter(function (s) { return s.category === filter; });
        }
        if (vm.search) {
          var q = vm.search.toLowerCase();
          list = list.filter(function (s) {
            return s.name.toLowerCase().indexOf(q) > -1 ||
              s.category.toLowerCase().indexOf(q) > -1;
          });
        }
        if (vm.sortBy === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
        else if (vm.sortBy === 'evidence') list.sort(function (a, b) { return b.evidenceCount - a.evidenceCount; });
        else if (vm.sortBy === 'level') list.sort(function (a, b) { return (b.levelValue || 0) - (a.levelValue || 0); });
        else list.sort(function (a, b) { return b.strength - a.strength; });
        return list;
      };

      vm.setFilter = function (cat) {
        ProfileService.updateSettings({ skillFilter: cat });
      };

      vm.roleId = function (role) {
        return 'role:' + role.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      };

      vm.strengthClass = function (value) {
        if (value >= 70) return 'fill-good';
        if (value >= 45) return 'fill-mid';
        return 'fill-low';
      };

      vm.radar = function () {
        var a = ProfileService.state.analyses;
        return a ? a.skill.radar : { labels: [], values: [] };
      };

      vm.categories = function () {
        var a = ProfileService.state.analyses;
        return a ? a.skill.categories : [];
      };

      vm.stats = function () {
        var a = ProfileService.state.analyses;
        return a ? a.skill.stats : null;
      };

      // ── Gap analysis ──────────────────────────────────────────────

      vm.roles = function () {
        return ProfileService.state.profile.targetRoles;
      };

      vm.coverage = function () {
        var a = ProfileService.state.analyses;
        return a ? a.coverage : null;
      };

      vm.selectRole = function () {
        ProfileService.updateSettings({ selectedRoleId: ProfileService.state.settings.selectedRoleId });
      };

      // Cached so ng-repeat receives a stable array of stable objects —
      // rebuilding fresh objects on every digest causes an infinite digest.
      var countsCoverage = null;
      var countsCache = [];

      vm.statusCounts = function () {
        var c = vm.coverage();
        if (c !== countsCoverage) {
          countsCoverage = c;
          countsCache = c ? [
            { key: 'STRONG', label: 'Strong', count: c.counts.STRONG, cls: 'strong' },
            { key: 'FOUND', label: 'Found', count: c.counts.FOUND, cls: 'found' },
            { key: 'PARTIAL', label: 'Partial', count: c.counts.PARTIAL, cls: 'partial' },
            { key: 'UNVERIFIED', label: 'Unverified', count: c.counts.UNVERIFIED, cls: 'unverified' },
            { key: 'MISSING', label: 'Missing', count: c.counts.MISSING, cls: 'missing' }
          ] : [];
        }
        return countsCache;
      };

      vm.selectSkill = function (skill) {
        vm.selectedNode = {
          id: 'skill:' + skill.name.toLowerCase().replace(/[^a-z0-9+#]/g, ''),
          label: skill.name,
          type: 'skills',
          group: 'Skill',
          meta: skill.category,
          ref: skill
        };
      };

      vm.selectedRow = null;
      vm.toggleRow = function (skill) {
        vm.selectedRow = vm.selectedRow === skill.id ? null : skill.id;
        if (vm.selectedRow) vm.selectSkill(skill);
      };
    }]);

})(angular);
