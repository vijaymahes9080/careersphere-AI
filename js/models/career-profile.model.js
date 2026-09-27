/**
 * CareerSphere AI — Internal Data Model
 *
 * Normalized CareerProfile structure that all ingested data is mapped into.
 * Every analytical result retains source/evidence references.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.models', [])
    .factory('CareerProfileModel', [function () {

      var CareerProfileModel = {

        /**
         * Create an empty normalized profile.
         */
        createEmpty: function () {
          return {
            identity: { name: '', email: '', phone: '', location: '', summary: '' },
            education: [],
            skills: [],            // [{ id, name, category, level, source, confidence, evidence: [] }]
            skillEvidence: [],     // [{ skillId, type, title, source, detail }]
            projects: [],          // [{ id, name, description, technologies: [], skills: [], domain, complexity, source, evidence: [] }]
            certificates: [],     // [{ id, title, issuer, date, skills: [], source }]
            internships: [],       // [{ id, company, role, duration, description, skills: [], source }]
            experience: [],        // [{ id, company, role, duration, description, skills: [], source }]
            interests: [],
            careerGoals: [],
            targetRoles: [],       // [{ id, title, requirements: [{ skill, level, source }], source }]
            technologies: [],
            achievements: [],
            learningHistory: [],
        opportunities: [],     // [{ id, title, company, location, requiredSkills: [], matchingSkills: [], missingSkills: [], source }]
            sourceDocuments: [],   // [{ id, name, format, size, lastProcessed, recordCount, status, warnings: [] }]
            metadata: {
              createdAt: null,
              updatedAt: null,
              version: '1.0',
              isDemo: false
            }
          };
        },

        /**
         * Create a skill entry with defaults.
         */
        createSkill: function (name, category, level, source, confidence) {
          return {
            id: 'skill_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: name,
            category: category || 'Other',
            level: level || null,           // null = unverified
            source: source || 'unknown',
            confidence: confidence || 'Detected', // Confirmed | Detected | Needs verification
            evidence: [],
            proficiency: null,              // calculated
            recency: null
          };
        },

        /**
         * Create a project entry with defaults.
         */
        createProject: function (name, description, technologies, source) {
          return {
            id: 'proj_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: name,
            description: description || '',
            technologies: technologies || [],
            skills: [],
            domain: null,
            complexity: null,
            source: source || 'unknown',
            evidence: [],
            relatedRoles: []
          };
        },

        /**
         * Create a certificate entry with defaults.
         */
        createCertificate: function (title, issuer, date, skills, source) {
          return {
            id: 'cert_' + title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            title: title,
            issuer: issuer || 'Unknown',
            date: date || null,
            skills: skills || [],
            source: source || 'unknown',
            relatedProjects: [],
            relatedRoles: []
          };
        },

        /**
         * Create a source document entry.
         */
        createSourceDocument: function (name, format, size, isDemo) {
          return {
            id: 'src_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: name,
            format: format,
            size: size || 0,
            lastProcessed: null,
            recordCount: 0,
            status: 'pending',   // pending | processed | error
            warnings: [],
            isDemo: isDemo || false
          };
        },

        /**
         * Level to numeric value for calculations.
         */
        levelToValue: function (level) {
          var map = {
            'beginner': 1, 'basic': 1,
            'intermediate': 2, 'medium': 2,
            'advanced': 3, 'proficient': 3,
            'expert': 4, 'master': 4
          };
          if (!level) return null;
          return map[level.toLowerCase()] || null;
        },

        /**
         * Numeric value to level label.
         */
        valueToLevel: function (value) {
          if (value === null || value === undefined) return 'Unverified';
          if (value >= 3.5) return 'Expert';
          if (value >= 2.5) return 'Advanced';
          if (value >= 1.5) return 'Intermediate';
          return 'Beginner';
        }
      };

      return CareerProfileModel;
    }]);

})(angular);
