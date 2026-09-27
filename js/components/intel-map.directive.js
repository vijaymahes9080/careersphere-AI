/**
 * CareerSphere AI — Career Intelligence Map (interactive radial SVG)
 *
 * Center: USER. Groups (Skills, Projects, Certificates, Education,
 * Experience, Goals, Roles, Opportunities, Gaps, Learning) surround the
 * center. Groups expand on click; nodes are selectable and report details
 * through onSelect.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csIntelMap', [function () {
      return {
        restrict: 'E',
        scope: {
          data: '=',        // { center, groups, edges }
          onSelect: '&',
          selectedId: '='
        },
        template:
          '<div class="intel-map">' +
          '  <div class="map-toolbar">' +
          '    <button type="button" class="btn btn-ghost" ng-click="zoomBy(1.15)" aria-label="Zoom in">+</button>' +
          '    <button type="button" class="btn btn-ghost" ng-click="zoomBy(0.87)" aria-label="Zoom out">−</button>' +
          '    <button type="button" class="btn btn-ghost" ng-click="resetView()">Reset</button>' +
          '    <span class="map-hint">Click a group to expand · click a node for details</span>' +
          '  </div>' +
          '  <div class="map-scroll" ng-style="{height: height + \'px\'}">' +
          '    <svg width="100%" height="100%" ng-attr-viewBox="{{viewBox}}" role="img" aria-label="Career intelligence map connecting your profile entities">' +
          '      <defs>' +
          '        <radialGradient id="centerGrad" cx="50%" cy="40%" r="70%">' +
          '          <stop offset="0%" stop-color="#4f8cff" stop-opacity="0.9"/>' +
          '          <stop offset="100%" stop-color="#2f6fed" stop-opacity="0.65"/>' +
          '        </radialGradient>' +
          '        <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
          '      </defs>' +
          // edges
          '      <g class="edges">' +
          '        <line ng-repeat="e in edges" ng-attr-x1="{{e.x1}}" ng-attr-y1="{{e.y1}}" ng-attr-x2="{{e.x2}}" ng-attr-y2="{{e.y2}}" class="edge {{e.cls}}"/>' +
          '      </g>' +
          // center
          '      <g class="node-center" ng-click="selectCenter()">' +
          '        <circle cx="500" cy="340" r="52" fill="url(#centerGrad)" filter="url(#glow)"/>' +
          '        <text x="500" y="335" text-anchor="middle" class="center-label">{{center.label}}</text>' +
          '        <text x="500" y="354" text-anchor="middle" class="center-sub">{{center.sub}}</text>' +
          '      </g>' +
          // group rings
          '      <g ng-repeat="g in layout.groups">' +
          '        <g class="group-node" ng-click="toggle(g)" role="button" tabindex="0" ng-keydown="onKey($event, g)">' +
          '          <circle ng-attr-cx="{{g.x}}" ng-attr-cy="{{g.y}}" ng-attr-r="{{g.r}}" class="group-circle {{g.color}}" ng-class="{active: g.expanded}"/>' +
          '          <text ng-attr-x="{{g.x}}" ng-attr-y="{{g.y - 2}}" text-anchor="middle" class="group-label">{{g.label}}</text>' +
          '          <text ng-attr-x="{{g.x}}" ng-attr-y="{{g.y + 14}}" text-anchor="middle" class="group-count">{{g.items.length}}{{g.expanded ? \' · \' + g.visibleCount + \' shown\' : \'\'}}</text>' +
          '        </g>' +
          // expanded items fan out around the group
          '        <g ng-if="g.expanded">' +
          '          <g ng-repeat="item in g.visible" class="item-node" ng-click="select(item, g, $event)" role="button" tabindex="0" ng-keydown="onItemKey($event, item, g)">' +
          '            <circle ng-attr-cx="{{item.x}}" ng-attr-cy="{{item.y}}" ng-attr-r="{{item.r}}" class="item-circle {{g.color}}" ng-class="{selected: selectedId === item.id}"/>' +
          '            <title>{{item.label}}</title>' +
          '            <text ng-attr-x="{{item.x}}" ng-attr-y="{{item.y + item.r + 11}}" text-anchor="middle" class="item-label" ng-if="item.showLabel">{{item.labelShort}}</text>' +
          '          </g>' +
          '        </g>' +
          '      </g>' +
          '    </svg>' +
          '  </div>' +
          '</div>',
        link: function (scope, element) {
          var CX = 500, CY = 340;
          var expanded = { skills: true }; // first group opens by default

          scope.height = 560;
          scope.viewBox = '0 0 1000 680';
          var zoom = 1;

          function applyViewBox() {
            var w = 1000 / zoom, h = 680 / zoom;
            scope.viewBox = ((1000 - w) / 2) + ' ' + ((680 - h) / 2) + ' ' + w + ' ' + h;
          }

          scope.zoomBy = function (factor) {
            zoom = Math.max(0.6, Math.min(2.5, zoom * factor));
            applyViewBox();
          };
          scope.resetView = function () {
            zoom = 1;
            applyViewBox();
            scope.$applyAsync();
          };

          function computeLayout() {
            var data = scope.data;
            if (!data || !data.groups) { scope.layout = { groups: [] }; scope.edges = []; return; }

            var groups = data.groups;
            var n = groups.length;
            var R = 245; // group ring radius
            var layoutGroups = groups.map(function (g, i) {
              var angle = (-Math.PI / 2) + (i / n) * Math.PI * 2;
              var gExpanded = !!expanded[g.id];
              var visible = gExpanded ? g.items : [];
              // Cap items for performance & readability
              var MAX = 14;
              var shown = visible.slice(0, MAX);
              var itemR = 20;
              var spread = Math.min(Math.PI * 0.9, 0.22 + shown.length * 0.12);
              var itemNodes = shown.map(function (item, j) {
                var offset = shown.length === 1 ? 0 : (j / (shown.length - 1) - 0.5) * spread;
                var ia = angle + offset;
                var ir = R + 96;
                return {
                  id: item.id,
                  label: item.label,
                  labelShort: item.label.length > 18 ? item.label.substring(0, 16) + '…' : item.label,
                  showLabel: true,
                  x: Math.round(CX + Math.cos(ia) * ir),
                  y: Math.round(CY + Math.sin(ia) * ir),
                  r: itemR,
                  ref: item.ref,
                  meta: item.meta,
                  groupId: g.id
                };
              });
              return {
                id: g.id,
                label: g.label,
                color: g.color,
                x: Math.round(CX + Math.cos(angle) * R),
                y: Math.round(CY + Math.sin(angle) * R),
                r: 38,
                expanded: gExpanded,
                items: g.items,
                visible: itemNodes,
                visibleCount: itemNodes.length,
                total: g.items.length
              };
            });

            // Position lookup for edges
            var pos = {};
            layoutGroups.forEach(function (g) {
              pos[g.id] = { x: g.x, y: g.y };
              g.visible.forEach(function (item) { pos[item.id] = { x: item.x, y: item.y }; });
            });

            var edges = [];
            // Structural edges: center → each group node
            layoutGroups.forEach(function (g) {
              edges.push({ x1: CX, y1: CY, x2: g.x, y2: g.y, cls: 'edge-struct' });
            });
            (data.edges || []).forEach(function (e) {
              var a = pos[e.source], b = pos[e.target];
              if (!a || !b) return;
              edges.push({
                x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                cls: e.type === 'role-gap' || (e.source.indexOf('gap:') === 0) || (e.target.indexOf('gap:') === 0) ? 'edge-gap' : 'edge-normal'
              });
            });

            scope.layout = { groups: layoutGroups };
            scope.edges = edges;
            scope.center = data.center;
          }

          scope.toggle = function (g) {
            expanded[g.id] = !expanded[g.id];
            computeLayout();
          };

          scope.select = function (item, g, $event) {
            if ($event) $event.stopPropagation();
            scope.onSelect({
              node: {
                id: item.id,
                label: item.label,
                type: g.id,
                meta: item.meta,
                ref: item.ref,
                group: g.label
              }
            });
          };

          scope.selectCenter = function () {
            scope.onSelect({
              node: { id: 'you', label: scope.center ? scope.center.label : 'You', type: 'person', meta: 'Career Profile', ref: null, group: 'Person' }
            });
          };

          scope.onKey = function (evt, g) {
            if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); scope.toggle(g); }
          };
          scope.onItemKey = function (evt, item, g) {
            if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); scope.select(item, g); }
          };

          // Recompute when data changes (new object identity each rebuild)
          scope.$watch('data', function () { computeLayout(); }, true);
          scope.$watch('selectedId', function () { /* used by template classes */ });

          // Responsive height
          function updateHeight() {
            var w = element[0].clientWidth || 900;
            scope.height = Math.max(380, Math.min(680, Math.round(w * 0.62)));
          }
          updateHeight();
          angular.element(window).on('resize', updateHeight);
          scope.$on('$destroy', function () {
            angular.element(window).off('resize', updateHeight);
          });

          computeLayout();
        }
      };
    }]);

})(angular);
