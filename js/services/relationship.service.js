/**
 * CareerSphere AI — Relationship Service
 * Builds the career relationship graph from the normalized profile:
 *   person → education → skills → projects → certificates → internships
 *   → target roles → skill gaps → learning path
 * All edges are derived from actual data — nothing is fabricated.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('RelationshipService', [function () {

      function norm(s) {
        return (s || '').toLowerCase().replace(/[^a-z0-9+#]/g, '');
      }

      function slug(s) {
        return norm(s) || 'x';
      }

      function namesMatch(a, b) {
        var na = norm(a), nb = norm(b);
        if (!na || !nb) return false;
        if (na === nb) return true;
        // Containment only counts when the contained fragment is meaningful
        // and the names are close in length — so "R"/"Go" never match inside
        // longer words, and "java" does not claim "javascript".
        var shorter = na.length <= nb.length ? na : nb;
        var longer = na.length <= nb.length ? nb : na;
        if (shorter.length >= 3 && longer.length - shorter.length <= 4 && longer.indexOf(shorter) > -1) return true;
        return false;
      }

      /**
       * Word-boundary aware containment check on a lowercased haystack.
       * Prevents single/double-letter skill names ("R", "Go", "C#") from
       * matching inside unrelated words ("role", "algorithms", "falcon").
       */
      function containsWord(lowerHaystack, term) {
        if (!lowerHaystack || !term) return false;
        var t = String(term).toLowerCase();
        var idx = lowerHaystack.indexOf(t);
        while (idx !== -1) {
          var before = idx === 0 ? '' : lowerHaystack.charAt(idx - 1);
          var afterPos = idx + t.length;
          var after = afterPos >= lowerHaystack.length ? '' : lowerHaystack.charAt(afterPos);
          var startOk = before === '' || !/[a-z0-9_]/i.test(before);
          var endOk = after === '' || !/[a-z0-9_]/i.test(after) ||
            // Tolerate plural "s" (project → projects), reject mid-word (java → javascript)
            (after === 's' && (afterPos + 1 >= lowerHaystack.length || !/[a-z0-9_]/i.test(lowerHaystack.charAt(afterPos + 1))));
          if (startOk && endOk) return true;
          idx = lowerHaystack.indexOf(t, idx + 1);
        }
        return false;
      }

      /**
       * Build the full relationship graph.
       * @returns { nodes, edges, skillsForProject, projectsForSkill,
       *            rolesForSkill, certsForSkill, internshipsForSkill,
       *            experienceForSkill, relatedRolesForProject }
       */
      function build(profile) {
        var nodes = [];
        var edges = [];
        var edgeKeys = {};

        function addNode(id, type, label, ref) {
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) return nodes[i];
          }
          var node = { id: id, type: type, label: label, ref: ref };
          nodes.push(node);
          return node;
        }

        function addEdge(source, target, type) {
          var key = source + '>' + target;
          if (edgeKeys[key]) return;
          edgeKeys[key] = true;
          edges.push({ source: source, target: target, type: type });
        }

        // Person
        var personId = 'person:main';
        addNode(personId, 'person', profile.identity.name || 'You', profile.identity);

        // Education
        profile.education.forEach(function (edu, i) {
          var id = 'edu:' + i;
          addNode(id, 'education', edu.name || 'Education', edu);
          addEdge(personId, id, 'person-education');
        });

        // Skills
        profile.skills.forEach(function (skill) {
          var id = 'skill:' + slug(skill.name);
          addNode(id, 'skill', skill.name, skill);
          addEdge(personId, id, 'person-skill');
        });

        // Projects → skill edges
        profile.projects.forEach(function (proj) {
          var projId = 'project:' + slug(proj.name);
          addNode(projId, 'project', proj.name, proj);
          addEdge(personId, projId, 'person-project');

          var matchedSkills = matchSkillsToProject(profile, proj);
          proj._matchedSkills = matchedSkills;
          matchedSkills.forEach(function (sk) {
            addEdge('skill:' + slug(sk.name), projId, 'skill-project');
          });
        });

        // Certificates → skill edges
        profile.certificates.forEach(function (cert) {
          var certId = 'cert:' + slug(cert.title);
          addNode(certId, 'certificate', cert.title, cert);
          addEdge(personId, certId, 'person-certificate');
          var matched = [];
          (cert.skills || []).forEach(function (skName) {
            var sk = findSkill(profile, skName);
            if (sk) {
              matched.push(sk);
              addEdge('skill:' + slug(sk.name), certId, 'skill-certificate');
            } else {
              // Requirement-like unknown skill: still link as detected
              var detId = 'skill:' + slug(skName);
              addNode(detId, 'skill', skName, { name: skName, confidence: 'Detected', level: null, evidence: [], category: 'Other' });
              addEdge(detId, certId, 'skill-certificate');
            }
          });
          cert._matchedSkills = matched;
        });

        // Internships → skill edges
        profile.internships.forEach(function (intern) {
          var id = 'intern:' + slug(intern.company + intern.role);
          addNode(id, 'internship', (intern.role || 'Internship') + (intern.company ? ' @ ' + intern.company : ''), intern);
          addEdge(personId, id, 'person-internship');
          var matched = matchTextToSkills(profile, (intern.description || '') + ' ' + (intern.role || ''));
          matched.forEach(function (sk) {
            addEdge('skill:' + slug(sk.name), id, 'skill-internship');
          });
          intern._matchedSkills = matched;
        });

        // Experience → skill edges
        profile.experience.forEach(function (exp) {
          var id = 'exp:' + slug(exp.company + exp.role);
          addNode(id, 'experience', (exp.role || 'Experience') + (exp.company ? ' @ ' + exp.company : ''), exp);
          addEdge(personId, id, 'person-experience');
          var matched = matchTextToSkills(profile, (exp.description || '') + ' ' + (exp.role || ''));
          matched.forEach(function (sk) {
            addEdge('skill:' + slug(sk.name), id, 'skill-experience');
          });
          exp._matchedSkills = matched;
        });

        // Interests / goals
        profile.interests.forEach(function (interest, i) {
          var id = 'interest:' + i;
          addNode(id, 'interest', interest, { name: interest });
          addEdge(personId, id, 'person-interest');
        });
        profile.careerGoals.forEach(function (goal, i) {
          var id = 'goal:' + i;
          addNode(id, 'goal', goal.length > 40 ? goal.substring(0, 40) + '…' : goal, { text: goal });
          addEdge(personId, id, 'person-goal');
        });

        // Target roles → requirement skill edges (+ gap nodes)
        profile.targetRoles.forEach(function (role) {
          var roleId = 'role:' + slug(role.title);
          addNode(roleId, 'role', role.title, role);
          addEdge(personId, roleId, 'person-role');

          (role.requirements || []).forEach(function (req) {
            var skill = findSkill(profile, req.skill);
            if (skill) {
              addEdge(roleId, 'skill:' + slug(skill.name), 'role-requires-skill');
            } else {
              // Missing skill → gap node
              var gapId = 'gap:' + slug(role.title) + '_' + slug(req.skill);
              addNode(gapId, 'gap', req.skill, { name: req.skill, role: role.title, source: req.source });
              addEdge(roleId, gapId, 'role-gap');
            }
          });
        });

        // Opportunities
        profile.opportunities.forEach(function (opp, i) {
          var id = 'opp:' + slug((opp.title || 'opp') + (opp.company || ''));
          addNode(id, 'opportunity', opp.title || ('Opportunity ' + (i + 1)), opp);
          addEdge(personId, id, 'person-opportunity');
        });

        // Learning path nodes (from learning history)
        profile.learningHistory.forEach(function (item, i) {
          var id = 'learn:' + i;
          addNode(id, 'learning', item.topic || item.name || ('Topic ' + (i + 1)), item);
          addEdge(personId, id, 'person-learning');
        });

        return {
          nodes: nodes,
          edges: edges,
          skillsForProject: function (proj) {
            return proj._matchedSkills || matchSkillsToProject(profile, proj);
          },
          projectsForSkill: function (skill) {
            return profile.projects.filter(function (p) {
              return matchSkillsToProject(profile, p).some(function (s) { return s.id === skill.id; });
            });
          },
          certsForSkill: function (skill) {
            return profile.certificates.filter(function (c) {
              return (c.skills || []).some(function (s) { return namesMatch(s, skill.name); });
            });
          },
          internshipsForSkill: function (skill) {
            return profile.internships.filter(function (i) {
              return matchTextToSkills(profile, (i.description || '') + ' ' + (i.role || '')).some(function (s) { return s.id === skill.id; });
            });
          },
          experienceForSkill: function (skill) {
            return profile.experience.filter(function (e) {
              return matchTextToSkills(profile, (e.description || '') + ' ' + (e.role || '')).some(function (s) { return s.id === skill.id; });
            });
          },
          rolesForSkill: function (skill) {
            return profile.targetRoles.filter(function (r) {
              return (r.requirements || []).some(function (req) { return namesMatch(req.skill, skill.name); });
            });
          },
          relatedRolesForProject: function (proj) {
            return profile.targetRoles.filter(function (r) {
              var projTerms = (proj.technologies || []).concat((proj.skills || []), [proj.name]);
              return (r.requirements || []).some(function (req) {
                return projTerms.some(function (t) { return namesMatch(t, req.skill); });
              });
            });
          }
        };
      }

      function findSkill(profile, name) {
        for (var i = 0; i < profile.skills.length; i++) {
          if (namesMatch(profile.skills[i].name, name)) return profile.skills[i];
        }
        return null;
      }

      function matchSkillsToProject(profile, proj) {
        var terms = (proj.technologies || []).concat(proj.skills || []);
        if (proj.description) terms = terms.concat([proj.description]);
        var matched = [];
        profile.skills.forEach(function (skill) {
          var hit = terms.some(function (t) {
            if (!t) return false;
            if (namesMatch(t, skill.name)) return true;
            // Free-text term (description): require whole-word match
            return containsWord(String(t).toLowerCase(), skill.name);
          });
          if (hit) matched.push(skill);
        });
        return matched;
      }

      function matchTextToSkills(profile, text) {
        if (!text) return [];
        var lower = text.toLowerCase();
        var matched = [];
        profile.skills.forEach(function (skill) {
          if (skill.name && containsWord(lower, skill.name)) {
            matched.push(skill);
          }
        });
        return matched;
      }

      return {
        build: build,
        namesMatch: namesMatch,
        containsWord: containsWord,
        normalizeName: norm
      };
    }]);

})(angular);
