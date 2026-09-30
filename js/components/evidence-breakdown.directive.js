/**
 * CareerSphere AI — Evidence Strength Breakdown Directive
 * Transparent progress breakdown: Resume, Projects, Certificates, Experience.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csEvidenceBreakdown', [function () {
      return {
        restrict: 'E',
        scope: {
          breakdown: '='      // { totalPoints, sources: [{ label, count, points, percent }], verifiedRatio }
        },
        template:
          '<div class="evidence-breakdown-box">' +
          '  <div class="eb-bars-list">' +
          '    <div class="eb-item" ng-repeat="src in breakdown.sources">' +
          '      <div class="eb-item-head">' +
          '        <span class="eb-lbl"><strong>{{src.label}}</strong></span>' +
          '        <span class="eb-val">{{src.percent}}% ({{src.points}} weighted pts)</span>' +
          '      </div>' +
          '      <div class="eb-track">' +
          '        <div class="eb-fill" ng-style="{width: src.percent + \'%\'}"></div>' +
          '      </div>' +
          '      <span class="muted small">{{src.count}} supporting evidence item{{src.count === 1 ? \'\' : \'s\'}}</span>' +
          '    </div>' +
          '  </div>' +
          '  <footer class="eb-footer muted small">' +
          '    <strong>Audit Transparency:</strong> Analytical conclusions are backed by verified evidence citations across your imported datasets.' +
          '  </footer>' +
          '</div>'
      };
    }]);

})(angular);
