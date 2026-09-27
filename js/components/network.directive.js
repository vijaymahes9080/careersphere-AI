/**
 * CareerSphere AI — Skill ↔ Project network (bipartite SVG graph).
 * Clicking a node reports details through onSelect.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csNetwork', [function () {
      return {
        restrict: 'E',
        scope: {
          data: '=',      // { nodes, links }
          onSelect: '&'
        },
        template:
          '<div class="network-wrap">' +
          '  <svg viewBox="0 0 900 660" role="img" aria-label="Network of skills connected to projects">' +
          '    <g class="edges">' +
          '      <line ng-repeat="l in links" ng-attr-x1="{{l.x1}}" ng-attr-y1="{{l.y1}}" ng-attr-x2="{{l.x2}}" ng-attr-y2="{{l.y2}}" class="edge edge-normal"/>' +
          '    </g>' +
          '    <g ng-repeat="n in nodes" class="network-node" ng-click="pick(n)" role="button" tabindex="0" ng-keydown="key($event, n)">' +
          '      <circle ng-attr-cx="{{n.x}}" ng-attr-cy="{{n.y}}" ng-attr-r="{{n.r}}" class="item-circle {{n.col}}" ng-class="{selected: n.id === selectedId}"/>' +
          '      <text ng-attr-x="{{n.col === \'skill\' ? n.x - n.r - 8 : n.x + n.r + 8}}" ng-attr-y="{{n.y + 4}}" ng-attr-text-anchor="{{n.col === \'skill\' ? \'end\' : \'start\'}}" class="net-label">{{n.label}}</text>' +
          '      <title>{{n.label}}</title>' +
          '    </g>' +
          '  </svg>' +
          '  <div class="legend">' +
          '    <span class="legend-item"><i class="dot skill"></i>Skills (left)</span>' +
          '    <span class="legend-item"><i class="dot project"></i>Projects (right)</span>' +
          '    <span class="legend-item">Line = skill demonstrated in project</span>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          scope.selectedId = null;

          function layout() {
            var data = scope.data || { nodes: [], links: [] };
            var pos = {};
            scope.nodes = (data.nodes || []).map(function (n) {
              var node = angular.extend({}, n);
              node.r = node.col === 'skill' ? 11 : 15;
              pos[node.id] = { x: node.x, y: node.y };
              return node;
            });
            scope.links = (data.links || []).map(function (l) {
              var a = pos[l.source], b = pos[l.target];
              return a && b ? { x1: a.x, y1: a.y, x2: b.x, y2: b.y } : null;
            }).filter(Boolean);
          }

          scope.pick = function (n) {
            scope.selectedId = n.id;
            scope.onSelect({ node: { id: n.id, label: n.label, type: n.col, ref: n.ref } });
          };
          scope.key = function (evt, n) {
            if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); scope.pick(n); }
          };

          scope.$watch('data', layout, true);
          layout();
        }
      };
    }]);

})(angular);
