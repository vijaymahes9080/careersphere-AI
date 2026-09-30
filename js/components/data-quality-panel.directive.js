/**
 * CareerSphere AI — Data Quality Panel Directive
 * Displays data audit metrics: records analyzed, sources, extracted skills, unmapped items, and confidence.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csDataQualityPanel', [function () {
      return {
        restrict: 'E',
        scope: {
          metrics: '='       // { recordsAnalyzed, sourcesDetected, skillsExtracted, skillsMapped, unmappedItems, missingFields, confidence, status }
        },
        template:
          '<div class="data-quality-container">' +
          '  <div class="dq-grid">' +
          '    <div class="dq-card panel">' +
          '      <span class="dq-val">{{metrics.recordsAnalyzed || 0}}</span>' +
          '      <span class="dq-lbl">Records Analyzed</span>' +
          '    </div>' +
          '    <div class="dq-card panel">' +
          '      <span class="dq-val">{{metrics.sourcesDetected || 0}}</span>' +
          '      <span class="dq-lbl">Sources Detected</span>' +
          '    </div>' +
          '    <div class="dq-card panel">' +
          '      <span class="dq-val">{{metrics.skillsExtracted || 0}}</span>' +
          '      <span class="dq-lbl">Skills Extracted</span>' +
          '    </div>' +
          '    <div class="dq-card panel">' +
          '      <span class="dq-val good">{{metrics.skillsMapped || 0}}</span>' +
          '      <span class="dq-lbl">Skills Mapped</span>' +
          '    </div>' +
          '    <div class="dq-card panel">' +
          '      <span class="dq-val" ng-class="metrics.unmappedItems ? \'warn\' : \'good\'">{{metrics.unmappedItems || 0}}</span>' +
          '      <span class="dq-lbl">Unmapped Items</span>' +
          '    </div>' +
          '    <div class="dq-card panel">' +
          '      <span class="dq-val" ng-class="metrics.missingFields ? \'warn\' : \'good\'">{{metrics.missingFields || 0}}</span>' +
          '      <span class="dq-lbl">Missing Fields</span>' +
          '    </div>' +
          '  </div>' +
          '  <div class="dq-confidence-banner panel">' +
          '    <div class="dq-conf-left">' +
          '      <span class="badge" ng-class="metrics.confidence >= 80 ? \'badge-good\' : \'badge-warn\'">{{metrics.status}}</span>' +
          '      <p class="muted small">Data Quality &amp; Extraction Confidence Index</p>' +
          '    </div>' +
          '    <div class="dq-conf-num" ng-class="metrics.confidence >= 80 ? \'good\' : \'warn\'">{{metrics.confidence}}%</div>' +
          '  </div>' +
          '</div>'
      };
    }]);

})(angular);
