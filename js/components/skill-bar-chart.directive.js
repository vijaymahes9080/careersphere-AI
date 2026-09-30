/**
 * CareerSphere AI — Skill Strength Horizontal Bar Chart Directive
 * Interactive horizontal bar chart with dynamic sorting, filtering, and strength tier highlights.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csSkillBarChart', [function () {
      return {
        restrict: 'E',
        scope: {
          skills: '=',       // array of { name, category, level, strength, evidenceCount }
          onSelectSkill: '&'
        },
        template:
          '<div class="skill-bars-container">' +
          '  <div class="skill-bars-toolbar">' +
          '    <div class="sb-sort-row">' +
          '      <span class="muted small">Sort by:</span>' +
          '      <button type="button" class="btn btn-ghost btn-sm" ng-class="{\'btn-primary\': sortBy === \'strength-desc\'}" ng-click="setSort(\'strength-desc\')">Highest Strength</button>' +
          '      <button type="button" class="btn btn-ghost btn-sm" ng-class="{\'btn-primary\': sortBy === \'strength-asc\'}" ng-click="setSort(\'strength-asc\')">Lowest Strength</button>' +
          '      <button type="button" class="btn btn-ghost btn-sm" ng-class="{\'btn-primary\': sortBy === \'evidence\'}" ng-click="setSort(\'evidence\')">Most Evidence</button>' +
          '      <button type="button" class="btn btn-ghost btn-sm" ng-class="{\'btn-primary\': sortBy === \'name\'}" ng-click="setSort(\'name\')">Name A–Z</button>' +
          '    </div>' +
          '  </div>' +
          '  <div class="skill-bars-list" ng-if="sortedSkills.length">' +
          '    <div class="skill-bar-row" ng-repeat="s in sortedSkills track by s.id" ng-click="selectSkill(s)">' +
          '      <div class="sb-label-col">' +
          '        <strong class="sb-name">{{s.name}}</strong>' +
          '        <span class="tag tag-sm">{{s.category}}</span>' +
          '      </div>' +
          '      <div class="sb-meter-col">' +
          '        <div class="sb-track">' +
          '          <div class="sb-fill" ng-style="{width: s.strength + \'%\'}" ng-class="strengthClass(s.strength)"></div>' +
          '        </div>' +
          '      </div>' +
          '      <div class="sb-score-col">' +
          '        <span class="sb-strength-num">{{s.strength}}%</span>' +
          '        <span class="muted small">{{s.evidenceCount}} evid</span>' +
          '      </div>' +
          '    </div>' +
          '  </div>' +
          '  <p class="muted" ng-if="!sortedSkills.length">No skills matching filter.</p>' +
          '</div>',
        link: function (scope) {
          scope.sortBy = 'strength-desc';

          scope.setSort = function (key) {
            scope.sortBy = key;
            applySort();
          };

          function applySort() {
            var list = (scope.skills || []).slice();
            if (scope.sortBy === 'strength-desc') {
              list.sort(function (a, b) { return b.strength - a.strength; });
            } else if (scope.sortBy === 'strength-asc') {
              list.sort(function (a, b) { return a.strength - b.strength; });
            } else if (scope.sortBy === 'evidence') {
              list.sort(function (a, b) { return b.evidenceCount - a.evidenceCount; });
            } else if (scope.sortBy === 'name') {
              list.sort(function (a, b) { return a.name.localeCompare(b.name); });
            }
            scope.sortedSkills = list.slice(0, 16);
          }

          scope.strengthClass = function (strength) {
            if (strength >= 75) return 'good';
            if (strength >= 50) return 'warn';
            return 'danger';
          };

          scope.selectSkill = function (s) {
            if (scope.onSelectSkill) scope.onSelectSkill({ skill: s });
          };

          scope.$watch('skills', applySort, true);
          applySort();
        }
      };
    }]);

})(angular);
