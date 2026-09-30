/**
 * CareerSphere AI — Career Pathway Graph Directive
 * Interactive SVG branching tree: Current Profile → Target Roles → Specializations
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csPathwayGraph', [function () {
      return {
        restrict: 'E',
        scope: {
          data: '=',       // { root: { title, subtitle, avgStrength }, branches: [...] }
          onSelect: '&'
        },
        template:
          '<div class="pathway-graph-wrap">' +
          '  <div class="pathway-toolbar">' +
          '    <span class="muted small">Interactive Career Pathway Graph · Click any node to inspect alignment</span>' +
          '    <div class="pathway-legend">' +
          '      <span class="leg-item"><i class="dot-sm strong"></i>Ready (75%+)</span>' +
          '      <span class="leg-item"><i class="dot-sm progress"></i>Progress (50-74%)</span>' +
          '      <span class="leg-item"><i class="dot-sm target"></i>Target Role</span>' +
          '      <span class="leg-item"><i class="dot-sm future"></i>Advancement Path</span>' +
          '    </div>' +
          '  </div>' +
          '  <div class="pathway-tree">' +
          '    <!-- Root node -->' +
          '    <div class="path-node path-root" ng-click="selectRoot()">' +
          '      <div class="path-node-icon">◉</div>' +
          '      <div class="path-node-content">' +
          '        <strong>{{data.root.title}}</strong>' +
          '        <span class="muted small">{{data.root.subtitle}} · Avg {{data.root.avgStrength}}%</span>' +
          '      </div>' +
          '    </div>' +
          '    <!-- Branches -->' +
          '    <div class="path-branches">' +
          '      <div class="path-branch" ng-repeat="b in data.branches">' +
          '        <div class="path-connector"></div>' +
          '        <div class="path-node path-role" ng-class="b.status" ng-click="selectBranch(b)">' +
          '          <div class="path-node-head">' +
          '            <strong>{{b.title}}</strong>' +
          '            <span class="badge" ng-class="b.status">{{b.matchPercent}}% match</span>' +
          '          </div>' +
          '          <div class="path-node-meta muted small">{{b.matchedCount}} of {{b.totalReqs}} skills matched</div>' +
          '          <div class="mini-bar">' +
          '            <div class="mini-fill" ng-style="{width: b.matchPercent + \'%\'}" ng-class="b.status"></div>' +
          '          </div>' +
          '        </div>' +
          '        <!-- Children / Specializations -->' +
          '        <div class="path-children" ng-if="b.children.length">' +
          '          <div class="path-child-node" ng-repeat="c in b.children" ng-class="c.status" ng-click="selectChild(c, b)">' +
          '            <span class="path-child-connector"></span>' +
          '            <span class="path-child-title">{{c.name}}</span>' +
          '            <span class="badge badge-sm" ng-class="c.status">{{c.status | uppercase}} · {{c.match}}%</span>' +
          '          </div>' +
          '        </div>' +
          '      </div>' +
          '    </div>' +
          '  </div>' +
          '  <!-- Selected Node Detail Banner -->' +
          '  <div class="pathway-selected-banner panel" ng-if="selectedNode">' +
          '    <div class="psb-head">' +
          '      <h4>{{selectedNode.title || selectedNode.name}}</h4>' +
          '      <span class="badge" ng-class="selectedNode.status">{{selectedNode.status | uppercase}}</span>' +
          '    </div>' +
          '    <p class="muted small">{{selectedNode.desc}}</p>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          scope.selectedNode = null;

          scope.selectRoot = function () {
            scope.selectedNode = {
              title: scope.data.root.title,
              status: 'current',
              desc: 'Current profile foundation. Skills extracted from verified project evidence and resume data.'
            };
          };

          scope.selectBranch = function (b) {
            scope.selectedNode = {
              title: b.title,
              status: b.status,
              desc: 'Target career role with ' + b.matchPercent + '% coverage based on ' + b.matchedCount + ' of ' + b.totalReqs + ' required skills.'
            };
            if (scope.onSelect) scope.onSelect({ node: b });
          };

          scope.selectChild = function (c, parent) {
            scope.selectedNode = {
              title: c.name,
              status: c.status,
              desc: 'Advanced specialization extending from ' + parent.title + '. Projected alignment: ' + c.match + '%.'
            };
            if (scope.onSelect) scope.onSelect({ node: c });
          };
        }
      };
    }]);

})(angular);
