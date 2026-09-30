/**
 * CareerSphere AI — Project → Skill → Role Map Directive
 * Displays: PROJECT → SKILLS USED → CAREER ROLES with Employability Impact
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csProjectRoleMap', [function () {
      return {
        restrict: 'E',
        scope: {
          mapData: '='       // array of { name, domain, complexity, description, skillsUsed, careerRoles, impactScore, employabilityNote }
        },
        template:
          '<div class="proj-map-container">' +
          '  <div class="proj-map-cards">' +
          '    <article class="proj-map-card panel" ng-repeat="item in mapData track by item.name">' +
          '      <header class="pm-head">' +
          '        <div>' +
          '          <span class="badge">{{item.domain}}</span>' +
          '          <h4 class="pm-title">{{item.name}}</h4>' +
          '        </div>' +
          '        <div class="pm-score-badge">' +
          '          <span class="pm-score-num">{{item.impactScore}}</span>' +
          '          <span class="pm-score-lbl">Impact Score</span>' +
          '        </div>' +
          '      </header>' +
          '      <!-- Flow: Project -> Skills -> Roles -->' +
          '      <div class="pm-flow">' +
          '        <!-- Stage 1: Skills Used -->' +
          '        <div class="pm-step pm-step-skills">' +
          '          <span class="pm-step-tag">SKILLS DEMONSTRATED</span>' +
          '          <div class="pm-tags">' +
          '            <span class="tag tag-skill" ng-repeat="s in item.skillsUsed">' +
          '              {{s.name}} <small>({{s.strength}}%)</small>' +
          '            </span>' +
          '            <span class="muted small" ng-if="!item.skillsUsed.length">No skill mapping extracted</span>' +
          '          </div>' +
          '        </div>' +
          '        <div class="pm-arrow">↓ feeds into</div>' +
          '        <!-- Stage 2: Career Roles -->' +
          '        <div class="pm-step pm-step-roles">' +
          '          <span class="pm-step-tag">CAREER ROLES SUPPORTED</span>' +
          '          <div class="pm-tags">' +
          '            <span class="tag tag-role" ng-repeat="r in item.careerRoles">' +
          '              ◎ {{r.title}} <small ng-if="r.matchingSkillsCount">({{r.matchingSkillsCount}} reqs)</small>' +
          '            </span>' +
          '            <span class="muted small" ng-if="!item.careerRoles.length">General software engineering profile</span>' +
          '          </div>' +
          '        </div>' +
          '      </div>' +
          '      <footer class="pm-footer muted small">' +
          '        <strong>Employability Value:</strong> {{item.employabilityNote}}' +
          '      </footer>' +
          '    </article>' +
          '  </div>' +
          '</div>'
      };
    }]);

})(angular);
