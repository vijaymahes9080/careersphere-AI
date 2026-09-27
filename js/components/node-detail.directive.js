/**
 * CareerSphere AI — Node Detail Panel
 * Shows description, evidence, related entities, source, confidence and
 * a recommended next action for any selected graph node.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.components')
    .directive('csNodeDetail', ['ProfileService', function (ProfileService) {
      return {
        restrict: 'E',
        scope: {
          node: '='
        },
        template:
          '<div class="node-detail" ng-if="node">' +
          '  <div class="nd-head">' +
          '    <span class="nd-type nd-type-{{node.type}}">{{node.group || node.type}}</span>' +
          '    <button type="button" class="nd-close" ng-click="close()" aria-label="Close details">×</button>' +
          '  </div>' +
          '  <h4>{{node.label}}</h4>' +
          '  <p class="nd-desc" ng-if="detail.description">{{detail.description}}</p>' +

          '  <div class="nd-grid">' +
          '    <div ng-if="detail.confidence" class="nd-field"><span>Confidence</span><strong class="pill pill-{{detail.confidence | lowercase}}">{{detail.confidence}}</strong></div>' +
          '    <div ng-if="detail.level" class="nd-field"><span>Proficiency</span><strong>{{detail.level}}</strong></div>' +
          '    <div ng-if="detail.strength !== null" class="nd-field"><span>Strength</span><strong>{{detail.strength}}% <em class="muted">(est.)</em></strong></div>' +
          '    <div ng-if="detail.source" class="nd-field nd-wide"><span>Source</span><strong>{{detail.source}}</strong></div>' +
          '  </div>' +

          '  <div ng-if="detail.factors.length" class="nd-section">' +
          '    <h5>Strength factors <em class="muted">(CareerSphere analytical estimate)</em></h5>' +
          '    <div class="factor" ng-repeat="f in detail.factors">' +
          '      <div class="factor-top"><span>{{f.label}}</span><span>{{f.points}}/{{f.max}}</span></div>' +
          '      <div class="bar"><div class="bar-fill" ng-style="{width: (f.points / f.max * 100) + \'%\'}"></div></div>' +
          '      <div class="factor-val muted">{{f.value}}</div>' +
          '    </div>' +
          '  </div>' +

          '  <div ng-if="detail.evidence.length" class="nd-section">' +
          '    <h5>Evidence ({{detail.evidence.length}})</h5>' +
          '    <ul class="evi-list">' +
          '      <li ng-repeat="e in detail.evidence">✓ <strong>{{e.type}}:</strong> {{e.title}} <span class="muted">— source: {{e.source}}</span></li>' +
          '    </ul>' +
          '  </div>' +

          '  <div ng-if="detail.related.length" class="nd-section">' +
          '    <h5>Related entities</h5>' +
          '    <ul class="rel-list">' +
          '      <li ng-repeat="r in detail.related"><span class="pill-lite">{{r.kind}}</span> {{r.label}}</li>' +
          '    </ul>' +
          '  </div>' +

          '  <div ng-if="detail.gaps.length" class="nd-section">' +
          '    <h5>Requirements / gaps</h5>' +
          '    <ul class="rel-list">' +
          '      <li ng-repeat="g in detail.gaps"><span class="status-{{g.status | lowercase}}">{{g.status}}</span> {{g.skillName}} <span class="muted">(source: {{g.source}})</span></li>' +
          '    </ul>' +
          '  </div>' +

          '  <div ng-if="detail.nextActions.length" class="nd-section nd-actions">' +
          '    <h5>Recommended next action</h5>' +
          '    <ul class="action-list">' +
          '      <li ng-repeat="a in detail.nextActions">{{a}}</li>' +
          '    </ul>' +
          '  </div>' +
          '</div>',
        link: function (scope) {
          scope.detail = { description: '', confidence: '', level: null, strength: null, source: '', factors: [], evidence: [], related: [], gaps: [], nextActions: [] };

          scope.$watch('node', function (node) {
            scope.detail = node ? buildDetail(node) : emptyDetail();
          });

          scope.close = function () {
            scope.node = null;
          };

          function emptyDetail() {
            return { description: '', confidence: '', level: null, strength: null, source: '', factors: [], evidence: [], related: [], gaps: [], nextActions: [] };
          }

          function buildDetail(node) {
            var d = emptyDetail();
            var profile = ProfileService.state.profile;
            var analyses = ProfileService.state.analyses;
            if (!analyses) return d;
            var ref = node.ref;

            switch (node.type) {
              case 'person':
                d.description = profile.identity.summary || 'No summary provided.';
                d.source = profile.sourceDocuments.map(function (s) { return s.name; }).join(', ') || 'No sources imported';
                d.related = [
                  { kind: 'Skills', label: profile.skills.length + ' total' },
                  { kind: 'Projects', label: profile.projects.length + ' total' },
                  { kind: 'Certificates', label: profile.certificates.length + ' total' },
                  { kind: 'Target roles', label: profile.targetRoles.length + ' configured' }
                ];
                d.nextActions = [
                  profile.targetRoles.length === 0 ? 'Import a target-role dataset so gap analysis can run.' : 'Open Skill Intelligence to review coverage.'
                ];
                break;

              case 'skills':
                var s = analyses.skill.byId[skillId(node.id, profile)] || ref;
                if (s) {
                  d.description = s.category ? 'Category: ' + s.category : '';
                  d.confidence = s.confidence || 'Detected';
                  d.level = s.level || 'Not provided';
                  d.strength = s.strength || 0;
                  d.source = (s.sources && s.sources.length) ? s.sources.join(', ') : (s.source || 'unknown');
                  d.factors = s.strengthFactors || [];
                  d.evidence = s.evidence || [];
                  d.related = (analyses.relationships.rolesForSkill(s).map(function (r) { return { kind: 'Target role', label: r.title }; }))
                    .concat((analyses.relationships.projectsForSkill(s) || []).map(function (p) { return { kind: 'Project', label: p.name }; }))
                    .slice(0, 8);
                  d.nextActions = nextActionsForSkill(s, profile);
                }
                break;

              case 'projects':
                if (ref) {
                  d.description = ref.description || 'No description provided.';
                  d.source = ref.source || 'unknown';
                  d.strength = null;
                  d.confidence = 'Confirmed';
                  d.related = (ref.technologies || []).map(function (t) { return { kind: 'Technology', label: t }; })
                    .concat((ref.skillsDemonstrated || []).map(function (s) { return { kind: 'Skill', label: s.name }; }))
                    .concat((ref.relatedRoles || []).map(function (r) { return { kind: 'Target role', label: r.title }; }));
                  d.gaps = (ref.missingDocumentation || []).map(function (m) { return { status: 'MISSING', skillName: m, source: 'documentation check' }; });
                  d.nextActions = (ref.improvementOpportunities || []).slice(0, 3);
                }
                break;

              case 'certificates':
                if (ref) {
                  d.description = (ref.issuer || 'Unknown issuer') + (ref.date ? ' · ' + ref.date : '');
                  d.confidence = 'Confirmed';
                  d.source = ref.source || 'unknown';
                  d.related = (ref.skills || []).map(function (sk) { return { kind: 'Skill', label: sk }; })
                    .concat((ref.relatedRoles || []).map(function (r) { return { kind: 'Role', label: r.title }; }));
                  d.nextActions = ['Link this certificate\'s skills to a project so the evidence chain is complete.'];
                }
                break;

              case 'education':
                if (ref) {
                  d.description = [ref.institution, ref.year].filter(Boolean).join(' · ');
                  d.confidence = 'Confirmed';
                  d.source = ref.source || 'unknown';
                  d.nextActions = [];
                }
                break;

              case 'experience':
                if (ref) {
                  d.description = [ref.company, ref.duration, ref.description].filter(Boolean).join(' · ');
                  d.confidence = 'Confirmed';
                  d.source = ref.source || 'unknown';
                  d.evidence = (ref._matchedSkills || []).map(function (sk) {
                    return { type: 'Experience', title: sk.name, source: ref.source };
                  });
                  d.nextActions = ['Add measurable outcomes to this entry to strengthen evidence.'];
                }
                break;

              case 'goals':
                d.description = ref ? (ref.text || ref.name || '') : '';
                d.confidence = 'Confirmed';
                d.nextActions = ['Keep goals aligned with a target role so learning priorities can be generated.'];
                break;

              case 'roles':
                if (ref) {
                  d.description = ref.requirements && ref.requirements.length
                    ? ref.requirements.length + ' requirements imported.'
                    : 'No requirement data — CareerSphere does not invent job requirements.';
                  d.source = ref.source || 'unknown';
                  d.gaps = (analyses.coverage && analyses.coverage.role === ref) ? analyses.coverage.requirements : [];
                  d.nextActions = ref.requirements && ref.requirements.length
                    ? ['Open Skill Intelligence to see FOUND / STRONG / PARTIAL / MISSING statuses.']
                    : ['Import a role profile (JSON/CSV) with this role\'s requirements.'];
                }
                break;

              case 'gaps':
                if (ref) {
                  d.description = 'Required for ' + ref.role + '. Status: ' + ref.status;
                  d.confidence = ref.current ? 'Confirmed' : 'Detected';
                  d.source = ref.source || 'unknown';
                  d.level = ref.current ? (ref.current.level || 'Unverified') : null;
                  d.strength = ref.current ? ref.current.strength : null;
                  d.nextActions = [
                    'Add "' + ref.skillName + '" to your learning roadmap (Learning page).',
                    'Build a small project using ' + ref.skillName + ' to create evidence.'
                  ];
                }
                break;

              case 'learning':
                if (ref) {
                  d.description = 'Roadmap topic for ' + ref.role + ' (' + ref.status + ')';
                  d.source = ref.source || 'derived from gap analysis';
                  d.related = ref.steps.map(function (st) { return { kind: 'Step', label: st }; });
                  d.nextActions = ['Complete the steps and check off the topic on the Learning page.'];
                }
                break;

              case 'opportunities':
                if (ref) {
                  d.description = [ref.company, ref.location, ref.experienceRequirement].filter(Boolean).join(' · ');
                  d.source = ref.source || 'unknown';
                  d.related = (ref.requiredSkills || []).map(function (r) { return { kind: 'Requires', label: typeof r === 'string' ? r : r.skill }; });
                  d.nextActions = ['Open the Opportunities page for matched/partial/missing analysis.'];
                }
                break;

              default:
                d.description = node.meta || '';
            }
            return d;
          }

          function skillId(id, profile) {
            // id is 'skill:<slug>' — find the real skill
            var slug = id.replace('skill:', '');
            for (var i = 0; i < profile.skills.length; i++) {
              var sn = profile.skills[i].name.toLowerCase().replace(/[^a-z0-9+#]/g, '');
              if (sn === slug) return profile.skills[i].id;
            }
            return slug;
          }

          function nextActionsForSkill(s, profile) {
            var actions = [];
            if (!s.level) actions.push('Proficiency level not provided — add it in a notes/skill dataset to improve accuracy.');
            if (s.evidenceCount === 0) actions.push('No supporting evidence — build a project or add a certificate that uses ' + s.name + '.');
            if (s.evidenceCount > 0 && s.strength < 70) actions.push('Evidence exists but strength is modest — deepen usage (advanced project, larger scope).');
            var roleRelevance = s.roleRelevance || [];
            if (roleRelevance.length === 0 && profile.targetRoles.length > 0) {
              actions.push('This skill does not appear in any configured target-role requirements.');
            }
            if (!actions.length) actions.push('Maintain: keep using ' + s.name + ' in current projects.');
            return actions;
          }
        }
      };
    }]);

})(angular);
