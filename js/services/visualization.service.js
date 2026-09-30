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
       * Skill Network: Projects ↔ Skills ↔ Roles (Tripartite interactive graph)
       */
      function skillNetwork(profile, analyses) {
        var projectRows = (analyses.project ? analyses.project.projects : []).slice(0, 8);
        var skillRows = (analyses.skill ? analyses.skill.skills : []).filter(function (s) {
          return s.evidenceCount > 0 || s.strength > 40;
        }).slice(0, 14);
        var roleRows = (profile.targetRoles || []).slice(0, 6);

        var nodes = [];
        var links = [];
        var projX = 140, skillX = 480, roleX = 820;

        // Column 1: Projects
        projectRows.forEach(function (p, i) {
          var y = 60 + i * (520 / Math.max(1, projectRows.length - 1));
          nodes.push({
            id: 'proj:' + slug(p.name),
            label: p.name,
            col: 'project',
            x: projX,
            y: Math.round(y),
            meta: (p.technologies || []).slice(0, 3).join(', '),
            ref: p
          });
        });

        // Column 2: Skills
        skillRows.forEach(function (s, i) {
          var y = 40 + i * (560 / Math.max(1, skillRows.length - 1));
          nodes.push({
            id: s.id,
            label: s.name,
            col: 'skill',
            x: skillX,
            y: Math.round(y),
            strength: s.strength,
            category: s.category,
            level: s.level,
            ref: s
          });
        });

        // Column 3: Roles
        roleRows.forEach(function (r, i) {
          var y = 80 + i * (480 / Math.max(1, roleRows.length - 1));
          var cov = analyses.coverage && analyses.coverage.role && analyses.coverage.role.title === r.title ? analyses.coverage.coveragePercent : null;
          nodes.push({
            id: 'role:' + slug(r.title),
            label: r.title,
            col: 'role',
            x: roleX,
            y: Math.round(y),
            meta: cov !== null ? ('Coverage ' + cov + '%') : (r.requirements ? (r.requirements.length + ' reqs') : ''),
            ref: r
          });
        });

        var nodeMap = {};
        nodes.forEach(function (n) { nodeMap[n.id] = n; });

        // Links: Project ↔ Skill
        projectRows.forEach(function (p) {
          var pId = 'proj:' + slug(p.name);
          (p.skillsDemonstrated || []).forEach(function (sd) {
            if (nodeMap[sd.id]) {
              links.push({
                source: pId,
                target: sd.id,
                type: 'proj-skill'
              });
            }
          });
        });

        // Links: Skill ↔ Role
        roleRows.forEach(function (r) {
          var rId = 'role:' + slug(r.title);
          (r.requirements || []).forEach(function (req) {
            var skillName = (typeof req === 'string' ? req : req.skill).toLowerCase();
            skillRows.forEach(function (s) {
              if (s.name.toLowerCase() === skillName || s.name.toLowerCase().indexOf(skillName) > -1 || skillName.indexOf(s.name.toLowerCase()) > -1) {
                links.push({
                  source: s.id,
                  target: rId,
                  type: 'skill-role'
                });
              }
            });
          });
        });

        return { nodes: nodes, links: links, nodeMap: nodeMap };
      }

      /**
       * Career 360° View Data (8 radial facets around Career Foundation)
       */
      function career360Data(profile, analyses) {
        var skill = analyses.skill;
        var coverage = analyses.coverage;
        var project = analyses.project;
        var evidence = analyses.evidence;
        var readiness = analyses.readiness;
        var roleMatches = analyses.roleMatches || [];

        var topRole = roleMatches.length ? roleMatches[0] : null;
        var gapsCount = (coverage && coverage.counts) ? (coverage.counts.MISSING + coverage.counts.PARTIAL + coverage.counts.UNVERIFIED) : 0;
        var plan = analyses.learningPlan || [];
        var planDone = plan.filter(function (t) { return t.done; }).length;

        var facets = [
          {
            id: 'skills',
            label: 'Current Skills',
            icon: '◈',
            metric: (skill && skill.stats.total) ? (skill.stats.total + ' Skills') : 'No skills',
            sub: (skill ? skill.stats.avgStrength : 0) + '% Avg Strength',
            status: (skill && skill.stats.avgStrength >= 65) ? 'good' : 'warn',
            angle: 0
          },
          {
            id: 'roles',
            label: 'Career Roles',
            icon: '◎',
            metric: topRole ? topRole.title : (profile.targetRoles.length ? profile.targetRoles[0].title : 'No roles'),
            sub: topRole ? (topRole.coveragePercent + '% Match') : 'Target role',
            status: (topRole && topRole.coveragePercent >= 70) ? 'good' : 'info',
            angle: 45
          },
          {
            id: 'gaps',
            label: 'Skill Gaps',
            icon: '⚠',
            metric: gapsCount + ' Gaps',
            sub: (coverage ? coverage.counts.MISSING : 0) + ' Critical missing',
            status: gapsCount > 0 ? 'warn' : 'good',
            angle: 90
          },
          {
            id: 'learning',
            label: 'Learning Progress',
            icon: '◐',
            metric: plan.length ? (planDone + ' / ' + plan.length + ' Done') : 'No roadmap',
            sub: plan.length ? (Math.round((planDone / plan.length) * 100) + '% Progress') : 'Setup targets',
            status: planDone > 0 ? 'good' : 'info',
            angle: 135
          },
          {
            id: 'projects',
            label: 'Project Evidence',
            icon: '▣',
            metric: (project ? project.stats.total : 0) + ' Projects',
            sub: (project ? project.stats.strength : 0) + '% Strength',
            status: (project && project.stats.strength >= 60) ? 'good' : 'warn',
            angle: 180
          },
          {
            id: 'experience',
            label: 'Experience',
            icon: '💼',
            metric: (profile.experience.length + profile.internships.length) + ' Records',
            sub: profile.internships.length ? (profile.internships[0].role || 'Internship') : 'Practical exp',
            status: (profile.experience.length + profile.internships.length) ? 'good' : 'muted',
            angle: 225
          },
          {
            id: 'education',
            label: 'Education',
            icon: '🎓',
            metric: profile.education.length ? profile.education[0].name : 'Not provided',
            sub: profile.education.length ? (profile.education[0].institution || 'Academic') : 'Formal degree',
            status: profile.education.length ? 'good' : 'muted',
            angle: 270
          },
          {
            id: 'evidence',
            label: 'Evidence Strength',
            icon: '✓',
            metric: (evidence && evidence.overall) ? (evidence.overall.score + '% Strength') : '0%',
            sub: (skill ? skill.stats.withEvidence : 0) + ' Verified skills',
            status: (evidence && evidence.overall && evidence.overall.score >= 50) ? 'good' : 'warn',
            angle: 315
          }
        ];

        return {
          center: {
            title: profile.identity.name || 'You',
            readiness: readiness ? readiness.value : 0,
            label: 'Career Readiness',
            note: 'Analytical Estimate'
          },
          facets: facets
        };
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
        careerJourney: careerJourney,
        career360Data: career360Data
      };
    }]);

})(angular);
