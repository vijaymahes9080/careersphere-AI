/**
 * CareerSphere AI — Application bootstrap
 * AngularJS module definitions, role-based routes, guards, and runtime setup.
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
        // ── Public Authentication Routes ─────────────────────────────
        .when('/login', {
          templateUrl: 'views/login.html',
          controller: 'LoginController',
          controllerAs: 'vm',
          public: true
        })
        .when('/register', {
          templateUrl: 'views/register.html',
          controller: 'RegisterController',
          controllerAs: 'vm',
          public: true
        })

        // ── Authenticated User Routes ────────────────────────────────
        .when('/overview', {
          templateUrl: 'views/overview.html',
          controller: 'OverviewController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/skills', {
          templateUrl: 'views/skills.html',
          controller: 'SkillIntelligenceController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/career-map', {
          templateUrl: 'views/career-map.html',
          controller: 'CareerMapController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/projects', {
          templateUrl: 'views/projects.html',
          controller: 'ProjectsController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/learning', {
          templateUrl: 'views/learning.html',
          controller: 'LearningController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/opportunities', {
          templateUrl: 'views/opportunities.html',
          controller: 'OpportunitiesController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/evidence', {
          templateUrl: 'views/evidence.html',
          controller: 'EvidenceController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/data-center', {
          templateUrl: 'views/data-center.html',
          controller: 'DataCenterController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/reports', {
          templateUrl: 'views/reports.html',
          controller: 'ReportsController',
          controllerAs: 'vm',
          requiresAuth: true
        })
        .when('/settings', {
          templateUrl: 'views/settings.html',
          controller: 'SettingsController',
          controllerAs: 'vm',
          requiresAuth: true
        })

        // ── Authenticated Admin Routes ───────────────────────────────
        .when('/admin', {
          templateUrl: 'views/admin-dashboard.html',
          controller: 'AdminDashboardController',
          controllerAs: 'vm',
          requiresAuth: true,
          adminOnly: true
        })
        .when('/admin-users', {
          templateUrl: 'views/admin-users.html',
          controller: 'AdminUsersController',
          controllerAs: 'vm',
          requiresAuth: true,
          adminOnly: true
        })
        .when('/admin-activity', {
          templateUrl: 'views/admin-activity.html',
          controller: 'AdminActivityController',
          controllerAs: 'vm',
          requiresAuth: true,
          adminOnly: true
        })

        .otherwise({
          redirectTo: '/login'
        });
    }])
    .run(['$rootScope', '$location', 'AuthService', 'ProfileService', 'NotificationService',
      function ($rootScope, $location, AuthService, ProfileService, NotificationService) {

        // Check if there's an active session on boot
        var session = AuthService.getCurrentUser();
        $rootScope.currentUser = session;

        // Initialize user-scoped profile if session exists
        if (session) {
          ProfileService.init(session.userId);
        }

        // Theme handling ($rootScope.profile IS ProfileService.state)
        $rootScope.$watch('profile.settings.theme', function (theme) {
          document.body.classList.toggle('theme-light', theme === 'light');
          document.body.classList.toggle('theme-dark', theme !== 'light');
        });

        $rootScope.profile = ProfileService.state;

        // ── Central Route Authorization Guard ───────────────────────
        $rootScope.$on('$routeChangeStart', function (event, next, current) {
          if (!next || !next.$$route) return;

          var currentUser = AuthService.getCurrentUser();
          $rootScope.currentUser = currentUser;

          // 1. Authenticated user attempting to visit Login or Register
          if (currentUser && next.$$route.public) {
            event.preventDefault();
            if (currentUser.role === 'admin') {
              $location.path('/admin');
            } else {
              $location.path('/overview');
            }
            return;
          }

          // 2. Unauthenticated user trying to access protected routes
          if (!currentUser && !next.$$route.public) {
            event.preventDefault();
            NotificationService.info('Please sign in to access CareerSphere.');
            $location.path('/login');
            return;
          }

          // 3. Normal user trying to access admin-only routes
          if (currentUser && next.$$route.adminOnly && currentUser.role !== 'admin') {
            event.preventDefault();
            NotificationService.warn('Access denied: Administrator privileges required.');
            $location.path('/overview');
            return;
          }
        });
      }
    ]);

})(angular);
