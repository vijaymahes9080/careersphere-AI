/**
 * CareerSphere AI — Visualization Service
 * Prepares node/link datasets for the interactive SVG visualizations:
 *  - Career Intelligence Map (radial, expandable)
 *  - Skill ↔ Project network (bipartite)
 *  - Career journey stages
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('VisualizationService', [function () {

      function slug(s) {
        return (s || '').toLowerCase().replace(/[^a-z0-9+#]/g, '') || 'x';
      }

      /**
       * Career Intelligence Map data.
       * Center = USER, groups = entity types, items = entities.
       * Edges connect items across groups (only meaningful connections).
       */
      function intelMap(profile, analyses) {
        var relationships = analyses.relationships;
        var skill = analyses.skill;

        var groups = [
          {
            id: 'skills', label: 'Skills', color: 'skill',
            items: (skill ? skill.skills : profile.skills).slice(0, 40).map(function (s) {
              return {
                id: 'skill:' + slug(s.name),
                label: s.name,
                meta: (s.level || 'Unverified') + (s.evidenceCount ? ' · ' + s.evidenceCount + ' evidence' : ''),
                strength: s.strength || 0,
                ref: s
              };
            })
          },
          {
            id: 'projects', label: 'Projects', color: 'project',
            items: profile.projects.map(function (p) {
              return { id: 'project:' + slug(p.name), label: p.name, meta: (p.technologies || []).slice(0, 3).join(', '), ref: p };
            })
          },
          {
            id: 'certificates', label: 'Certificates', color: 'certificate',
            items: profile.certificates.map(function (c) {
              return { id: 'cert:' + slug(c.title), label: c.title, meta: c.issuer || '', ref: c };
            })
          },
          {
            id: 'education', label: 'Education', color: 'education',
            items: profile.education.map(function (e, i) {
              return { id: 'edu:' + i, label: e.name || 'Education', meta: e.institution || '', ref: e };
            })
          },
          {
            id: 'experience', label: 'Experience', color: 'experience',
            items: profile.internships.map(function (t) {
              return { id: 'intern:' + slug(t.company + t.role), label: t.role || 'Internship', meta: t.company || '', ref: t };
            }).concat(profile.experience.map(function (t) {
              return { id: 'exp:' + slug(t.company + t.role), label: t.role || 'Experience', meta: t.company || '', ref: t };
            }))
          },
          {
            id: 'goals', label: 'Goals', color: 'goal',
            items: profile.careerGoals.map(function (g, i) {
              return { id: 'goal:' + i, label: g.length > 34 ? g.substring(0, 34) + '…' : g, meta: 'career goal', ref: { text: g } };
            }).concat(profile.interests.slice(0, 6).map(function (interest, i) {
              return { id: 'interest:' + i, label: interest, meta: 'interest', ref: { name: interest } };
            }))
          },
          {
            id: 'roles', label: 'Target Roles', color: 'role',
            items: profile.targetRoles.map(function (r) {
              return {
                id: 'role:' + slug(r.title),
                label: r.title,
                meta: (r.requirements || []).length ? (r.requirements.length + ' requirements') : 'no requirement data',
                ref: r
              };
            })
          },
          {
            id: 'opportunities', label: 'Opportunities', color: 'opportunity',
            items: profile.opportunities.map(function (o, i) {
              return { id: 'opp:' + slug((o.title || 'opp') + (o.company || '')), label: o.title || ('Opportunity ' + (i + 1)), meta: o.company || '', ref: o };
            })
          },
          {
            id: 'gaps', label: 'Skill Gaps', color: 'gap',
            items: (analyses.coverage && analyses.coverage.requirements ? analyses.coverage.requirements : [])
              .filter(function (r) { return r.status === 'MISSING' || r.status === 'PARTIAL' || r.status === 'UNVERIFIED'; })
              .map(function (r) {
                return {
                  id: 'gap:' + slug(r.skillName),
                  label: r.skillName,
                  meta: r.status + ' for ' + analyses.coverage.role.title,
                  ref: r
                };
              })
          },
          {
            id: 'learning', label: 'Learning', color: 'learning',
            items: (analyses.learningPlan || []).map(function (t) {
              return { id: 'learn:' + t.id, label: t.title, meta: 'Week ' + t.week, ref: t };
            })
          }
        ].filter(function (g) { return g.items.length > 0; });

        // Edges among visible items (skill↔project, skill↔cert, role↔skill, etc.)
        var visible = {};
        groups.forEach(function (g) {
          g.items.forEach(function (item) { visible[item.id] = true; });
        });
        var edges = (relationships ? relationships.edges : []).filter(function (e) {
          if (!visible[e.source] || !visible[e.target]) return false;
          if (e.source === 'person:main') return false; // center connects to groups, not items
          // Gap nodes have different id scheme in relationships ('gap:role_skill')
          return ['skill-project', 'skill-certificate', 'skill-internship', 'skill-experience',
            'role-requires-skill', 'role-gap', 'person-education'].indexOf(e.type) > -1 ||
            (e.source.indexOf('skill:') === 0 && e.target.indexOf('role:') === 0) ||
            (e.source.indexOf('role:') === 0 && e.target.indexOf('gap:') === 0);
        });
        // Dedupe gap ids: relationships use gap:<role>_<skill>; map uses gap:<skill>
        var idMap = {};
        groups.forEach(function (g) {
          g.items.forEach(function (item) { idMap[item.id] = item.id; });
        });
        edges = edges.filter(function (e) {
          return idMap[e.source] && idMap[e.target];
        });

        return {
          center: { id: 'you', label: profile.identity.name || 'You', sub: 'Career Profile' },
          groups: groups,
          edges: edges
        };
      }

      /**
       * Skill ↔ Project network (bipartite columns).
       */
      function skillNetwork(profile, analyses) {
        var projectRows = analyses.project ? analyses.project.projects : [];
        var skillRows = (analyses.skill ? analyses.skill.skills : []).filter(function (s) { return s.evidenceCount > 0 || s.strength > 40; });

        var nodes = [];
        var links = [];
        var skillX = 200, projectX = 700;

        skillRows.slice(0, 25).forEach(function (s, i) {
          nodes.push({ id: s.id, label: s.name, col: 'skill', x: skillX, y: 40 + i * (600 / Math.max(1, Math.min(skillRows.length, 25))), strength: s.strength, ref: s });
        });
        projectRows.slice(0, 15).forEach(function (p, i) {
          nodes.push({ id: 'project:' + slug(p.name), label: p.name, col: 'project', x: projectX, y: 40 + i * (600 / Math.max(1, Math.min(projectRows.length, 15))), ref: p });
        });

        var nodeIds = {};
        nodes.forEach(function (n) { nodeIds[n.id] = true; });
        projectRows.forEach(function (p) {
          (p.skillsDemonstrated || []).forEach(function (sd) {
            if (nodeIds[sd.id]) links.push({ source: sd.id, target: 'project:' + slug(p.name) });
          });
        });

        return { nodes: nodes, links: links };
      }

      /**
       * Career journey stages for the Career Map page.
       */
      function careerJourney(profile, analyses) {
        var skill = analyses.skill;
        return [
          {
            id: 'current', title: 'Current State',
            items: [
              profile.identity.name ? 'Name: ' + profile.identity.name : 'Identity not provided',
              profile.education.length ? 'Education: ' + profile.education.map(function (e) { return e.name; }).join(', ') : 'Education not recorded',
              skill && skill.stats.total ? skill.stats.total + ' skills (avg strength ' + skill.stats.avgStrength + '%)' : 'No skills yet'
            ]
          },
          {
            id: 'skilldev', title: 'Skill Development',
            items: (analyses.coverage && analyses.coverage.requirements ? analyses.coverage.requirements : [])
              .filter(function (r) { return r.status !== 'STRONG'; })
              .slice(0, 6)
              .map(function (r) { return r.skillName + ' — ' + r.status; })
              .concat((analyses.learningPlan || []).length ? [] : ['Import a target-role dataset to plan skill development'])
          },
          {
            id: 'projects', title: 'Project Development',
            items: (analyses.project ? analyses.project.projects : []).slice(0, 5).map(function (p) {
              return p.name + (p.skillsDemonstrated.length ? ' (' + p.skillsDemonstrated.length + ' skills)' : ' (no skill mapping)');
            }).concat((analyses.project && analyses.project.projects.length) ? [] : ['No projects imported yet'])
          },
          {
            id: 'experience', title: 'Experience',
            items: profile.internships.map(function (t) { return 'Internship: ' + t.role + (t.company ? ' @ ' + t.company : ''); })
              .concat(profile.experience.map(function (e) { return 'Role: ' + e.role + (e.company ? ' @ ' + e.company : ''); }))
              .concat((profile.internships.length + profile.experience.length) ? [] : ['No experience records yet'])
          },
          {
            id: 'target', title: 'Target Role',
            items: profile.targetRoles.length
              ? profile.targetRoles.map(function (r) {
                var cov = analyses.coverage && analyses.coverage.role && analyses.coverage.role.title === r.title ? analyses.coverage.coveragePercent : null;
                return r.title + (cov !== null ? ' — coverage ' + cov + '%' : (r.requirements.length ? '' : ' (no requirement data)'));
              })
              : ['No target roles imported']
          },
          {
            id: 'future', title: 'Future Direction',
            items: profile.careerGoals.length ? profile.careerGoals.slice(0, 4) : ['No career goals recorded — add a goals note in Data Center']
          }
        ];
      }

      return {
        intelMap: intelMap,
        skillNetwork: skillNetwork,
        careerJourney: careerJourney
      };
    }]);

})(angular);
