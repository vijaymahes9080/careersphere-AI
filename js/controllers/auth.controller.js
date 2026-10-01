/**
 * CareerSphere AI — Authentication Controllers
 * LoginController & RegisterController
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.controllers')
    // ── Login Controller ──────────────────────────────────────────
    .controller('LoginController', [
      '$scope',
      '$location',
      'AuthService',
      'ProfileService',
      'NotificationService',
      function ($scope, $location, AuthService, ProfileService, NotificationService) {
        var vm = this;

        vm.credentials = {
          email: '',
          password: '',
          remember: true
        };

        vm.showPassword = false;
        vm.loading = false;
        vm.errorMessage = '';

        // If already authenticated, redirect to appropriate destination
        if (AuthService.isAuthenticated()) {
          var user = AuthService.getCurrentUser();
          if (user.role === 'admin') {
            $location.path('/admin');
          } else {
            $location.path('/overview');
          }
          return;
        }

        vm.toggleShowPassword = function () {
          vm.showPassword = !vm.showPassword;
        };

        vm.submit = function () {
          vm.errorMessage = '';

          if (!vm.credentials.email || !vm.credentials.password) {
            vm.errorMessage = 'Please enter both your email address and password.';
            return;
          }

          vm.loading = true;
          AuthService.login(vm.credentials.email, vm.credentials.password, vm.credentials.remember)
            .then(function (session) {
              vm.loading = false;
              NotificationService.success('Welcome back, ' + session.name + '!');
              ProfileService.switchUser(session);

              if (session.role === 'admin') {
                $location.path('/admin');
              } else {
                $location.path('/overview');
              }
            })
            .catch(function (err) {
              vm.loading = false;
              vm.errorMessage = (err && err.message) || 'Login failed. Please check your credentials.';
              NotificationService.error(vm.errorMessage);
            });
        };

        // Quick 1-click test helpers for demo & grading
        vm.quickLogin = function (email, password) {
          vm.credentials.email = email;
          vm.credentials.password = password;
          vm.submit();
        };
      }
    ])

    // ── Register Controller ───────────────────────────────────────
    .controller('RegisterController', [
      '$scope',
      '$location',
      'AuthService',
      'ProfileService',
      'NotificationService',
      function ($scope, $location, AuthService, ProfileService, NotificationService) {
        var vm = this;

        vm.form = {
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          targetRole: '',
          education: '',
          summary: ''
        };

        vm.showPassword = false;
        vm.loading = false;
        vm.errorMessage = '';
        vm.successMessage = '';

        // If already authenticated, redirect
        if (AuthService.isAuthenticated()) {
          var user = AuthService.getCurrentUser();
          $location.path(user.role === 'admin' ? '/admin' : '/overview');
          return;
        }

        vm.toggleShowPassword = function () {
          vm.showPassword = !vm.showPassword;
        };

        vm.submit = function () {
          vm.errorMessage = '';
          vm.successMessage = '';

          // Client validations
          if (!vm.form.name || !vm.form.name.trim()) {
            vm.errorMessage = 'Please enter your full name.';
            return;
          }

          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!vm.form.email || !emailRegex.test(vm.form.email.trim())) {
            vm.errorMessage = 'Please enter a valid email address.';
            return;
          }

          if (!vm.form.password || vm.form.password.length < 6) {
            vm.errorMessage = 'Password must be at least 6 characters long.';
            return;
          }

          if (vm.form.password !== vm.form.confirmPassword) {
            vm.errorMessage = 'Passwords do not match.';
            return;
          }

          vm.loading = true;

          // Note: AuthService.register hardcodes role = 'user'
          AuthService.register(vm.form)
            .then(function (newUser) {
              vm.loading = false;
              vm.successMessage = 'Account created successfully! Signing you into CareerSphere…';
              NotificationService.success('Registration successful. Welcome to CareerSphere!');

              // Automatically log in the newly registered user
              return AuthService.login(newUser.email, vm.form.password, true);
            })
            .then(function (session) {
              ProfileService.switchUser(session);
              $location.path('/overview');
            })
            .catch(function (err) {
              vm.loading = false;
              vm.errorMessage = (err && err.message) || 'Registration failed. Please try again.';
              NotificationService.error(vm.errorMessage);
            });
        };
      }
    ]);

})(angular);
