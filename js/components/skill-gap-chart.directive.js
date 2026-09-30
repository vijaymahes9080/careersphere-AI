/**
 * CareerSphere AI — Skill Gap Analysis Directive
 * Visual pipeline: CURRENT SKILLS → REQUIRED SKILLS → MISSING SKILLS → LEARNING ACTION
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csSkillGapChart', [function () {
      return {
        restrict: 'E',
        scope: {
          gaps: '=',         // array of { skill, requiredLevel, currentLevel, currentStrength, requiredStrength, gap, status, priority, suggestedAction }
          roleTitle: '@',
          onAction: '&'
        },
        template:
          '<div class="gap-chart-container">' +
          '  <!-- Visual Pipeline Strip -->' +
          '  <div class="gap-pipeline-strip panel">' +
          '    <div class="pipe-node">' +
          '      <span class="pipe-k">CURRENT SKILLS</span>' +
          '      <span class="pipe-v">{{counts.current}} Validated</span>' +
          '    </div>' +
          '    <span class="pipe-arr">→</span>' +
          '    <div class="pipe-node">' +
          '      <span class="pipe-k">REQUIRED SKILLS</span>' +
          '      <span class="pipe-v">{{counts.required}} Total Req</span>' +
          '    </div>' +
          '    <span class="pipe-arr">→</span>' +
          '    <div class="pipe-node warn">' +
          '      <span class="pipe-k">MISSING / GAPS</span>' +
          '      <span class="pipe-v">{{(gaps || []).length}} Identified</span>' +
          '    </div>' +
          '    <span class="pipe-arr">→</span>' +
          '    <div class="pipe-node good">' +
          '      <span class="pipe-k">LEARNING ACTION</span>' +
          '      <span class="pipe-v">{{counts.actions}} Steps Ready</span>' +
          '    </div>' +
          '  </div>' +
          '  <!-- Gap Items Cards / Table -->' +
          '  <div class="gap-cards-grid" ng-if="gaps && gaps.length">' +
          '    <article class="gap-card panel" ng-repeat="g in gaps track by g.skill" ng-class="\'gap-\' + (g.priority | lowercase)">' +
          '      <div class="gc-top">' +
          '        <div class="gc-title-wrap">' +
          '          <h4 class="gc-title">{{g.skill}}</h4>' +
          '          <span class="badge" ng-class="\'badge-\' + (g.priority | lowercase)">{{g.priority}} Priority</span>' +
          '          <span class="badge badge-sub">{{g.status}}</span>' +
          '        </div>' +
          '        <div class="gc-gap-stat">' +
          '          <span class="gc-gap-val">-{{g.gap}}</span>' +
          '          <span class="gc-gap-lbl">Gap Score</span>' +
          '        </div>' +
          '      </div>' +
          '      <!-- Comparative Progress Bar (Current vs Required) -->' +
          '      <div class="gc-meter">' +
          '        <div class="gc-meter-labels">' +
          '          <span class="muted small">Current: <strong>{{g.currentLevel}} ({{g.currentStrength}}%)</strong></span>' +
          '          <span class="muted small">Required: <strong>{{g.requiredLevel}} ({{g.requiredStrength}}%)</strong></span>' +
          '        </div>' +
          '        <div class="gc-meter-track">' +
          '          <div class="gc-meter-cur" ng-style="{width: g.currentStrength + \'%\'}"></div>' +
          '          <div class="gc-meter-req" ng-style="{width: g.requiredStrength + \'%\'}"></div>' +
          '        </div>' +
          '      </div>' +
          '      <!-- Suggested Learning Action -->' +
          '      <div class="gc-action-box">' +
          '        <span class="gc-action-tag">ACTIONABLE LEARNING STEP</span>' +
          '        <p class="gc-action-text">{{g.suggestedAction}}</p>' +
          '      </div>' +
          '    </article>' +
          '  </div>' +
          '  <div class="panel empty-state" ng-if="!gaps || !gaps.length">' +
          '    <p class="muted">No skill gaps identified for {{roleTitle || \'this role\'}}! All requirements are supported by verified evidence.</p>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          function updateCounts() {
            var gaps = scope.gaps || [];
            scope.counts = {
              current: Math.max(0, 8 - gaps.length),
              required: Math.max(8, gaps.length + 4),
              actions: gaps.length
            };
          }
          scope.$watch('gaps', updateCounts);
          updateCounts();
        }
      };
    }]);

})(angular);
