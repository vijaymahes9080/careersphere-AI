/**
 * CareerSphere AI — Application bootstrap
 * AngularJS module definitions, routes and runtime setup.
 *
 * Load this file BEFORE models/services/controllers.
 */
(function (angular) {
  'use strict';

  // Module definitions (must exist before service/controller registration)
  angular.module('careerSphere.services', []);
  angular.module('careerSphere.controllers', []);
  angular.module('careerSphere.components', []);

  angular.module('careerSphereApp', [
    'ngRoute',
    'careerSphere.models',
    'careerSphere.services',
    'careerSphere.controllers',
    'careerSphere.components'
  ])
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
      // Use plain "#/path" URLs so every href="#/..." nav link routes correctly
      $locationProvider.hashPrefix('');

      $routeProvider
        .when('/overview', { templateUrl: 'views/overview.html', controller: 'OverviewController', controllerAs: 'vm' })
        .when('/skills', { templateUrl: 'views/skills.html', controller: 'SkillIntelligenceController', controllerAs: 'vm' })
        .when('/career-map', { templateUrl: 'views/career-map.html', controller: 'CareerMapController', controllerAs: 'vm' })
        .when('/projects', { templateUrl: 'views/projects.html', controller: 'ProjectsController', controllerAs: 'vm' })
        .when('/learning', { templateUrl: 'views/learning.html', controller: 'LearningController', controllerAs: 'vm' })
        .when('/opportunities', { templateUrl: 'views/opportunities.html', controller: 'OpportunitiesController', controllerAs: 'vm' })
        .when('/evidence', { templateUrl: 'views/evidence.html', controller: 'EvidenceController', controllerAs: 'vm' })
        .when('/data-center', { templateUrl: 'views/data-center.html', controller: 'DataCenterController', controllerAs: 'vm' })
        .when('/reports', { templateUrl: 'views/reports.html', controller: 'ReportsController', controllerAs: 'vm' })
        .when('/settings', { templateUrl: 'views/settings.html', controller: 'SettingsController', controllerAs: 'vm' })
        .otherwise({ redirectTo: '/overview' });
    }])
    .run(['$rootScope', 'ProfileService', function ($rootScope, ProfileService) {
      // Initialize the pipeline (restores saved data if any)
      ProfileService.init();

      // Theme handling ($rootScope.profile IS ProfileService.state)
      $rootScope.$watch('profile.settings.theme', function (theme) {
        document.body.classList.toggle('theme-light', theme === 'light');
        document.body.classList.toggle('theme-dark', theme !== 'light');
      });

      $rootScope.profile = ProfileService.state;
    }]);

})(angular);
