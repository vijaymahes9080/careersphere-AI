/**
 * CareerSphere AI — Career Role Matching Directive
 * Compares target roles with match %, matched skills, missing skills, and "Why this role matches".
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csRoleMatching', [function () {
      return {
        restrict: 'E',
        scope: {
          roles: '=',        // array of { id, title, coveragePercent, roleReadiness, fitTier, matchedSkills, missingSkills, whyMatches }
          onSelectRole: '&'
        },
        template:
          '<div class="role-matching-wrap">' +
          '  <div class="role-cards-list">' +
          '    <article class="role-card panel" ng-repeat="r in roles track by r.id" ng-class="{\'expanded\': expandedRole === r.id}">' +
          '      <header class="role-card-header" ng-click="toggleExpand(r)">' +
          '        <div class="role-info">' +
          '          <div class="role-title-row">' +
          '            <h4 class="role-title">{{r.title}}</h4>' +
          '            <span class="badge" ng-class="tierClass(r.fitTier)">{{r.fitTier}} Fit</span>' +
          '          </div>' +
          '          <p class="role-sub muted small">{{r.matchedSkills.length}} matched · {{r.missingSkills.length}} gaps · Source: {{r.source}}</p>' +
          '        </div>' +
          '        <div class="role-stats-right">' +
          '          <div class="role-pct-badge" ng-class="tierClass(r.fitTier)">' +
          '            <span class="role-pct-num">{{r.coveragePercent}}%</span>' +
          '            <span class="role-pct-lbl">Match</span>' +
          '          </div>' +
          '          <span class="role-chevron">{{expandedRole === r.id ? \'▲\' : \'▼\'}}</span>' +
          '        </div>' +
          '      </header>' +
          '      <!-- Match Progress Bar -->' +
          '      <div class="role-progress-bar-wrap">' +
          '        <div class="role-progress-bar" ng-style="{width: r.coveragePercent + \'%\'}" ng-class="tierClass(r.fitTier)"></div>' +
          '      </div>' +
          '      <!-- Expandable Why This Role Matches Dossier -->' +
          '      <div class="role-card-body" ng-if="expandedRole === r.id">' +
          '        <div class="why-matches-box">' +
          '          <h5>Why this role matches (Analytical Reasoning)</h5>' +
          '          <ul class="why-list">' +
          '            <li ng-repeat="reason in r.whyMatches" class="why-item">{{reason}}</li>' +
          '          </ul>' +
          '        </div>' +
          '        <!-- Matched vs Missing Skill Chips -->' +
          '        <div class="split-2 role-skills-split">' +
          '          <div class="matched-col">' +
          '            <h6 class="col-sub">Matched Skills ({{r.matchedSkills.length}})</h6>' +
          '            <div class="tag-cloud">' +
          '              <span class="tag tag-matched" ng-repeat="m in r.matchedSkills">' +
          '                ✓ {{m.skillName}} <small ng-if="m.current">({{m.current.strength}}%)</small>' +
          '              </span>' +
          '            </div>' +
          '          </div>' +
          '          <div class="missing-col">' +
          '            <h6 class="col-sub">Missing Skills ({{r.missingSkills.length}})</h6>' +
          '            <div class="tag-cloud">' +
          '              <span class="tag tag-missing" ng-repeat="miss in r.missingSkills">' +
          '                ✗ {{miss.skill}} <small>({{miss.priority}})</small>' +
          '              </span>' +
          '            </div>' +
          '          </div>' +
          '        </div>' +
          '        <div class="role-action-row">' +
          '          <button type="button" class="btn btn-sm btn-primary" ng-click="selectRole(r, $event)">Focus on this Role</button>' +
          '        </div>' +
          '      </div>' +
          '    </article>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          scope.expandedRole = null;

          // Default expand first role
          scope.$watch('roles', function (roles) {
            if (roles && roles.length && !scope.expandedRole) {
              scope.expandedRole = roles[0].id;
            }
          });

          scope.toggleExpand = function (r) {
            scope.expandedRole = scope.expandedRole === r.id ? null : r.id;
          };

          scope.tierClass = function (tier) {
            if (tier === 'High') return 'good';
            if (tier === 'Medium') return 'warn';
            return 'danger';
          };

          scope.selectRole = function (r, $event) {
            if ($event) $event.stopPropagation();
            if (scope.onSelectRole) {
              scope.onSelectRole({ role: r });
            }
          };
        }
      };
    }]);

})(angular);
