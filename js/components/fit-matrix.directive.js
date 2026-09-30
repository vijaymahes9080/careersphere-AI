/**
 * CareerSphere AI — Career Fit Matrix Directive
 * 3-Tier matrix (Low, Medium, High) with interactive click to view role dossier.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csFitMatrix', [function () {
      return {
        restrict: 'E',
        scope: {
          matrix: '=',       // { high: [], medium: [], low: [], all: [] }
          onSelectRole: '&'
        },
        template:
          '<div class="fit-matrix-container">' +
          '  <div class="fit-matrix-cols">' +
          '    <!-- High Match Column -->' +
          '    <div class="fit-col fit-col-high">' +
          '      <div class="fit-col-head">' +
          '        <span class="dot-sm good"></span>' +
          '        <h5>High Fit (75%+)</h5>' +
          '        <span class="badge badge-sm good">{{(matrix.high || []).length}}</span>' +
          '      </div>' +
          '      <div class="fit-cards">' +
          '        <div class="fit-card panel" ng-repeat="r in matrix.high" ng-click="selectRole(r)" ng-class="{\'active\': selectedRole.id === r.id}">' +
          '          <div class="fc-title">{{r.title}}</div>' +
          '          <div class="fc-stat">' +
          '            <strong>{{r.coveragePercent}}%</strong> match · {{r.matchedSkills.length}} skills' +
          '          </div>' +
          '          <span class="fc-arrow">Inspect Dossier →</span>' +
          '        </div>' +
          '        <p class="muted small" ng-if="!matrix.high.length">No roles currently meet the 75%+ threshold.</p>' +
          '      </div>' +
          '    </div>' +
          '    <!-- Medium Match Column -->' +
          '    <div class="fit-col fit-col-med">' +
          '      <div class="fit-col-head">' +
          '        <span class="dot-sm warn"></span>' +
          '        <h5>Medium Fit (50–74%)</h5>' +
          '        <span class="badge badge-sm warn">{{(matrix.medium || []).length}}</span>' +
          '      </div>' +
          '      <div class="fit-cards">' +
          '        <div class="fit-card panel" ng-repeat="r in matrix.medium" ng-click="selectRole(r)" ng-class="{\'active\': selectedRole.id === r.id}">' +
          '          <div class="fc-title">{{r.title}}</div>' +
          '          <div class="fc-stat">' +
          '            <strong>{{r.coveragePercent}}%</strong> match · {{r.missingSkills.length}} gaps' +
          '          </div>' +
          '          <span class="fc-arrow">Inspect Dossier →</span>' +
          '        </div>' +
          '        <p class="muted small" ng-if="!matrix.medium.length">No roles in this bracket.</p>' +
          '      </div>' +
          '    </div>' +
          '    <!-- Low Match Column -->' +
          '    <div class="fit-col fit-col-low">' +
          '      <div class="fit-col-head">' +
          '        <span class="dot-sm danger"></span>' +
          '        <h5>Low Fit (&lt;50%)</h5>' +
          '        <span class="badge badge-sm danger">{{(matrix.low || []).length}}</span>' +
          '      </div>' +
          '      <div class="fit-cards">' +
          '        <div class="fit-card panel" ng-repeat="r in matrix.low" ng-click="selectRole(r)" ng-class="{\'active\': selectedRole.id === r.id}">' +
          '          <div class="fc-title">{{r.title}}</div>' +
          '          <div class="fc-stat">' +
          '            <strong>{{r.coveragePercent}}%</strong> match · needs development' +
          '          </div>' +
          '          <span class="fc-arrow">Inspect Dossier →</span>' +
          '        </div>' +
          '        <p class="muted small" ng-if="!matrix.low.length">No roles in this bracket.</p>' +
          '      </div>' +
          '    </div>' +
          '  </div>' +
          '  <!-- Selected Role Dossier Modal / Panel -->' +
          '  <div class="role-dossier panel" ng-if="selectedRole">' +
          '    <div class="dossier-head">' +
          '      <div>' +
          '        <h4>{{selectedRole.title}} — Career Dossier</h4>' +
          '        <span class="badge" ng-class="tierClass(selectedRole.fitTier)">{{selectedRole.coveragePercent}}% Match ({{selectedRole.fitTier}} Fit)</span>' +
          '        <span class="badge">Readiness: {{selectedRole.roleReadiness}}%</span>' +
          '      </div>' +
          '      <button type="button" class="btn btn-ghost btn-sm" ng-click="closeDossier()">Close ×</button>' +
          '    </div>' +
          '    <div class="dossier-grid">' +
          '      <div>' +
          '        <h6>Matched Skills ({{selectedRole.matchedSkills.length}})</h6>' +
          '        <ul class="dossier-list">' +
          '          <li ng-repeat="m in selectedRole.matchedSkills">' +
          '            <strong>{{m.skillName}}</strong> — {{m.status}} <span class="muted small" ng-if="m.current">({{m.current.strength}}%)</span>' +
          '          </li>' +
          '          <li ng-if="!selectedRole.matchedSkills.length" class="muted">None</li>' +
          '        </ul>' +
          '      </div>' +
          '      <div>' +
          '        <h6>Missing Skills &amp; Gaps ({{selectedRole.missingSkills.length}})</h6>' +
          '        <ul class="dossier-list">' +
          '          <li ng-repeat="g in selectedRole.missingSkills">' +
          '            <span class="badge badge-sm badge-err">{{g.priority}}</span> <strong>{{g.skill}}</strong>' +
          '            <span class="muted small"> — {{g.suggestedAction}}</span>' +
          '          </li>' +
          '          <li ng-if="!selectedRole.missingSkills.length" class="muted">No missing skills!</li>' +
          '        </ul>' +
          '      </div>' +
          '      <div>' +
          '        <h6>Supporting Projects</h6>' +
          '        <ul class="dossier-list">' +
          '          <li ng-repeat="p in selectedRole.relatedProjects">' +
          '            <strong>{{p.name}}</strong> <span class="muted small">({{p.complexity}} complexity)</span>' +
          '          </li>' +
          '          <li ng-if="!selectedRole.relatedProjects.length" class="muted">No linked projects found.</li>' +
          '        </ul>' +
          '      </div>' +
          '    </div>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          scope.selectedRole = null;

          scope.$watch('matrix', function (m) {
            if (m && m.all && m.all.length && !scope.selectedRole) {
              scope.selectedRole = m.all[0];
            }
          });

          scope.selectRole = function (r) {
            scope.selectedRole = r;
            if (scope.onSelectRole) scope.onSelectRole({ role: r });
          };

          scope.closeDossier = function () {
            scope.selectedRole = null;
          };

          scope.tierClass = function (tier) {
            if (tier === 'High') return 'good';
            if (tier === 'Medium') return 'warn';
            return 'danger';
          };
        }
      };
    }]);

})(angular);
