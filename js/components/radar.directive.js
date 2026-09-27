/**
 * CareerSphere AI — Radar Chart (SVG) for category skill strength.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csRadar', [function () {
      return {
        restrict: 'E',
        scope: {
          labels: '=',
          values: '=',
          title: '@'
        },
        template:
          '<div class="radar-wrap">' +
          '  <svg viewBox="0 0 340 300" role="img" aria-label="{{title || \'Radar chart\'}}">' +
          '    <g transform="translate(170,150)">' +
          '      <polygon ng-repeat="lvl in [25,50,75,100]" ng-attr-points="{{polygonFor(lvl)}}" class="radar-grid"/>' +
          '      <line ng-repeat="ax in axes" x1="0" y1="0" ng-attr-x2="{{ax.x}}" ng-attr-y2="{{ax.y}}" class="radar-axis"/>' +
          '      <polygon ng-attr-points="{{dataPolygon}}" class="radar-data"/>' +
          '      <circle ng-repeat="p in dataPoints" ng-attr-cx="{{p.x}}" ng-attr-cy="{{p.y}}" r="3.5" class="radar-dot"><title>{{p.label}}: {{p.value}}%</title></circle>' +
          '      <text ng-repeat="ax in axes" ng-attr-x="{{ax.lx}}" ng-attr-y="{{ax.ly}}" ng-attr-text-anchor="{{ax.anchor}}" class="radar-label">{{ax.label}}</text>' +
          '    </g>' +
          '  </svg>' +
          '  <p class="chart-note" ng-if="labels.length">Category average skill strength (CareerSphere analytical estimate, 0–100%)</p>' +
          '  <p class="chart-empty" ng-if="!labels.length">No skill categories to display yet.</p>' +
          '</div>',
        link: function (scope) {
          var R = 95;

          function point(angle, value) {
            var r = R * (value / 100);
            return { x: Math.round(Math.cos(angle) * r * 10) / 10, y: Math.round(Math.sin(angle) * r * 10) / 10 };
          }

          function compute() {
            var labels = scope.labels || [];
            var values = scope.values || [];
            var n = labels.length;
            scope.axes = labels.map(function (label, i) {
              var angle = (-Math.PI / 2) + (i / n) * Math.PI * 2;
              var edge = point(angle, 116);
              return {
                label: label,
                x: Math.round(Math.cos(angle) * R),
                y: Math.round(Math.sin(angle) * R),
                lx: Math.round(edge.x),
                ly: Math.round(edge.y),
                anchor: Math.abs(Math.cos(angle)) < 0.25 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end')
              };
            });
            scope.dataPoints = labels.map(function (label, i) {
              var angle = (-Math.PI / 2) + (i / n) * Math.PI * 2;
              var p = point(angle, values[i] || 0);
              return { x: p.x, y: p.y, label: label, value: values[i] || 0 };
            });
            scope.dataPolygon = scope.dataPoints.map(function (p) { return p.x + ',' + p.y; }).join(' ');
          }

          scope.polygonFor = function (lvl) {
            var n = (scope.labels || []).length;
            if (!n) return '';
            var pts = [];
            for (var i = 0; i < n; i++) {
              var angle = (-Math.PI / 2) + (i / n) * Math.PI * 2;
              var p = point(angle, lvl);
              pts.push(p.x + ',' + p.y);
            }
            return pts.join(' ');
          };

          scope.$watchGroup(['labels', 'values'], compute);
          compute();
        }
      };
    }]);

})(angular);
