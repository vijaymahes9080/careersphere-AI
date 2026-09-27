/**
 * CareerSphere AI — Skill Analysis Service
 * Calculates skill strength, category distribution, recency and
 * role coverage / skill gaps from actual evidence.
 *
 * All scores are labeled "CareerSphere analytical estimate" and every
 * score exposes the factors used to compute it.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('SkillAnalysisService', [
      'CareerProfileModel',
      'RelationshipService',
      function (CareerProfileModel, RelationshipService) {

        var STANDARD_CATEGORIES = ['Programming', 'AI/ML', 'IoT', 'Cloud', 'Frontend', 'Backend', 'Database', 'Tools', 'Soft Skills', 'Other'];

        /**
         * Analyze all skills in the profile.
         * @param profile  normalized profile (skills must have evidence attached)
         * @param opts     { relationships, evidence, hasDates }
         */
        function analyze(profile, opts) {
          opts = opts || {};
          var evidence = opts.evidence || { bySkill: {} };
          var relationships = opts.relationships;

          var skills = profile.skills.map(function (skill) {
            return enrichSkill(skill, evidence, relationships, !!opts.hasDates);
          });
          skills.sort(function (a, b) { return b.strength - a.strength; });

          // Category distribution (only categories that actually exist)
          var byCategory = {};
          skills.forEach(function (s) {
            var cat = s.category || 'Other';
            if (!byCategory[cat]) byCategory[cat] = { category: cat, count: 0, strong: 0, withEvidence: 0, totalStrength: 0, skills: [] };
            byCategory[cat].count++;
            if (s.strength >= 70) byCategory[cat].strong++;
            if (s.evidenceCount > 0) byCategory[cat].withEvidence++;
            byCategory[cat].totalStrength += s.strength;
            byCategory[cat].skills.push(s);
          });
          var categories = Object.keys(byCategory).map(function (k) {
            var c = byCategory[k];
            c.avgStrength = c.count ? Math.round(c.totalStrength / c.count) : 0;
            return c;
          }).sort(function (a, b) { return b.count - a.count; });

          // Radar data: average strength per category
          var radar = {
            labels: categories.map(function (c) { return c.category; }),
            values: categories.map(function (c) { return c.avgStrength; })
          };

          var stats = {
            total: skills.length,
            withLevel: skills.filter(function (s) { return !!s.level; }).length,
            withEvidence: skills.filter(function (s) { return s.evidenceCount > 0; }).length,
            unverified: skills.filter(function (s) { return s.confidence !== 'Confirmed' && !s.level; }).length,
            avgStrength: skills.length ? Math.round(skills.reduce(function (sum, s) { return sum + s.strength; }, 0) / skills.length) : 0
          };

          return {
            skills: skills,
            byId: indexById(skills),
            categories: categories,
            availableFilters: STANDARD_CATEGORIES,
            radar: radar,
            stats: stats
          };
        }

        /**
         * Enrich a single skill with strength factors.
         */
        function enrichSkill(skill, evidence, relationships, hasDates) {
          var entries = (evidence.bySkill && evidence.bySkill[skill.id]) || skill.evidence || [];
          var evidenceCount = entries.length;
          var evidenceTypes = [];
          entries.forEach(function (e) { if (evidenceTypes.indexOf(e.type) === -1) evidenceTypes.push(e.type); });
          var evidencePoints = entries.reduce(function (sum, e) { return sum + (e.weight || 1); }, 0);

          var levelValue = CareerProfileModel.levelToValue(skill.level);
          var sources = collectSources(skill, entries);

          var factors = [
            {
              key: 'proficiency',
              label: 'Reported proficiency',
              points: Math.round(((levelValue || 0) / 4) * 35),
              max: 35,
              value: skill.level ? (skill.level + ' (' + levelValue + '/4)') : 'Not provided'
            },
            {
              key: 'evidenceCount',
              label: 'Supporting evidence',
              points: Math.round((Math.min(evidenceCount, 6) / 6) * 30),
              max: 30,
              value: evidenceCount + ' item' + (evidenceCount === 1 ? '' : 's')
            },
            {
              key: 'variety',
              label: 'Evidence variety',
              points: Math.round((Math.min(evidenceTypes.length, 4) / 4) * 20),
              max: 20,
              value: evidenceTypes.length ? evidenceTypes.join(', ') : 'None'
            }
          ];

          var maxPossible = 85;
          if (hasDates) {
            maxPossible = 100;
            factors.push({
              key: 'recency',
              label: 'Recent usage',
              points: 0,
              max: 15,
              value: 'No date information available for this skill'
            });
          }

          var rawPoints = factors.reduce(function (sum, f) { return sum + f.points; }, 0);
          var strength = Math.round((rawPoints / maxPossible) * 100);

          var enriched = angular.extend({}, skill, {
            evidenceCount: evidenceCount,
            evidenceTypes: evidenceTypes,
            evidencePoints: evidencePoints,
            evidence: entries,
            levelValue: levelValue,
            sources: sources,
            strength: Math.min(100, strength),
            strengthFactors: factors,
            strengthNote: 'CareerSphere analytical estimate (' + rawPoints + '/' + maxPossible + ' weighted points)'
          });

          // Target-role relevance
          enriched.roleRelevance = [];

          return enriched;
        }

        function collectSources(skill, entries) {
          var sources = {};
          (skill.source || '').split(', ').forEach(function (s) { if (s && s !== 'unknown' && s !== 'derived') sources[s] = true; });
          entries.forEach(function (e) { if (e.source) sources[e.source] = true; });
          (skill.detectedIn || []).forEach(function (d) { if (d.source) sources[d.source] = true; });
          return Object.keys(sources);
        }

        /**
         * Compare current skills against a selected target role.
         * Requirements come ONLY from imported/user-provided role data.
         */
        function computeCoverage(profile, skillAnalysis, role) {
          if (!role) return null;
          var requirements = role.requirements || [];
          if (!requirements.length) {
            return {
              role: role,
              requirements: [],
              counts: { STRONG: 0, FOUND: 0, PARTIAL: 0, UNVERIFIED: 0, MISSING: 0 },
              coveragePercent: null,
              message: 'No requirement data for "' + role.title + '". Import a target-role dataset (JSON/CSV) to enable gap analysis. CareerSphere does not invent job requirements.',
              source: role.source
            };
          }

          var counts = { STRONG: 0, FOUND: 0, PARTIAL: 0, UNVERIFIED: 0, MISSING: 0 };
          var rows = requirements.map(function (req) {
            var skill = findSkill(profile, req.skill);
            var enriched = skill && skillAnalysis.byId[skill.id];
            var status, weight;
            if (!skill) {
              status = 'MISSING';
              weight = 0;
            } else if (skill.confidence !== 'Confirmed' && (!enriched || enriched.evidenceCount === 0)) {
              status = 'UNVERIFIED';
              weight = 0.25;
            } else if (enriched && enriched.strength >= 70) {
              status = 'STRONG';
              weight = 1;
            } else if (enriched && enriched.strength >= 45) {
              status = 'FOUND';
              weight = 0.75;
            } else {
              status = 'PARTIAL';
              weight = 0.4;
            }
            counts[status]++;
            return {
              skillName: req.skill,
              requiredLevel: req.level || null,
              source: req.source || role.source || 'unknown',
              status: status,
              weight: weight,
              current: enriched ? {
                name: enriched.name,
                level: enriched.level,
                strength: enriched.strength,
                evidenceCount: enriched.evidenceCount,
                sources: enriched.sources
              } : null
            };
          });

          var coveragePercent = Math.round((rows.reduce(function (sum, r) { return sum + r.weight; }, 0) / rows.length) * 100);

          return {
            role: role,
            requirements: rows,
            counts: counts,
            coveragePercent: coveragePercent,
            message: null,
            source: role.source || 'unknown'
          };
        }

        function findSkill(profile, name) {
          for (var i = 0; i < profile.skills.length; i++) {
            if (RelationshipService.namesMatch(profile.skills[i].name, name)) return profile.skills[i];
          }
          return null;
        }

        function indexById(skills) {
          var map = {};
          skills.forEach(function (s) { map[s.id] = s; });
          return map;
        }

        /**
         * Gap list for a coverage result (missing/partial/unverified).
         */
        function gapsFromCoverage(coverage) {
          if (!coverage || !coverage.requirements) return [];
          return coverage.requirements.filter(function (r) {
            return r.status === 'MISSING' || r.status === 'PARTIAL' || r.status === 'UNVERIFIED';
          });
        }

        return {
          analyze: analyze,
          computeCoverage: computeCoverage,
          gapsFromCoverage: gapsFromCoverage,
          STANDARD_CATEGORIES: STANDARD_CATEGORIES
        };
      }
    ]);

})(angular);
