/**
 * CareerSphere AI — Career Map Controller
 * Career journey stages, career pathways and the intelligence map.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('CareerMapController', ['ProfileService', function (ProfileService) {
      var vm = this;

      vm.state = ProfileService.state;
      vm.selectedNode = null;

      vm.journey = function () {
        var a = ProfileService.state.analyses;
        return a ? a.journey : [];
      };

      vm.paths = function () {
        var a = ProfileService.state.analyses;
        return a ? a.paths : { paths: [], note: '' };
      };

      vm.intelMap = function () {
        var a = ProfileService.state.analyses;
        return a ? a.intelMap : null;
      };

      vm.network = function () {
        var a = ProfileService.state.analyses;
        return a ? a.network : null;
      };

      vm.onSelect = function (node) {
        vm.selectedNode = node;
      };

      vm.statusLabel = function (status) {
        return { 'done': '✓ Done', 'progress': '◐ In progress', 'not-started': '○ Not started', 'target': '◎ Target' }[status] || status;
      };
    }]);

})(angular);
