/**
 * CareerSphere AI — Metric Ring (circular SVG progress indicator).
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csRing', [function () {
      return {
        restrict: 'E',
        scope: {
          value: '=',   // 0-100 or null
          label: '@',
          note: '@',
          size: '@'
        },
        template:
          '<div class="ring-wrap" ng-class="sizeClass">' +
          '  <svg viewBox="0 0 120 120" role="img" aria-label="{{label}}: {{display}}">' +
          '    <circle cx="60" cy="60" r="50" class="ring-track"/>' +
          '    <circle cx="60" cy="60" r="50" class="ring-value" ng-style="{strokeDasharray: dash, strokeDashoffset: offset}" transform="rotate(-90 60 60)"/>' +
          '    <text x="60" y="66" text-anchor="middle" class="ring-text">{{display}}</text>' +
          '  </svg>' +
          '  <div class="ring-label" ng-if="label">{{label}}</div>' +
          '  <div class="ring-note" ng-if="note">{{note}}</div>' +
          '</div>',
        link: function (scope) {
          scope.sizeClass = 'ring-' + (scope.size || 'md');
          scope.$watch('value', function (v) {
            if (v === null || v === undefined || isNaN(v)) {
              scope.display = '—';
              scope.dash = '314 314';
              scope.offset = 314;
            } else {
              var val = Math.max(0, Math.min(100, v));
              scope.display = Math.round(val) + '%';
              var C = 2 * Math.PI * 50; // ≈ 314
              scope.dash = C + ' ' + C;
              scope.offset = C * (1 - val / 100);
            }
          });
        }
      };
    }]);

})(angular);
