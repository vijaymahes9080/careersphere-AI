/**
 * CareerSphere AI — Learning Controller
 * Roadmap generated from actual identified gaps, with progress tracking.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('LearningController', ['ProfileService', function (ProfileService) {
      var vm = this;

      vm.state = ProfileService.state;

      vm.plan = function () {
        var a = ProfileService.state.analyses;
        return a ? a.learningPlan : [];
      };

      vm.coverage = function () {
        var a = ProfileService.state.analyses;
        return a ? a.coverage : null;
      };

      vm.progress = function () {
        var plan = vm.plan();
        if (!plan.length) return 0;
        return Math.round((plan.filter(function (t) { return t.done; }).length / plan.length) * 100);
      };

      vm.toggle = function (topic) {
        ProfileService.toggleLearningTopic(topic.id);
      };

      vm.currentSkills = function () {
        var a = ProfileService.state.analyses;
        if (!a) return [];
        return a.skill.skills.filter(function (s) { return s.strength >= 60; }).slice(0, 8);
      };

      vm.gapSkills = function () {
        var c = vm.coverage();
        if (!c || !c.requirements) return [];
        return c.requirements.filter(function (r) {
          return r.status === 'MISSING' || r.status === 'PARTIAL' || r.status === 'UNVERIFIED';
        });
      };

      vm.evidenceMilestones = function () {
        var a = ProfileService.state.analyses;
        if (!a) return [];
        return a.evidence.list.slice(0, 5).map(function (item) {
          return item.skill.name + ' ← ' + item.entries[0].type + ': ' + item.entries[0].title;
        });
      };

      vm.hasRole = function () {
        var c = vm.coverage();
        return !!(c && c.coveragePercent !== null);
      };

      vm.goals = function () {
        return ProfileService.state.goals || [];
      };

      vm.deleteGoal = function (goalId) {
        if (confirm('Delete this career goal?')) {
          ProfileService.deleteGoal(goalId);
        }
      };

      vm.updateGoalProgress = function (goalId, val) {
        ProfileService.updateGoalProgress(goalId, val);
      };
    }]);

})(angular);
