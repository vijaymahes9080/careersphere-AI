/**
 * CareerSphere AI — Career Readiness Gauge Directive
 * Professional donut/gauge with multi-factor breakdown and explicit analytical estimate labeling.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csReadinessGauge', [function () {
      return {
        restrict: 'E',
        scope: {
          readiness: '=',     // { value, factors: [...], note, availableMax, earned }
          hasData: '='
        },
        template:
          '<div class="readiness-gauge-box panel">' +
          '  <div class="gauge-left">' +
          '    <div class="gauge-ring-wrap">' +
          '      <svg viewBox="0 0 200 200" class="gauge-svg" role="img" aria-label="Career readiness score">' +
          '        <defs>' +
          '          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '            <stop offset="0%" stop-color="#4f8cff"/>' +
          '            <stop offset="100%" stop-color="#7c5cff"/>' +
          '          </linearGradient>' +
          '        </defs>' +
          '        <circle cx="100" cy="100" r="82" class="gauge-track"/>' +
          '        <circle cx="100" cy="100" r="82" class="gauge-fill" ' +
          '                ng-style="{strokeDasharray: dash, strokeDashoffset: offset}" ' +
          '                transform="rotate(-90 100 100)"/>' +
          '        <text x="100" y="94" text-anchor="middle" class="gauge-val">{{displayValue}}</text>' +
          '        <text x="100" y="118" text-anchor="middle" class="gauge-sub">Readiness Score</text>' +
          '      </svg>' +
          '    </div>' +
          '    <div class="gauge-badge-wrap">' +
          '      <span class="badge badge-accent">CareerSphere Analytical Estimate</span>' +
          '    </div>' +
          '  </div>' +
          '  <div class="gauge-right">' +
          '    <h4 class="gauge-title">Career Readiness Factors</h4>' +
          '    <p class="muted small">Derived transparently from available profile data — not an external employability promise.</p>' +
          '    <ul class="factor-bars-list" ng-if="readiness && readiness.factors.length">' +
          '      <li ng-repeat="f in readiness.factors" class="factor-bar-item" ng-class="{\'excluded\': f.excluded}">' +
          '        <div class="fb-head">' +
          '          <span class="fb-lbl">{{f.label}}</span>' +
          '          <span class="fb-val">{{f.excluded ? \'Excluded (no data)\' : (f.score + \' / \' + f.max + \' pts\')}}</span>' +
          '        </div>' +
          '        <div class="fb-track">' +
          '          <div class="fb-fill" ng-style="{width: f.excluded ? \'0%\' : ((f.score / f.max) * 100) + \'%\'}"></div>' +
          '        </div>' +
          '        <span class="fb-desc muted small">{{f.detail}}</span>' +
          '      </li>' +
          '    </ul>' +
          '    <div class="empty-state" ng-if="!readiness || !readiness.factors.length">' +
          '      <p class="muted">No data available. Import datasets to calculate career readiness.</p>' +
          '    </div>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          var C = 2 * Math.PI * 82; // ≈ 515.22

          scope.$watch('readiness.value', function (val) {
            if (val === null || val === undefined || isNaN(val) || !scope.hasData) {
              scope.displayValue = '—';
              scope.dash = C + ' ' + C;
              scope.offset = C;
            } else {
              var v = Math.max(0, Math.min(100, val));
              scope.displayValue = v + '%';
              scope.dash = C + ' ' + C;
              scope.offset = C * (1 - v / 100);
            }
          });
        }
      };
    }]);

})(angular);
