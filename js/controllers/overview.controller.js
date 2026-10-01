/**
 * CareerSphere AI — Overview Controller
 * Upgraded Career Intelligence Command Center:
 * Global filters, KPI cards, Next 3 Actions, Career 360, Skill Radar,
 * Skill Strength Bars, Skill Gap Analysis, Role Matching, Fit Matrix,
 * Pathway Graph, Tripartite Skill Network, Project-Role Map, Learning Roadmap,
 * Readiness Gauge, Evidence Breakdown, and Data Quality Audit.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('OverviewController', ['ProfileService', '$scope', function (ProfileService, $scope) {
      var vm = this;

      vm.state = ProfileService.state;

      // ── Filter State ────────────────────────────────────────────────
      vm.filterCategory = 'All';
      vm.filterLevel = 'All';
      vm.selectedRoleId = '';

      vm.setCategory = function (cat) {
        vm.filterCategory = cat;
      };

      vm.setLevel = function (lvl) {
        vm.filterLevel = lvl;
      };

      vm.setRole = function (role) {
        if (!role) return;
        var rid = typeof role === 'string' ? role : (role.id || ('role:' + role.title.toLowerCase().replace(/[^a-z0-9]/g, '_')));
        ProfileService.updateSettings({ selectedRoleId: rid });
      };

      vm.resetFilters = function () {
        vm.filterCategory = 'All';
        vm.filterLevel = 'All';
      };

      // ── Accessors ───────────────────────────────────────────────────
      vm.analyses = function () { return ProfileService.state.analyses; };
      vm.profile = function () { return ProfileService.state.profile; };

      vm.hasData = function () {
        return (ProfileService.state.datasets && ProfileService.state.datasets.length > 0) ||
          (ProfileService.state.profile && ProfileService.state.profile.skills && ProfileService.state.profile.skills.length > 0) ||
          (ProfileService.state.customSkills && ProfileService.state.customSkills.length > 0) ||
          (ProfileService.state.customProjects && ProfileService.state.customProjects.length > 0);
      };

      vm.demoActive = function () {
        return ProfileService.state.datasets.some(function (d) { return d.isDemo; });
      };

      // ── Available Filter Options ────────────────────────────────────
      vm.categories = function () {
        var a = ProfileService.state.analyses;
        if (!a || !a.skill || !a.skill.categories) return ['All'];
        var cats = ['All'];
        a.skill.categories.forEach(function (c) {
          if (cats.indexOf(c.category) === -1) cats.push(c.category);
        });
        return cats;
      };

      vm.levels = ['All', 'Advanced', 'Intermediate', 'Beginner', 'Unverified'];

      // ── Filtered Skills ─────────────────────────────────────────────
      vm.filteredSkills = function () {
        var a = ProfileService.state.analyses;
        if (!a || !a.skill || !a.skill.skills) return [];
        return a.skill.skills.filter(function (s) {
          var matchCat = vm.filterCategory === 'All' || s.category === vm.filterCategory;
          var matchLvl = true;
          if (vm.filterLevel === 'Unverified') {
            matchLvl = !s.level;
          } else if (vm.filterLevel !== 'All') {
            matchLvl = s.level && s.level.toLowerCase() === vm.filterLevel.toLowerCase();
          }
          return matchCat && matchLvl;
        });
      };

      // ── Radar Data (Category Strength) ──────────────────────────────
      vm.radarData = function () {
        var a = ProfileService.state.analyses;
        if (!a || !a.skill || !a.skill.radar) return { labels: [], values: [] };
        if (vm.filterCategory === 'All') return a.skill.radar;

        // Filter to selected category
        var cats = a.skill.categories.filter(function (c) { return c.category === vm.filterCategory; });
        return {
          labels: cats.map(function (c) { return c.category; }),
          values: cats.map(function (c) { return c.avgStrength; })
        };
      };

      // ── KPI Cards ───────────────────────────────────────────────────
      vm.kpis = function () {
        var a = ProfileService.state.analyses;
        var p = ProfileService.state.profile;
        if (!a || !vm.hasData()) {
          return [
            { label: 'CAREER READINESS', value: 'No data available', sub: 'Composite score across 5 factors', tone: 'accent' },
            { label: 'SKILL COVERAGE', value: 'No data available', sub: 'Against selected target role', tone: 'good' },
            { label: 'ROLE MATCH', value: 'No data available', sub: 'Top target career fit', tone: 'cyan' },
            { label: 'SKILL GAPS', value: '0', sub: 'Identified unmet requirements', tone: 'warn' },
            { label: 'PROJECT EVIDENCE', value: '0', sub: 'Demonstrated skills portfolio', tone: 'good' },
            { label: 'EVIDENCE STRENGTH', value: 'No data available', sub: 'Verified source citations', tone: 'accent' }
          ];
        }

        var readinessVal = a.readiness ? a.readiness.value + '%' : 'No data available';
        var coverageVal = a.coverage && a.coverage.coveragePercent !== null ? a.coverage.coveragePercent + '%' : 'No data available';

        var topRole = (a.roleMatches && a.roleMatches.length) ? a.roleMatches[0] : null;
        var roleMatchVal = topRole ? topRole.coveragePercent + '%' : (coverageVal !== 'No data available' ? coverageVal : 'No data available');
        var roleMatchSub = topRole ? ('Top match: ' + topRole.title) : 'Define target role in settings';

        var gapCount = 0;
        if (a.coverage && a.coverage.counts) {
          gapCount = a.coverage.counts.MISSING + a.coverage.counts.PARTIAL + a.coverage.counts.UNVERIFIED;
        }

        var projCount = a.project ? a.project.stats.total : (p.projects ? p.projects.length : 0);
        var evidenceVal = a.evidence && a.evidence.overall ? a.evidence.overall.score + '%' : 'No data available';

        return [
          { label: 'CAREER READINESS', value: readinessVal, sub: 'Analytical estimate composite', tone: 'accent', note: 'Based on 5 weighted pillars' },
          { label: 'SKILL COVERAGE', value: coverageVal, sub: a.coverage && a.coverage.role ? a.coverage.role.title : 'Selected target role', tone: 'good' },
          { label: 'ROLE MATCH', value: roleMatchVal, sub: roleMatchSub, tone: 'cyan' },
          { label: 'SKILL GAPS', value: String(gapCount), sub: gapCount ? (gapCount + ' skills to develop') : 'All requirements met', tone: gapCount > 0 ? 'warn' : 'good' },
          { label: 'PROJECT EVIDENCE', value: String(projCount), sub: projCount ? (projCount + ' verified projects') : 'Import project repos', tone: 'good' },
          { label: 'EVIDENCE STRENGTH', value: evidenceVal, sub: (a.skill ? a.skill.stats.withEvidence : 0) + ' skills with audit proof', tone: 'accent' }
        ];
      };

      // ── Top 3 Actions ───────────────────────────────────────────────
      vm.nextActions = function () {
        var a = ProfileService.state.analyses;
        return a ? (a.nextActions || []) : [];
      };

      // ── Role Matches & Fit Matrix ───────────────────────────────────
      vm.roleMatches = function () {
        var a = ProfileService.state.analyses;
        return a ? (a.roleMatches || []) : [];
      };

      vm.fitMatrix = function () {
        var a = ProfileService.state.analyses;
        return a ? (a.fitMatrix || { high: [], medium: [], low: [], all: [] }) : { high: [], medium: [], low: [], all: [] };
      };

      // ── Skill Gaps ──────────────────────────────────────────────────
      vm.selectedRoleCoverage = function () {
        var a = ProfileService.state.analyses;
        return a ? a.coverage : null;
      };

      vm.gapsList = function () {
        var cov = vm.selectedRoleCoverage();
        if (!cov || !cov.missingSkills) return [];
        return cov.missingSkills;
      };

      // ── Career 360 & Pathways ───────────────────────────────────────
      vm.career360Data = function () {
        var a = ProfileService.state.analyses;
        return a ? a.career360 : null;
      };

      vm.pathwayTree = function () {
        var a = ProfileService.state.analyses;
        return (a && a.paths) ? a.paths.tree : null;
      };

      // ── Project Map & Network ───────────────────────────────────────
      vm.projectMap = function () {
        var a = ProfileService.state.analyses;
        return a ? (a.projectMap || []) : [];
      };

      vm.networkData = function () {
        var a = ProfileService.state.analyses;
        return a ? a.network : null;
      };

      // ── Roadmap & Quality ───────────────────────────────────────────
      vm.stageRoadmap = function () {
        var a = ProfileService.state.analyses;
        return a ? (a.stageRoadmap || []) : [];
      };

      vm.evidenceBreakdown = function () {
        var a = ProfileService.state.analyses;
        return a ? a.evidenceBreakdown : null;
      };

      vm.dataQualityMetrics = function () {
        var a = ProfileService.state.analyses;
        return a ? a.dataQualityMetrics : null;
      };

      // ── Intelligence Map & Node Selection ───────────────────────────
      vm.intelMap = function () {
        var a = ProfileService.state.analyses;
        return a ? a.intelMap : null;
      };

      vm.selectedNode = null;
      vm.onSelectNode = function (node) {
        vm.selectedNode = node;
      };

      // ── Header / Profile Summary Helpers ────────────────────────────
      vm.primaryTargetRole = function () {
        var a = ProfileService.state.analyses;
        if (a && a.coverage && a.coverage.role) return a.coverage.role.title;
        var roles = ProfileService.state.profile.targetRoles;
        return roles.length ? roles[0].title : null;
      };

      vm.directionText = function () {
        var p = ProfileService.state.profile;
        if (p.targetRoles.length) {
          return p.targetRoles.map(function (r) { return r.title; }).join(' · ');
        }
        return p.careerGoals.length ? p.careerGoals[0] : '—';
      };

      // ── Actions ─────────────────────────────────────────────────────
      vm.loadDemoData = function () {
        ProfileService.loadDemo();
      };
    }]);

})(angular);
