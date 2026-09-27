/**
 * CareerSphere AI — Main Controller
 * Navigation, theme, "Analyze My Career" flow, toasts.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('MainController', [
      '$scope',
      '$location',
      'ProfileService',
      'NotificationService',
      function ($scope, $location, ProfileService, NotificationService) {
        var vm = this;

        vm.state = ProfileService.state;
        vm.toasts = NotificationService.toasts;

        vm.nav = [
          { path: '/overview', label: 'Overview', icon: '◉' },
          { path: '/skills', label: 'Skill Intelligence', icon: '◈' },
          { path: '/career-map', label: 'Career Map', icon: '◍' },
          { path: '/projects', label: 'Projects', icon: '▣' },
          { path: '/learning', label: 'Learning', icon: '◐' },
          { path: '/opportunities', label: 'Opportunities', icon: '◆' },
          { path: '/evidence', label: 'Evidence', icon: '✓' },
          { path: '/data-center', label: 'Data Center', icon: '▤' },
          { path: '/reports', label: 'Reports', icon: '▥' },
          { path: '/settings', label: 'Settings', icon: '⚙' }
        ];

        vm.isActive = function (path) {
          return $location.path() === path;
        };

        vm.isLight = function () {
          return vm.state.settings.theme === 'light';
        };

        vm.toggleTheme = function () {
          ProfileService.setTheme(vm.isLight() ? 'dark' : 'light');
        };

        vm.showReport = false;
        vm.analyzing = false;

        /**
         * "Analyze My Career" — runs the full pipeline and shows the
         * transparent analysis report.
         */
        vm.analyze = function () {
          vm.analyzing = true;
          // Debounce heavy work one tick so the UI can show the busy state
          setTimeout(function () {
            try {
              vm.report = ProfileService.analyzeMyCareer();
              vm.showReport = true;
              NotificationService.success('Analysis complete — review "What CareerSphere found".');
            } catch (e) {
              NotificationService.error('Analysis failed: ' + e.message);
              console.error(e);
            }
            vm.analyzing = false;
            $scope.$applyAsync();
          }, 30);
        };

        vm.closeReport = function () {
          vm.showReport = false;
        };

        /**
         * Skip link: move focus straight to <main>. The default anchor jump is
         * prevented because "#main-content" is not a route — letting it run
         * would trigger the otherwise → /overview redirect.
         */
        vm.skipToMain = function ($event) {
          if ($event) $event.preventDefault();
          var main = document.getElementById('main-content');
          if (main) {
            main.focus();
            main.scrollIntoView();
          }
        };

        vm.dismissToast = function (id) {
          NotificationService.remove(id);
        };

        vm.hasData = function () {
          return vm.state.datasets.length > 0;
        };

        vm.hasDemo = function () {
          return vm.state.datasets.some(function (d) { return d.isDemo; });
        };
      }
    ]);

})(angular);
