/**
 * CareerSphere AI — Evidence Controller
 * Auditable skill → evidence → source view, plus multi-source detection.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('EvidenceController', ['ProfileService', function (ProfileService) {
      var vm = this;

      vm.state = ProfileService.state;
      vm.search = '';

      vm.evidenceList = function () {
        var a = ProfileService.state.analyses;
        if (!a) return [];
        var list = a.evidence.list;
        if (vm.search) {
          var q = vm.search.toLowerCase();
          list = list.filter(function (item) {
            if (item.skill.name.toLowerCase().indexOf(q) > -1) return true;
            return item.entries.some(function (e) {
              return (e.title + ' ' + e.type + ' ' + e.source).toLowerCase().indexOf(q) > -1;
            });
          });
        }
        return list;
      };

      vm.overall = function () {
        var a = ProfileService.state.analyses;
        return a ? a.evidence.overall : null;
      };

      vm.multiSource = function () {
        var a = ProfileService.state.analyses;
        if (!a) return [];
        return a.quality.warnings.filter(function (w) { return w.code === 'MULTI_SOURCE'; });
      };

      vm.noEvidence = function () {
        var a = ProfileService.state.analyses;
        if (!a) return [];
        return a.skill.skills.filter(function (s) { return s.evidenceCount === 0; });
      };

      vm.expanded = null;
      vm.toggle = function (item) {
        vm.expanded = vm.expanded === item ? null : item;
      };

      vm.weights = { 'Project': 3, 'Internship': 4, 'Experience': 4, 'Certificate': 2 };
    }]);

})(angular);
