/**
 * CareerSphere AI — Career 360° View Directive
 * An interactive circular radar/hub connecting:
 * Current Skills, Projects, Experience, Education, Career Roles, Skill Gaps, Learning, Evidence.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csCareer360', [function () {
      return {
        restrict: 'E',
        scope: {
          data: '=',        // { center: { title, readiness, label, note }, facets: [...] }
          onSelect: '&'
        },
        template:
          '<div class="c360-container">' +
          '  <div class="c360-visual">' +
          '    <svg viewBox="0 0 680 620" class="c360-svg" role="img" aria-label="Career 360 degree connected view">' +
          '      <defs>' +
          '        <radialGradient id="c360Grad" cx="50%" cy="50%" r="50%">' +
          '          <stop offset="0%" stop-color="#4f8cff" stop-opacity="0.22"/>' +
          '          <stop offset="100%" stop-color="#7c5cff" stop-opacity="0.04"/>' +
          '        </radialGradient>' +
          '        <filter id="c360Glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
          '      </defs>' +
          // Background Rings
          '      <circle cx="340" cy="310" r="230" class="c360-ring-outer"/>' +
          '      <circle cx="340" cy="310" r="160" class="c360-ring-mid"/>' +
          '      <circle cx="340" cy="310" r="95" fill="url(#c360Grad)"/>' +
          // Connecting Spoke Lines
          '      <g class="c360-spokes">' +
          '        <line ng-repeat="f in layoutFacets" x1="340" y1="310" ng-attr-x2="{{f.x}}" ng-attr-y2="{{f.y}}" class="c360-spoke" ng-class="{\'active\': selectedFacet === f.id}"/>' +
          '      </g>' +
          // Center Core (Career Readiness Hub)
          '      <g class="c360-center" ng-click="selectCenter()">' +
          '        <circle cx="340" cy="310" r="76" class="c360-core-circle"/>' +
          '        <text x="340" y="292" text-anchor="middle" class="c360-core-val">{{data.center.readiness}}%</text>' +
          '        <text x="340" y="312" text-anchor="middle" class="c360-core-lbl">{{data.center.label}}</text>' +
          '        <text x="340" y="328" text-anchor="middle" class="c360-core-sub muted">Analytical Estimate</text>' +
          '      </g>' +
          // 8 Surrounding Facet Nodes
          '      <g ng-repeat="f in layoutFacets" class="c360-facet-node" ng-click="pick(f)" role="button" tabindex="0" ng-keydown="key($event, f)">' +
          '        <circle ng-attr-cx="{{f.x}}" ng-attr-cy="{{f.y}}" r="38" class="c360-facet-circle" ng-class="[f.status, {\'active\': selectedFacet === f.id}]"/>' +
          '        <text ng-attr-x="{{f.x}}" ng-attr-y="{{f.y - 10}}" text-anchor="middle" class="c360-facet-icon">{{f.icon}}</text>' +
          '        <text ng-attr-x="{{f.x}}" ng-attr-y="{{f.y + 8}}" text-anchor="middle" class="c360-facet-title">{{f.label}}</text>' +
          '        <text ng-attr-x="{{f.x}}" ng-attr-y="{{f.y + 22}}" text-anchor="middle" class="c360-facet-metric">{{f.metric}}</text>' +
          '      </g>' +
          '    </svg>' +
          '  </div>' +
          '  <!-- Selected Facet Drawer / Detail Strip -->' +
          '  <div class="c360-detail-strip panel" ng-if="activeFacet">' +
          '    <div class="c360-detail-head">' +
          '      <span class="badge" ng-class="activeFacet.status">{{activeFacet.status | uppercase}}</span>' +
          '      <h4>{{activeFacet.icon}} {{activeFacet.label}}</h4>' +
          '      <span class="c360-detail-metric">{{activeFacet.metric}}</span>' +
          '    </div>' +
          '    <p class="c360-detail-sub">{{activeFacet.sub}}</p>' +
          '    <p class="muted small">This dimension feeds directly into your overall Career Readiness analytical estimate.</p>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          var CX = 340, CY = 310, R = 230;
          scope.selectedFacet = null;
          scope.activeFacet = null;

          function compute() {
            var facets = (scope.data && scope.data.facets) || [];
            var n = facets.length || 8;
            scope.layoutFacets = facets.map(function (f, i) {
              var angle = (-Math.PI / 2) + (i / n) * Math.PI * 2;
              return angular.extend({}, f, {
                x: Math.round(CX + Math.cos(angle) * R),
                y: Math.round(CY + Math.sin(angle) * R)
              });
            });
            if (scope.layoutFacets.length && !scope.selectedFacet) {
              scope.pick(scope.layoutFacets[0]);
            }
          }

          scope.pick = function (f) {
            scope.selectedFacet = f.id;
            scope.activeFacet = f;
            if (scope.onSelect) {
              scope.onSelect({ facet: f });
            }
          };

          scope.selectCenter = function () {
            scope.selectedFacet = 'center';
            scope.activeFacet = {
              label: 'Overall Career Readiness',
              icon: '◉',
              status: 'good',
              metric: (scope.data && scope.data.center ? scope.data.center.readiness : 0) + '% Analytical Estimate',
              sub: 'A composite of Profile Completeness, Skill Strength, Evidence Strength, Target-Role Coverage, and Project Strength.'
            };
          };

          scope.key = function (evt, f) {
            if (evt.key === 'Enter' || evt.key === ' ') {
              evt.preventDefault();
              scope.pick(f);
            }
          };

          scope.$watch('data', compute, true);
          compute();
        }
      };
    }]);

})(angular);
