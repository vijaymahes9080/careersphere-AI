/**
 * CareerSphere AI — Reports Controller
 * Builds print-ready HTML reports: Career Profile, Skill Report,
 * Skill Gap Report, Project Portfolio, Career Intelligence Summary.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('ReportsController', ['ProfileService', 'ReportService', 'NotificationService', '$sce',
      function (ProfileService, ReportService, NotificationService, $sce) {
        var vm = this;

        vm.state = ProfileService.state;
        vm.selected = 'comprehensive';
        vm.preview = '';
        // iframe srcdoc passes through $sce.getTrusted(HTML, …), which rejects
        // plain strings — expose a trusted view of the same locally generated HTML.
        vm.previewDoc = $sce.trustAsHtml('');

        vm.types = [
          { id: 'comprehensive', label: 'Full Career Intelligence Report (11 Sections)', desc: 'Executive summary, profile, skills, roles, gaps, projects, paths, roadmap, actions, data quality, methodology' },
          { id: 'profile', label: 'Career Profile', desc: 'Identity, education, skills, projects, sources' },
          { id: 'skills', label: 'Skill Report', desc: 'Skill matrix, evidence and readiness factors' },
          { id: 'gaps', label: 'Skill Gap Report', desc: 'Coverage vs target role + learning roadmap' },
          { id: 'projects', label: 'Project Portfolio', desc: 'Projects, skills demonstrated, improvements' }
        ];

        function render() {
          var a = ProfileService.state.analyses;
          vm.preview = ReportService.build(vm.selected, {
            profile: ProfileService.state.profile,
            analyses: angular.extend({}, a, { report: ProfileService.state.report })
          });
          vm.previewDoc = $sce.trustAsHtml(vm.preview);
        }

        vm.select = function (type) {
          vm.selected = type;
          render();
        };

        vm.print = function () {
          render();
          var res = ReportService.print(vm.preview);
          if (res.fallback) {
            NotificationService.warn('Popup blocked — report downloaded as HTML instead.');
          }
        };

        vm.download = function () {
          render();
          ReportService.download(vm.preview, 'careersphere-' + vm.selected + '-report.html');
          NotificationService.success('Report downloaded (print-ready HTML — use your browser to save as PDF).');
        };

        vm.hasData = function () {
          return ProfileService.state.datasets.length > 0;
        };

        render();
      }
    ]);

})(angular);
