/**
 * CareerSphere AI — Projects Controller
 * Project intelligence: skills demonstrated, roles, complexity,
 * missing documentation, improvements + project-to-skill graph.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('ProjectsController', ['ProfileService', function (ProfileService) {
      var vm = this;

      vm.state = ProfileService.state;
      vm.search = '';
      vm.selectedProject = null;
      vm.selectedNode = null;

      vm.projects = function () {
        var a = ProfileService.state.analyses;
        if (!a) return [];
        var list = a.project.projects.slice();
        if (vm.search) {
          var q = vm.search.toLowerCase();
          list = list.filter(function (p) {
            return p.name.toLowerCase().indexOf(q) > -1 ||
              (p.description || '').toLowerCase().indexOf(q) > -1 ||
              (p.technologies || []).join(' ').toLowerCase().indexOf(q) > -1;
          });
        }
        return list;
      };

      vm.stats = function () {
        var a = ProfileService.state.analyses;
        return a ? a.project.stats : null;
      };

      vm.network = function () {
        var a = ProfileService.state.analyses;
        return a ? a.network : null;
      };

      vm.expand = function (p) {
        vm.selectedProject = vm.selectedProject === p ? null : p;
        if (vm.selectedProject) {
          vm.selectedNode = {
            id: 'project:' + p.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
            label: p.name,
            type: 'projects',
            group: 'Project',
            ref: p
          };
        }
      };

      vm.onSelectNetwork = function (node) {
        vm.selectedNode = node;
      };

      vm.hasData = function () {
        var a = ProfileService.state.analyses;
        return a && a.project.projects.length > 0;
      };

      vm.deleteProject = function (name, $event) {
        if ($event) $event.stopPropagation();
        if (confirm('Remove project "' + name + '" from your profile?')) {
          ProfileService.deleteProject(name);
          if (vm.selectedProject && vm.selectedProject.name === name) {
            vm.selectedProject = null;
          }
        }
      };
    }]);

})(angular);
