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
          '  <div class="network-toolbar">' +
          '    <span class="muted small">Interactive Network: Click any node to isolate its connected projects, skills, and roles</span>' +
          '    <button type="button" class="btn btn-ghost btn-sm" ng-if="selectedId" ng-click="clearSelection()">Clear Selection</button>' +
          '  </div>' +
          '  <svg viewBox="0 0 960 620" role="img" aria-label="Tripartite network connecting Projects, Skills, and Roles">' +
          '    <defs>' +
          '      <linearGradient id="linkGradPS" x1="0%" y1="0%" x2="100%" y2="0%">' +
          '        <stop offset="0%" stop-color="#35d0e0" stop-opacity="0.45"/>' +
          '        <stop offset="100%" stop-color="#4f8cff" stop-opacity="0.45"/>' +
          '      </linearGradient>' +
          '      <linearGradient id="linkGradSR" x1="0%" y1="0%" x2="100%" y2="0%">' +
          '        <stop offset="0%" stop-color="#4f8cff" stop-opacity="0.45"/>' +
          '        <stop offset="100%" stop-color="#7c5cff" stop-opacity="0.45"/>' +
          '      </linearGradient>' +
          '    </defs>' +
          // Column Headers
          '    <g class="col-headers">' +
          '      <text x="140" y="24" text-anchor="middle" class="col-head-text">PROJECT EVIDENCE (Left)</text>' +
          '      <text x="480" y="24" text-anchor="middle" class="col-head-text">SKILLS REPERTOIRE (Center)</text>' +
          '      <text x="820" y="24" text-anchor="middle" class="col-head-text">TARGET ROLES (Right)</text>' +
          '    </g>' +
          // Edges
          '    <g class="edges">' +
          '      <path ng-repeat="l in links" ng-attr-d="{{l.path}}" class="edge edge-bezier" ' +
          '            ng-class="{\'edge-active\': isLinkActive(l), \'edge-dim\': isLinkDimmed(l)}" ' +
          '            ng-attr-stroke="{{l.type === \'proj-skill\' ? \'url(#linkGradPS)\' : \'url(#linkGradSR)\'}}"/>' +
          '    </g>' +
          // Nodes
          '    <g ng-repeat="n in nodes" class="network-node" ng-click="pick(n)" role="button" tabindex="0" ' +
          '       ng-keydown="key($event, n)" ng-class="{\'node-active\': n.id === selectedId, \'node-dim\': isNodeDimmed(n)}">' +
          '      <circle ng-attr-cx="{{n.x}}" ng-attr-cy="{{n.y}}" ng-attr-r="{{n.r}}" class="item-circle {{n.col}}"/>' +
          '      <text ng-attr-x="{{textPos(n).x}}" ng-attr-y="{{textPos(n).y}}" ' +
          '            ng-attr-text-anchor="{{textPos(n).anchor}}" class="net-label">{{n.label}}</text>' +
          '      <text ng-if="n.meta" ng-attr-x="{{textPos(n).x}}" ng-attr-y="{{textPos(n).y + 12}}" ' +
          '            ng-attr-text-anchor="{{textPos(n).anchor}}" class="net-sub muted">{{n.meta}}</text>' +
          '      <title>{{n.label}} ({{n.col | uppercase}}){{n.strength ? \' · Strength: \' + n.strength + \'%\' : \'\'}}</title>' +
          '    </g>' +
          '  </svg>' +
          '  <div class="legend">' +
          '    <span class="legend-item"><i class="dot project"></i> Projects</span>' +
          '    <span class="legend-item"><i class="dot skill"></i> Skills</span>' +
          '    <span class="legend-item"><i class="dot role"></i> Target Roles</span>' +
          '    <span class="legend-item">Curved lines = verified demonstration &amp; requirement mapping</span>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          scope.selectedId = null;
          scope.connectedNodes = {};
          scope.connectedLinks = {};

          function bezier(x1, y1, x2, y2) {
            var mx = (x1 + x2) / 2;
            return 'M ' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2;
          }

          function layout() {
            var data = scope.data || { nodes: [], links: [] };
            var pos = {};
            scope.nodes = (data.nodes || []).map(function (n) {
              var node = angular.extend({}, n);
              node.r = node.col === 'skill' ? 12 : (node.col === 'project' ? 14 : 16);
              pos[node.id] = { x: node.x, y: node.y };
              return node;
            });
            scope.links = (data.links || []).map(function (l) {
              var a = pos[l.source], b = pos[l.target];
              return a && b ? {
                source: l.source,
                target: l.target,
                type: l.type,
                path: bezier(a.x, a.y, b.x, b.y)
              } : null;
            }).filter(Boolean);
          }

          scope.textPos = function (n) {
            if (n.col === 'project') {
              return { x: n.x - n.r - 8, y: n.y + 4, anchor: 'end' };
            } else if (n.col === 'role') {
              return { x: n.x + n.r + 8, y: n.y + 4, anchor: 'start' };
            } else {
              return { x: n.x, y: n.y - n.r - 6, anchor: 'middle' };
            }
          };

          scope.pick = function (n) {
            if (scope.selectedId === n.id) {
              scope.clearSelection();
              return;
            }
            scope.selectedId = n.id;
            var connected = {};
            connected[n.id] = true;
            var linkMap = {};

            (scope.links || []).forEach(function (l) {
              if (l.source === n.id) {
                connected[l.target] = true;
                linkMap[l.source + '_' + l.target] = true;
              } else if (l.target === n.id) {
                connected[l.source] = true;
                linkMap[l.source + '_' + l.target] = true;
              }
            });

            scope.connectedNodes = connected;
            scope.connectedLinks = linkMap;
            scope.onSelect({ node: { id: n.id, label: n.label, type: n.col, ref: n.ref } });
          };

          scope.clearSelection = function () {
            scope.selectedId = null;
            scope.connectedNodes = {};
            scope.connectedLinks = {};
          };

          scope.isLinkActive = function (l) {
            if (!scope.selectedId) return false;
            return !!scope.connectedLinks[l.source + '_' + l.target];
          };

          scope.isLinkDimmed = function (l) {
            if (!scope.selectedId) return false;
            return !scope.connectedLinks[l.source + '_' + l.target];
          };

          scope.isNodeDimmed = function (n) {
            if (!scope.selectedId) return false;
            return !scope.connectedNodes[n.id];
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
