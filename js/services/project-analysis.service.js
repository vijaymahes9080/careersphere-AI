/**
 * CareerSphere AI — Project Analysis Service
 * Per-project intelligence: skills demonstrated, domain, complexity
 * (labeled as estimate), role relevance, missing documentation and
 * improvement opportunities.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('ProjectAnalysisService', ['RelationshipService', function (RelationshipService) {

      function analyze(profile, skillAnalysis, relationships) {
        var projects = profile.projects.map(function (proj) {
          return enrichProject(proj, profile, skillAnalysis, relationships);
        });

        var documented = projects.filter(function (p) { return p.missingDocumentation.length === 0; }).length;
        var avgComplexity = projects.length
          ? Math.round(projects.reduce(function (sum, p) { return sum + p.complexityScore; }, 0) / projects.length)
          : 0;

        return {
          projects: projects,
          stats: {
            total: projects.length,
            documented: documented,
            withSkills: projects.filter(function (p) { return p.skillsDemonstrated.length > 0; }).length,
            withRoles: projects.filter(function (p) { return p.relatedRoles.length > 0; }).length,
            avgComplexity: avgComplexity,
            strength: projects.length ? Math.round(
              projects.reduce(function (sum, p) { return sum + projectScore(p); }, 0) / projects.length
            ) : null
          }
        };
      }

      function enrichProject(proj, profile, skillAnalysis, relationships) {
        var techs = proj.technologies || [];
        var terms = techs.concat([proj.name, proj.description || '']);

        // Skills demonstrated: match profile skills against project terms
        var skillsDemonstrated = profile.skills.filter(function (skill) {
          var hit = terms.some(function (t) { return t && RelationshipService.namesMatch(t, skill.name); });
          if (!hit && proj.description && RelationshipService.containsWord(proj.description.toLowerCase(), skill.name)) hit = true;
          return hit;
        }).map(function (skill) {
          var enriched = skillAnalysis.byId[skill.id];
          return {
            id: skill.id,
            name: skill.name,
            level: skill.level,
            strength: enriched ? enriched.strength : 0,
            evidenceCount: enriched ? enriched.evidenceCount : 0
          };
        });

        // Related target roles (via requirement overlap — data-driven only)
        var relatedRoles = (relationships ? relationships.relatedRolesForProject(proj) : []).map(function (r) {
          return { id: 'role:' + r.title.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: r.title };
        });

        // Missing documentation (what data is absent — not invented)
        var missingDocumentation = [];
        if (!proj.description || proj.description.trim().length < 20) missingDocumentation.push('No meaningful description');
        if (!techs.length) missingDocumentation.push('No technologies listed');
        if (!proj.domain) missingDocumentation.push('No domain recorded');
        if (!skillsDemonstrated.length) missingDocumentation.push('No skill mapping could be derived');
        if (!proj.date && !proj.year) missingDocumentation.push('No date/year recorded');

        // Improvement opportunities (based on missing data / weak coverage)
        var improvementOpportunities = [];
        if (missingDocumentation.length) {
          improvementOpportunities.push('Document: ' + missingDocumentation.join(', ').toLowerCase());
        }
        var weakSkills = skillsDemonstrated.filter(function (s) { return s.evidenceCount <= 1; });
        if (weakSkills.length) {
          improvementOpportunities.push('Add README/tests/metrics to strengthen evidence for ' + weakSkills.slice(0, 3).map(function (s) { return s.name; }).join(', '));
        }
        if (!relatedRoles.length && profile.targetRoles.length) {
          improvementOpportunities.push('No target role connects to this project yet — consider aligning features with a target role\'s requirements');
        }

        // Complexity estimate (transparent heuristic: breadth of tech + categories)
        var categories = {};
        skillsDemonstrated.forEach(function (s) {
          var skill = null;
          profile.skills.forEach(function (ps) { if (ps.id === s.id) skill = ps; });
          if (skill) categories[skill.category] = true;
        });
        var categoryCount = Object.keys(categories).length;
        var complexityScore = Math.min(100, techs.length * 8 + categoryCount * 8 + (proj.description && proj.description.length > 200 ? 10 : 0));
        var complexity = complexityScore >= 65 ? 'High' : complexityScore >= 35 ? 'Medium' : 'Low';

        return angular.extend({}, proj, {
          skillsDemonstrated: skillsDemonstrated,
          relatedRoles: relatedRoles,
          missingDocumentation: missingDocumentation,
          improvementOpportunities: improvementOpportunities,
          complexity: complexity,
          complexityScore: complexityScore,
          complexityNote: 'CareerSphere estimate — based on technology breadth (' + techs.length + ' tech, ' + categoryCount + ' categories), not a rigorous metric.'
        });
      }

      function projectScore(p) {
        var score = 0;
        if (p.description && p.description.length >= 20) score += 25;
        if (p.technologies && p.technologies.length >= 2) score += 25;
        if (p.skillsDemonstrated.length >= 3) score += 25;
        if (p.relatedRoles.length > 0) score += 15;
        if (p.domain) score += 10;
        return score;
      }

      return { analyze: analyze };
    }]);

})(angular);
