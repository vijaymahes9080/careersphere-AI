/**
 * CareerSphere AI — Career Progress & Baseline Tracker Directive
 * Shows progression baseline and real-time milestones without fabricating historical dates.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csProgressTracker', [function () {
      return {
        restrict: 'E',
        scope: {
          analyses: '='
        },
        template:
          '<div class="progress-tracker-wrap panel">' +
          '  <div class="pt-head">' +
          '    <div>' +
          '      <h4>Career Milestones &amp; Progress Baseline</h4>' +
          '      <p class="muted small">Transparent milestone tracking — no fabricated historical dates.</p>' +
          '    </div>' +
          '    <span class="badge badge-accent">Active Baseline</span>' +
          '  </div>' +
          '  <div class="pt-milestones">' +
          '    <div class="milestone-item" ng-repeat="m in milestones" ng-class="{\'completed\': m.done}">' +
          '      <div class="m-dot">' +
          '        <span>{{m.done ? \'✓\' : ($index + 1)}}</span>' +
          '      </div>' +
          '      <div class="m-content">' +
          '        <strong>{{m.title}}</strong>' +
          '        <p class="muted small">{{m.desc}}</p>' +
          '      </div>' +
          '      <span class="badge badge-sm" ng-class="m.done ? \'good\' : \'badge-sub\'">' +
          '        {{m.done ? \'Completed\' : \'Pending\'}}' +
          '      </span>' +
          '    </div>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          function compute() {
            var a = scope.analyses;
            var hasSkills = a && a.skill && a.skill.stats.total > 0;
            var hasEvidence = a && a.evidence && a.evidence.overall && a.evidence.overall.score > 0;
            var hasRoles = a && a.roleMatches && a.roleMatches.length > 0;
            var hasRoadmapProgress = a && a.learningPlan && a.learningPlan.some(function (t) { return t.done; });
            var hasHighReadiness = a && a.readiness && a.readiness.value >= 70;

            scope.milestones = [
              {
                title: 'Data Ingestion & Normalization Baseline',
                desc: hasSkills ? (a.skill.stats.total + ' technical skills extracted and normalized.') : 'Import resume, XML or CSV.',
                done: hasSkills
              },
              {
                title: 'Evidence Verification & Citation Mapping',
                desc: hasEvidence ? (a.skill.stats.withEvidence + ' skills linked to project/work evidence.') : 'Link projects to skills.',
                done: hasEvidence
              },
              {
                title: 'Target Role Alignment & Gap Identification',
                desc: hasRoles ? (a.roleMatches.length + ' career roles analyzed against profile.') : 'Configure target roles.',
                done: hasRoles
              },
              {
                title: 'Active Learning Roadmap Progression',
                desc: hasRoadmapProgress ? 'Roadmap topics actively completed and verified.' : 'Check off topics in Learning view.',
                done: hasRoadmapProgress
              },
              {
                title: 'Career Readiness Milestone (70%+)',
                desc: hasHighReadiness ? 'Strong composite readiness reached.' : 'Reach 70%+ overall readiness.',
                done: hasHighReadiness
              }
            ];
          }

          scope.$watch('analyses', compute, true);
          compute();
        }
      };
    }]);

})(angular);
