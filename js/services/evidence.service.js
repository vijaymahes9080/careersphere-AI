/**
 * CareerSphere AI — Evidence Service
 * Every analytical claim must be traceable. This service builds evidence
 * entries for each skill from projects, internships, experience and
 * certificates, and computes a transparent evidence strength estimate.
 *
 * Evidence weights (shown to the user):
 *   Project 3 · Internship 4 · Experience 4 · Certificate 2
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('EvidenceService', ['RelationshipService', function (RelationshipService) {

      var WEIGHTS = { 'Project': 3, 'Internship': 4, 'Experience': 4, 'Certificate': 2 };

      /**
       * Build evidence for the whole profile.
       * Also writes skill.evidence entries back into the profile model.
       */
      function build(profile, relationships) {
        var bySkill = {};
        profile.skills.forEach(function (skill) { bySkill[skill.id] = []; });

        function push(skill, entry) {
          if (!bySkill[skill.id]) bySkill[skill.id] = [];
          var exists = bySkill[skill.id].some(function (e) {
            return e.type === entry.type && e.title === entry.title;
          });
          if (!exists) bySkill[skill.id].push(entry);
        }

        function skillByName(name) {
          for (var i = 0; i < profile.skills.length; i++) {
            if (RelationshipService.namesMatch(profile.skills[i].name, name)) return profile.skills[i];
          }
          return null;
        }

        // Projects → skills
        profile.projects.forEach(function (proj) {
          var techs = proj.technologies || [];
          var terms = techs.concat([proj.name, proj.description || '']);
          profile.skills.forEach(function (skill) {
            var hit = terms.some(function (t) {
              return t && RelationshipService.namesMatch(t, skill.name);
            });
            // Also allow skill name inside project description (whole word only)
            if (!hit && proj.description && RelationshipService.containsWord(proj.description.toLowerCase(), skill.name)) hit = true;
            if (hit) {
              push(skill, {
                type: 'Project',
                title: proj.name,
                source: proj.source || 'unknown',
                detail: techs.length ? 'Uses: ' + techs.join(', ') : (proj.description || '').substring(0, 120),
                weight: WEIGHTS['Project']
              });
            }
          });
        });

        // Certificates → skills
        profile.certificates.forEach(function (cert) {
          (cert.skills || []).forEach(function (skName) {
            var skill = skillByName(skName);
            if (skill) {
              push(skill, {
                type: 'Certificate',
                title: cert.title + (cert.issuer ? ' — ' + cert.issuer : ''),
                source: cert.source || 'unknown',
                detail: cert.date ? 'Issued ' + cert.date : 'Certificate evidence',
                weight: WEIGHTS['Certificate']
              });
            }
          });
        });

        // Internships → skills (description/role text scan)
        profile.internships.forEach(function (intern) {
          var text = ((intern.description || '') + ' ' + (intern.role || '')).toLowerCase();
          profile.skills.forEach(function (skill) {
            if (RelationshipService.containsWord(text, skill.name)) {
              push(skill, {
                type: 'Internship',
                title: (intern.role || 'Internship') + (intern.company ? ' @ ' + intern.company : ''),
                source: intern.source || 'unknown',
                detail: (intern.description || '').substring(0, 120),
                weight: WEIGHTS['Internship']
              });
            }
          });
        });

        // Experience → skills
        profile.experience.forEach(function (exp) {
          var text = ((exp.description || '') + ' ' + (exp.role || '')).toLowerCase();
          profile.skills.forEach(function (skill) {
            if (RelationshipService.containsWord(text, skill.name)) {
              push(skill, {
                type: 'Experience',
                title: (exp.role || 'Experience') + (exp.company ? ' @ ' + exp.company : ''),
                source: exp.source || 'unknown',
                detail: (exp.description || '').substring(0, 120),
                weight: WEIGHTS['Experience']
              });
            }
          });
        });

        // Write evidence back into the profile model
        profile.skills.forEach(function (skill) {
          skill.evidence = bySkill[skill.id] || [];
        });

        // Flat evidence list for the Evidence page
        var list = [];
        profile.skills.forEach(function (skill) {
          var entries = bySkill[skill.id] || [];
          if (entries.length) {
            list.push({
              skill: skill,
              entries: entries,
              points: weightedPoints(entries),
              types: distinctTypes(entries),
              sources: distinctSources(entries)
            });
          }
        });
        list.sort(function (a, b) { return b.points - a.points; });

        // Overall evidence strength (transparent calculation)
        var withEvidence = list.length;
        var total = profile.skills.length || 1;
        var coverage = withEvidence / total;
        var avgPoints = list.length
          ? list.reduce(function (sum, item) { return sum + item.points; }, 0) / list.length
          : 0;
        var quality = Math.min(avgPoints / 6, 1); // 6+ weighted points = full quality
        var overall = total === 0 || profile.skills.length === 0 ? null : Math.round((coverage * 0.5 + quality * 0.5) * 100);

        return {
          bySkill: bySkill,
          list: list,
          overall: overall === null ? null : {
            score: overall,
            factors: [
              { label: 'Skills with supporting evidence', value: Math.round(coverage * 100) + '%', points: Math.round(coverage * 50), max: 50, detail: withEvidence + ' of ' + profile.skills.length + ' skills' },
              { label: 'Average evidence weight per skill', value: avgPoints.toFixed(1) + ' pts', points: Math.round(quality * 50), max: 50, detail: 'weights: ' + Object.keys(WEIGHTS).map(function (k) { return k + ' ' + WEIGHTS[k]; }).join(', ') }
            ],
            note: 'CareerSphere analytical estimate — based on weighted supporting evidence, not an objective truth.'
          }
        };
      }

      function weightedPoints(entries) {
        return entries.reduce(function (sum, e) { return sum + (e.weight || 1); }, 0);
      }

      function distinctTypes(entries) {
        var seen = {};
        entries.forEach(function (e) { seen[e.type] = true; });
        return Object.keys(seen);
      }

      function distinctSources(entries) {
        var seen = {};
        entries.forEach(function (e) { if (e.source) seen[e.source] = true; });
        return Object.keys(seen);
      }

      return {
        build: build,
        WEIGHTS: WEIGHTS
      };
    }]);

})(angular);
