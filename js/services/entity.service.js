/**
 * CareerSphere AI — Entity Service
 * Extracts entities from dataset text, augments the profile with detected
 * (unverified) entities, and builds a source-attribution registry.
 *
 * Nothing here invents information: everything is marked with a confidence
 * level (Confirmed | Detected | Needs verification).
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('EntityService', [
      'TextExtractionService',
      'CareerProfileModel',
      function (TextExtractionService, CareerProfileModel) {

        function norm(s) {
          return (s || '').toLowerCase().replace(/[^a-z0-9+#]/g, '');
        }

        /**
         * Sweep every dataset's raw text for entities and augment the profile
         * with detected skills that are not yet present.
         * Existing skill levels/confidences are never overwritten.
         */
        function augmentProfile(profile, datasets) {
          if (!datasets || !datasets.length) return profile;

          datasets.forEach(function (ds) {
            if (!ds.raw) return;
            // Skip pure structured formats for text sweeps? No — raw text of
            // JSON/CSV still legitimately mentions technologies.
            var extraction = TextExtractionService.extract(ds.raw);

            // Skills
            extraction.skills.forEach(function (s) {
              addDetectedSkill(profile, s.name, s.category, ds.name, s.context);
            });

            // Technologies that are not yet skills → detected skill evidence
            extraction.technologies.forEach(function (t) {
              addDetectedSkill(profile, t.name, guessCategory(t.name), ds.name, t.context);
            });
          });

          // Project technologies → detected skills (with project source)
          profile.projects.forEach(function (proj) {
            (proj.technologies || []).forEach(function (tech) {
              addDetectedSkill(profile, tech, guessCategory(tech), proj.source || 'projects', proj.name);
            });
          });

          // Certificate skills → detected skills
          profile.certificates.forEach(function (cert) {
            (cert.skills || []).forEach(function (sk) {
              addDetectedSkill(profile, sk, guessCategory(sk), cert.source || 'certificates', cert.title);
            });
          });

          return profile;
        }

        function addDetectedSkill(profile, name, category, sourceName, context) {
          if (!name) return;
          var existing = findSkill(profile.skills, name);
          if (existing) {
            // Only add the source if not already attributed
            if (existing.source && existing.source.split(', ').indexOf(sourceName) === -1) {
              existing.source = existing.source + ', ' + sourceName;
            }
            if (!existing.detectedIn) existing.detectedIn = [];
            var already = existing.detectedIn.some(function (d) {
              return d.source === sourceName && d.context === context;
            });
            if (!already) existing.detectedIn.push({ source: sourceName, context: context || '' });
            return;
          }
          var skill = CareerProfileModel.createSkill(name, category || 'Other', null, sourceName || 'derived', 'Detected');
          skill.detectedIn = [{ source: sourceName, context: context || '' }];
          profile.skills.push(skill);
        }

        /**
         * Source attribution per skill: "Python detected in 4 sources."
         */
        function skillSources(profile) {
          var map = {};
          profile.skills.forEach(function (skill) {
            var sources = {};
            (skill.source || '').split(', ').forEach(function (s) {
              if (s && s !== 'unknown' && s !== 'derived') sources[s] = true;
            });
            (skill.evidence || []).forEach(function (ev) {
              if (ev.source) sources[ev.source] = true;
            });
            (skill.detectedIn || []).forEach(function (d) {
              if (d.source) sources[d.source] = true;
            });
            var list = Object.keys(sources);
            map[skill.id] = { skill: skill, sources: list, count: list.length };
          });
          return map;
        }

        /**
         * Summary counts used by Data Center / Overview.
         */
        function summary(profile) {
          return {
            skills: profile.skills.length,
            projects: profile.projects.length,
            certificates: profile.certificates.length,
            education: profile.education.length,
            experience: profile.experience.length,
            internships: profile.internships.length,
            targetRoles: profile.targetRoles.length,
            opportunities: profile.opportunities.length,
            interests: profile.interests.length,
            careerGoals: profile.careerGoals.length,
            achievements: profile.achievements.length,
            technologies: profile.technologies.length,
            sources: profile.sourceDocuments.length
          };
        }

        function findSkill(skills, name) {
          var lower = name.toLowerCase().trim();
          var n = norm(name);
          for (var i = 0; i < skills.length; i++) {
            var sn = norm(skills[i].name);
            if (skills[i].name.toLowerCase().trim() === lower) return skills[i];
            if (sn && n && (sn === n || sn.indexOf(n) > -1 || n.indexOf(sn) > -1)) return skills[i];
          }
          return null;
        }

        function guessCategory(name) {
          var lower = (name || '').toLowerCase();
          if (/python|java(?!script)|\bc\+\+|c#|\bgo\b|rust|ruby|php|swift|kotlin|scala|\br\b|matlab|perl|lua/.test(lower)) return 'Programming';
          if (/tensorflow|pytorch|keras|scikit|machine learning|deep learning|neural|nlp|pandas|numpy|opencv|ai|ml|llm/.test(lower)) return 'AI/ML';
          if (/esp32|esp8266|arduino|raspberry|lor[a-z]|iot|sensor|mqtt|zigbee|gps|embedded|microcontroller/.test(lower)) return 'IoT';
          if (/aws|azure|gcp|docker|kubernetes|terraform|cloud|ci\/cd|jenkins|devops/.test(lower)) return 'Cloud';
          if (/react|angular|vue|svelte|next|html|css|sass|bootstrap|tailwind|frontend|d3\.js|chart\.js/.test(lower)) return 'Frontend';
          if (/node|express|django|flask|fastapi|spring|laravel|graphql|rest|backend|microservice/.test(lower)) return 'Backend';
          if (/sql|mongo|redis|postgres|mysql|database|cassandra|dynamo|elastic|sqlite|firebase/.test(lower)) return 'Database';
          if (/git|github|jira|figma|linux|nginx|kafka|postman|vim|vs ?code/.test(lower)) return 'Tools';
          if (/leadership|communication|agile|scrum|teamwork|mentoring|management/.test(lower)) return 'Soft Skills';
          return 'Other';
        }

        return {
          augmentProfile: augmentProfile,
          skillSources: skillSources,
          summary: summary,
          guessCategory: guessCategory
        };
      }
    ]);

})(angular);
