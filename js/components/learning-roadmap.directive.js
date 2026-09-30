/**
 * CareerSphere AI — Interactive Learning Roadmap Directive
 * Stage-based roadmap: NOW → NEXT → BUILD → APPLY → ADVANCE
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csLearningRoadmap', ['ProfileService', function (ProfileService) {
      return {
        restrict: 'E',
        scope: {
          stages: '=',       // array of { id, label, title, desc, topics: [] }
          onToggle: '&'
        },
        template:
          '<div class="roadmap-stages-container">' +
          '  <!-- Stage Tabs -->' +
          '  <div class="stage-tabs-row">' +
          '    <button type="button" class="stage-tab" ng-repeat="st in stages" ' +
          '            ng-class="{\'active\': activeStage === st.id}" ng-click="selectStage(st.id)">' +
          '      <span class="st-step">{{st.label}}</span>' +
          '      <span class="st-title">{{st.title}}</span>' +
          '      <span class="st-count badge badge-sm">{{st.topics.length}}</span>' +
          '    </button>' +
          '  </div>' +
          '  <!-- Active Stage Topics List -->' +
          '  <div class="stage-body panel" ng-if="currentStage">' +
          '    <div class="stage-head">' +
          '      <div>' +
          '        <h4>Stage: {{currentStage.label}} — {{currentStage.title}}</h4>' +
          '        <p class="muted small">{{currentStage.desc}}</p>' +
          '      </div>' +
          '      <span class="badge" ng-class="currentStage.topics.length ? \'badge-info\' : \'badge-sub\'">' +
          '        {{currentStage.topics.length}} topic{{currentStage.topics.length === 1 ? \'\' : \'s\'}}' +
          '      </span>' +
          '    </div>' +
          '    <div class="stage-topics-grid" ng-if="currentStage.topics.length">' +
          '      <article class="topic-card panel" ng-repeat="t in currentStage.topics track by t.id" ng-class="{\'topic-done\': t.done}">' +
          '        <header class="topic-head">' +
          '          <label class="check-wrap">' +
          '            <input type="checkbox" ng-model="t.done" ng-change="toggleTopic(t)">' +
          '            <span class="topic-title">{{t.title}}</span>' +
          '          </label>' +
          '          <span class="badge" ng-class="t.status === \'MISSING\' ? \'badge-err\' : \'badge-warn\'">{{t.status}}</span>' +
          '        </header>' +
          '        <p class="topic-meta muted small">Required for {{t.role}} · Source: {{t.source}}</p>' +
          '        <!-- Structured learning steps -->' +
          '        <ul class="topic-steps">' +
          '          <li ng-repeat="step in t.steps">{{step}}</li>' +
          '        </ul>' +
          '      </article>' +
          '    </div>' +
          '    <div class="empty-state" ng-if="!currentStage.topics.length">' +
          '      <p class="muted">No learning topics in this stage. All requirements in this bracket are currently satisfied!</p>' +
          '    </div>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          scope.activeStage = 'NOW';

          scope.$watch('stages', function (stages) {
            if (stages && stages.length) {
              updateCurrentStage();
            }
          }, true);

          function updateCurrentStage() {
            var match = (scope.stages || []).filter(function (s) { return s.id === scope.activeStage; })[0];
            scope.currentStage = match || (scope.stages && scope.stages[0]) || null;
          }

          scope.selectStage = function (stageId) {
            scope.activeStage = stageId;
            updateCurrentStage();
          };

          scope.toggleTopic = function (t) {
            ProfileService.toggleLearningTopic(t.id);
            if (scope.onToggle) scope.onToggle({ topic: t });
          };
        }
      };
    }]);

})(angular);
