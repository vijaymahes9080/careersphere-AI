/**
 * CareerSphere AI — Main Controller
 * Role-aware navigation, authentication status, global modal handlers,
 * theme switching, "Analyze My Career" flow, toasts.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    .controller('MainController', [
      '$scope',
      '$location',
      'ProfileService',
      'AuthService',
      'NotificationService',
      function ($scope, $location, ProfileService, AuthService, NotificationService) {
        var vm = this;

        vm.state = ProfileService.state;
        vm.toasts = NotificationService.toasts;

        // ── Authentication & Role Helpers ─────────────────────────────
        vm.currentUser = function () {
          return AuthService.getCurrentUser();
        };

        vm.isLoggedIn = function () {
          return AuthService.isAuthenticated();
        };

        vm.isAdmin = function () {
          return AuthService.isAdmin();
        };

        vm.logout = function () {
          AuthService.logout();
          ProfileService.switchUser(null);
          NotificationService.info('You have been signed out.');
          $location.path('/login');
        };

        // ── Dynamic Role-Aware Navigation ─────────────────────────────
        var userNav = [
          { path: '/overview', label: 'Overview', icon: '◉' },
          { path: '/skills', label: 'Skill Intelligence', icon: '◈' },
          { path: '/career-map', label: 'Career Map', icon: '◍' },
          { path: '/projects', label: 'Projects', icon: '▣' },
          { path: '/learning', label: 'Learning & Goals', icon: '◐' },
          { path: '/opportunities', label: 'Opportunities', icon: '◆' },
          { path: '/evidence', label: 'Evidence', icon: '✓' },
          { path: '/data-center', label: 'Data Center', icon: '▤' },
          { path: '/reports', label: 'Reports', icon: '▥' },
          { path: '/settings', label: 'Settings', icon: '⚙' }
        ];

        var adminNav = [
          { path: '/admin', label: 'Admin Dashboard', icon: '⛊' },
          { path: '/admin-users', label: 'User Management', icon: '👥' },
          { path: '/admin-activity', label: 'Audit Activity', icon: '📋' },
          { path: '/settings', label: 'Platform Settings', icon: '⚙' }
        ];

        var guestNav = [
          { path: '/login', label: 'Sign In', icon: '→' },
          { path: '/register', label: 'Create Account', icon: '+' }
        ];

        vm.getNav = function () {
          var user = AuthService.getCurrentUser();
          if (!user) return guestNav;
          if (user.role === 'admin') return adminNav;
          return userNav;
        };

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
         * "Analyze My Career" — runs the pipeline and shows report
         */
        vm.analyze = function () {
          vm.analyzing = true;
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
          return (vm.state.datasets && vm.state.datasets.length > 0) ||
            (vm.state.customSkills && vm.state.customSkills.length > 0) ||
            (vm.state.customProjects && vm.state.customProjects.length > 0);
        };

        vm.hasDemo = function () {
          return vm.state.datasets && vm.state.datasets.some(function (d) { return d.isDemo; });
        };

        // ── Global Modals for Interactive User Actions ───────────────

        // 1. Add Skill Modal
        vm.showAddSkillModal = false;
        vm.newSkill = { name: '', category: 'Programming Languages', level: 'Intermediate', confidence: 'Confirmed' };
        vm.openAddSkill = function () {
          vm.newSkill = { name: '', category: 'Programming Languages', level: 'Intermediate', confidence: 'Confirmed' };
          vm.showAddSkillModal = true;
        };
        vm.closeAddSkill = function () {
          vm.showAddSkillModal = false;
        };
        vm.submitAddSkill = function () {
          if (!vm.newSkill.name || !vm.newSkill.name.trim()) {
            NotificationService.warn('Skill name is required.');
            return;
          }
          ProfileService.addCustomSkill(vm.newSkill);
          vm.closeAddSkill();
        };

        // 2. Add Project Modal
        vm.showAddProjectModal = false;
        vm.newProject = { name: '', description: '', technologies: '', domain: 'Software Engineering', complexity: 'Moderate' };
        vm.openAddProject = function () {
          vm.newProject = { name: '', description: '', technologies: '', domain: 'Software Engineering', complexity: 'Moderate' };
          vm.showAddProjectModal = true;
        };
        vm.closeAddProject = function () {
          vm.showAddProjectModal = false;
        };
        vm.submitAddProject = function () {
          if (!vm.newProject.name || !vm.newProject.name.trim()) {
            NotificationService.warn('Project name is required.');
            return;
          }
          ProfileService.addCustomProject(vm.newProject);
          vm.closeAddProject();
        };

        // 3. Add Goal Modal
        vm.showAddGoalModal = false;
        vm.newGoal = { title: '', targetRole: '', progress: 25, deadline: '' };
        vm.openAddGoal = function () {
          var defaultRole = (vm.state.profile && vm.state.profile.targetRoles && vm.state.profile.targetRoles[0])
            ? vm.state.profile.targetRoles[0].title
            : 'Software Engineer';
          vm.newGoal = { title: '', targetRole: defaultRole, progress: 25, deadline: '' };
          vm.showAddGoalModal = true;
        };
        vm.closeAddGoal = function () {
          vm.showAddGoalModal = false;
        };
        vm.submitAddGoal = function () {
          if (!vm.newGoal.title || !vm.newGoal.title.trim()) {
            NotificationService.warn('Goal title is required.');
            return;
          }
          ProfileService.addGoal(vm.newGoal);
          vm.closeAddGoal();
        };

        // 4. Edit Profile Modal
        vm.showEditProfileModal = false;
        vm.editProfileData = { name: '', summary: '', targetRole: '', education: '', institution: '', location: '', phone: '' };
        vm.openEditProfile = function () {
          var id = (vm.state.profile && vm.state.profile.identity) || {};
          var edu = (vm.state.profile && vm.state.profile.education && vm.state.profile.education[0]) || {};
          var role = (vm.state.profile && vm.state.profile.targetRoles && vm.state.profile.targetRoles[0]) || {};

          vm.editProfileData = {
            name: id.name || '',
            summary: id.summary || '',
            targetRole: role.title || '',
            education: edu.name || '',
            institution: edu.institution || '',
            location: id.location || '',
            phone: id.phone || ''
          };
          vm.showEditProfileModal = true;
        };
        vm.closeEditProfile = function () {
          vm.showEditProfileModal = false;
        };
        vm.submitEditProfile = function () {
          ProfileService.updateProfileIdentity(vm.editProfileData);
          vm.closeEditProfile();
        };
      }
    ]);

})(angular);
