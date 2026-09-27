/**
 * CareerSphere AI — Normalization Service
 * Maps data from any parsed format into the internal CareerProfile model.
 * Handles multiple schema variations via flexible field matching.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('NormalizationService', ['CareerProfileModel', function (CareerProfileModel) {

      var NormalizationService = {

        /**
         * Normalize parsed data into CareerProfile.
         * @param {Object} parsedData - Raw parsed data (from XML/JSON/CSV/TXT)
         * @param {string} sourceName - Name of the source document
         * @param {string} format - Source format (xml, json, csv, txt)
         * @param {Object} extractionResult - Result from TextExtractionService (for TXT)
         * @returns {Object} { profile, warnings: [] }
         */
        normalize: function (parsedData, sourceName, format, extractionResult) {
          var warnings = [];
          var profile = CareerProfileModel.createEmpty();
          profile.sourceDocuments.push(CareerProfileModel.createSourceDocument(sourceName, format, 0, false));
          profile.metadata.createdAt = new Date().toISOString();
          profile.metadata.updatedAt = new Date().toISOString();

          if (format === 'txt' && extractionResult) {
            normalizeFromExtraction(profile, extractionResult, sourceName, warnings);
          } else if (format === 'xml') {
            normalizeFromXML(profile, parsedData, sourceName, warnings);
          } else if (format === 'json') {
            normalizeFromJSON(profile, parsedData, sourceName, warnings);
          } else if (format === 'csv') {
            normalizeFromCSV(profile, parsedData, sourceName, warnings);
          }

          // Update source document record count
          var srcDoc = profile.sourceDocuments[profile.sourceDocuments.length - 1];
          srcDoc.recordCount = countRecords(profile);
          srcDoc.lastProcessed = new Date().toISOString();
          srcDoc.status = 'processed';

          return { profile: profile, warnings: warnings };
        },

        /**
         * Merge a new normalized profile into an existing one.
         */
        mergeProfile: function (existing, newProfile) {
          // Merge skills (deduplicate by name)
          newProfile.skills.forEach(function (skill) {
            var found = findSkill(existing.skills, skill.name);
            if (found) {
              // Merge evidence
              skill.evidence.forEach(function (ev) {
                if (!evidenceExists(found.evidence, ev)) {
                  found.evidence.push(ev);
                }
              });
              // Upgrade confidence if needed
              if (skill.confidence === 'Confirmed' && found.confidence !== 'Confirmed') {
                found.confidence = 'Confirmed';
              }
            } else {
              existing.skills.push(skill);
            }
          });

          // Merge projects (deduplicate by name)
          newProfile.projects.forEach(function (project) {
            if (!findProject(existing.projects, project.name)) {
              existing.projects.push(project);
            }
          });

          // Merge certificates (deduplicate by title + issuer)
          newProfile.certificates.forEach(function (cert) {
            if (!findCertificate(existing.certificates, cert.title, cert.issuer)) {
              existing.certificates.push(cert);
            }
          });

          // Merge education
          newProfile.education.forEach(function (edu) {
            if (!findEducation(existing.education, edu)) {
              existing.education.push(edu);
            }
          });

          // Merge experience
          newProfile.experience.forEach(function (exp) {
            if (!findExperience(existing.experience, exp)) {
              existing.experience.push(exp);
            }
          });

          // Merge internships
          newProfile.internships.forEach(function (intern) {
            if (!findInternship(existing.internships, intern)) {
              existing.internships.push(intern);
            }
          });

          // Merge interests
          newProfile.interests.forEach(function (interest) {
            if (existing.interests.indexOf(interest) === -1) {
              existing.interests.push(interest);
            }
          });

          // Merge career goals
          newProfile.careerGoals.forEach(function (goal) {
            if (existing.careerGoals.indexOf(goal) === -1) {
              existing.careerGoals.push(goal);
            }
          });

          // Merge target roles
          newProfile.targetRoles.forEach(function (role) {
            if (!findTargetRole(existing.targetRoles, role.title)) {
              existing.targetRoles.push(role);
            }
          });

          // Merge opportunities
          newProfile.opportunities.forEach(function (opp) {
            if (!findOpportunity(existing.opportunities, opp.title, opp.company)) {
              existing.opportunities.push(opp);
            }
          });

          // Merge learning history
          newProfile.learningHistory.forEach(function (item) {
            if (!findLearningItem(existing.learningHistory, item)) {
              existing.learningHistory.push(item);
            }
          });

          // Merge achievements
          newProfile.achievements.forEach(function (ach) {
            if (existing.achievements.indexOf(ach) === -1) {
              existing.achievements.push(ach);
            }
          });

          // Merge source documents
          newProfile.sourceDocuments.forEach(function (doc) {
            if (!findSourceDocument(existing.sourceDocuments, doc.name)) {
              existing.sourceDocuments.push(doc);
            }
          });

          // Merge technologies
          newProfile.technologies.forEach(function (tech) {
            if (existing.technologies.indexOf(tech) === -1) {
              existing.technologies.push(tech);
            }
          });

          // Update identity if empty
          if (!existing.identity.name && newProfile.identity.name) {
            existing.identity = newProfile.identity;
          }

          existing.metadata.updatedAt = new Date().toISOString();
          return existing;
        }
      };

      // ── Format-specific normalizers ──────────────────────────────────

      function normalizeFromXML(profile, data, sourceName, warnings) {
        // Handle various XML root elements
        var root = data.careerProfile || data.profile || data.resume || data;

        // Identity
        var person = root.person || root.identity || root;
        if (person) {
          profile.identity.name = getText(person.name) || '';
          profile.identity.email = getText(person.email) || '';
          profile.identity.phone = getText(person.phone) || '';
          profile.identity.location = getText(person.location) || '';
          profile.identity.summary = getText(person.summary) || getText(person.objective) || '';
        }

        // Education
        var education = root.education || root.educations;
        if (education) {
          var eduArr = nodes(education);
          eduArr.forEach(function (edu) {
            if (typeof edu === 'string') {
              profile.education.push({ name: edu, source: sourceName });
            } else {
              profile.education.push({
                name: getText(edu.name) || getText(edu.degree) || '',
                institution: getText(edu.institution) || getText(edu.university) || getText(edu.school) || '',
                year: getText(edu.year) || getText(edu.graduationYear) || '',
                source: sourceName
              });
            }
          });
        }

        // Skills
        var skills = root.skills || root.skill;
        if (skills) {
          var skillArr = nodes(skills);
          skillArr.forEach(function (skill) {
            if (typeof skill === 'string') {
              profile.skills.push(CareerProfileModel.createSkill(skill, 'Other', null, sourceName, 'Detected'));
            } else {
              var name = getText(skill.name) || getText(skill.skill) || '';
              if (name) {
                profile.skills.push(CareerProfileModel.createSkill(
                  name,
                  getText(skill.category) || 'Other',
                  getText(skill.level) || null,
                  sourceName,
                  getText(skill.level) ? 'Confirmed' : 'Detected'
                ));
              }
            }
          });
        }

        // Projects
        var projects = root.projects || root.project;
        if (projects) {
          var projArr = nodes(projects);
          projArr.forEach(function (proj) {
            if (typeof proj === 'string') {
              profile.projects.push(CareerProfileModel.createProject(proj, '', [], sourceName));
            } else {
              var techs = [];
              var tech = proj.technology || proj.technologies || proj.tech;
              if (tech) {
                techs = Array.isArray(tech) ? tech.map(function (t) { return typeof t === 'string' ? t : getText(t); }) : [getText(tech)];
              }
              var created = CareerProfileModel.createProject(
                getText(proj.name) || '',
                getText(proj.description) || '',
                techs,
                sourceName
              );
              if (getText(proj.domain)) created.domain = getText(proj.domain);
              if (getText(proj.year)) created.year = getText(proj.year);
              if (getText(proj.date)) created.date = getText(proj.date);
              profile.projects.push(created);
            }
          });
        }

        // Certificates
        var certs = root.certificates || root.certificate || root.certifications;
        if (certs) {
          var certArr = nodes(certs);
          certArr.forEach(function (cert) {
            if (typeof cert === 'string') {
              profile.certificates.push(CareerProfileModel.createCertificate(cert, '', null, [], sourceName));
            } else {
              var certSkills = [];
              var cs = cert.skills || cert.skill;
              if (cs) {
                certSkills = Array.isArray(cs) ? cs.map(function (s) { return typeof s === 'string' ? s : getText(s); }) : [getText(cs)];
              }
              profile.certificates.push(CareerProfileModel.createCertificate(
                getText(cert.title) || getText(cert.name) || '',
                getText(cert.issuer) || getText(cert.organization) || '',
                getText(cert.date) || getText(cert.year) || null,
                certSkills,
                sourceName
              ));
            }
          });
        }

        // Experience
        var exp = root.experience || root.experiences || root.workExperience;
        if (exp) {
          var expArr = nodes(exp);
          expArr.forEach(function (e) {
            if (typeof e === 'string') {
              profile.experience.push({ id: 'exp_' + Date.now(), company: '', role: e, duration: '', description: '', skills: [], source: sourceName });
            } else {
              profile.experience.push({
                id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                company: getText(e.company) || getText(e.organization) || '',
                role: getText(e.role) || getText(e.title) || getText(e.position) || '',
                duration: getText(e.duration) || getText(e.period) || '',
                description: getText(e.description) || '',
                skills: [],
                source: sourceName
              });
            }
          });
        }

        // Internships
        var internships = root.internships || root.internship;
        if (internships) {
          var intArr = nodes(internships);
          intArr.forEach(function (i) {
            if (typeof i === 'string') {
              profile.internships.push({ id: 'int_' + Date.now(), company: '', role: i, duration: '', description: '', skills: [], source: sourceName });
            } else {
              profile.internships.push({
                id: 'int_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                company: getText(i.company) || getText(i.organization) || '',
                role: getText(i.role) || getText(i.title) || '',
                duration: getText(i.duration) || '',
                description: getText(i.description) || '',
                skills: [],
                source: sourceName
              });
            }
          });
        }

        // Interests
        var interests = root.interests || root.interest || root.hobbies;
        if (interests) {
          var intArr2 = nodes(interests);
          intArr2.forEach(function (i) {
            var name = typeof i === 'string' ? i : getText(i.name) || getText(i);
            if (name) profile.interests.push(name);
          });
        }

        // Career goals
        var goals = root.careerGoals || root.goals || root.objective || root.objectives;
        if (goals) {
          var goalArr = nodes(goals);
          goalArr.forEach(function (g) {
            var text = typeof g === 'string' ? g : getText(g.text) || getText(g.goal) || getText(g);
            if (text) profile.careerGoals.push(text);
          });
        }

        // Target roles
        var targetRoles = root.targetRoles || root.targetRole || root.desiredRoles;
        if (targetRoles) {
          var trArr = nodes(targetRoles);
          trArr.forEach(function (tr) {
            if (typeof tr === 'string') {
              profile.targetRoles.push({ id: 'role_' + tr.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: tr, requirements: [], source: sourceName });
            } else {
              var reqs = [];
              var req = tr.requirements || tr.requirement || tr.skills;
              if (req) {
                var reqArr = Array.isArray(req) ? req : [req];
                reqArr.forEach(function (r) {
                  if (typeof r === 'string') {
                    reqs.push({ skill: r, level: null, source: sourceName });
                  } else if (r.skill || r.name) {
                    // skill may be a string or an array of <skill> children
                    var skillsRaw = r.skill || r.name;
                    var skillsArr = Array.isArray(skillsRaw) ? skillsRaw : [skillsRaw];
                    skillsArr.forEach(function (s) {
                      var skillName = typeof s === 'string' ? s : getText(s);
                      if (skillName) {
                        reqs.push({ skill: skillName, level: getText(r.level) || null, source: getText(r.source) || sourceName });
                      }
                    });
                  }
                });
              }
              profile.targetRoles.push({
                id: 'role_' + (getText(tr.title) || getText(tr.name) || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
                title: getText(tr.title) || getText(tr.name) || '',
                requirements: reqs,
                source: getText(tr.source) || sourceName
              });
            }
          });
        }

        // Achievements
        var achievements = root.achievements || root.achievement || root.awards;
        if (achievements) {
          var achArr = nodes(achievements);
          achArr.forEach(function (a) {
            var text = typeof a === 'string' ? a : getText(a.title) || getText(a.name) || getText(a.description) || getText(a);
            if (text) profile.achievements.push(text);
          });
        }

        // Technologies
        var techs = root.technologies || root.technology;
        if (techs) {
          var techArr = nodes(techs);
          techArr.forEach(function (t) {
            var name = typeof t === 'string' ? t : getText(t.name) || getText(t);
            if (name && profile.technologies.indexOf(name) === -1) {
              profile.technologies.push(name);
            }
          });
        }
      }

      function normalizeFromJSON(profile, data, sourceName, warnings) {
        // JSON can have various structures - handle common patterns
        var root = data.careerProfile || data.profile || data.resume || data;

        // Identity
        if (root.identity || root.person) {
          var id = root.identity || root.person;
          profile.identity.name = id.name || '';
          profile.identity.email = id.email || '';
          profile.identity.phone = id.phone || '';
          profile.identity.location = id.location || '';
          profile.identity.summary = id.summary || id.objective || '';
        } else if (root.name) {
          profile.identity.name = root.name || '';
          profile.identity.email = root.email || '';
          profile.identity.phone = root.phone || '';
          profile.identity.location = root.location || '';
          profile.identity.summary = root.summary || root.objective || '';
        }

        // Education
        if (root.education) {
          var eduArr = Array.isArray(root.education) ? root.education : [root.education];
          eduArr.forEach(function (edu) {
            if (typeof edu === 'string') {
              profile.education.push({ name: edu, source: sourceName });
            } else {
              profile.education.push({
                name: edu.name || edu.degree || '',
                institution: edu.institution || edu.university || edu.school || '',
                year: edu.year || edu.graduationYear || '',
                source: sourceName
              });
            }
          });
        }

        // Skills
        if (root.skills) {
          var skillArr = Array.isArray(root.skills) ? root.skills : [root.skills];
          skillArr.forEach(function (skill) {
            if (typeof skill === 'string') {
              profile.skills.push(CareerProfileModel.createSkill(skill, 'Other', null, sourceName, 'Detected'));
            } else {
              var name = skill.name || skill.skill || '';
              if (name) {
                profile.skills.push(CareerProfileModel.createSkill(
                  name,
                  skill.category || 'Other',
                  skill.level || null,
                  sourceName,
                  skill.level ? 'Confirmed' : 'Detected'
                ));
              }
            }
          });
        }

        // Projects
        if (root.projects) {
          var projArr = Array.isArray(root.projects) ? root.projects : [root.projects];
          projArr.forEach(function (proj) {
            if (typeof proj === 'string') {
              profile.projects.push(CareerProfileModel.createProject(proj, '', [], sourceName));
            } else {
              var techs = [];
              if (proj.technologies) {
                techs = Array.isArray(proj.technologies) ? proj.technologies : [proj.technologies];
              } else if (proj.technology) {
                techs = Array.isArray(proj.technology) ? proj.technology : [proj.technology];
              } else if (proj.tech) {
                techs = Array.isArray(proj.tech) ? proj.tech : [proj.tech];
              }
              var created = CareerProfileModel.createProject(
                proj.name || '',
                proj.description || '',
                techs,
                sourceName
              );
              // Preserve optional documentation fields (not in the base model)
              if (proj.domain) created.domain = proj.domain;
              if (proj.year) created.year = proj.year;
              if (proj.date) created.date = proj.date;
              if (proj.link || proj.url) created.link = proj.link || proj.url;
              profile.projects.push(created);
            }
          });
        }

        // Certificates
        if (root.certificates) {
          var certArr = Array.isArray(root.certificates) ? root.certificates : [root.certificates];
          certArr.forEach(function (cert) {
            if (typeof cert === 'string') {
              profile.certificates.push(CareerProfileModel.createCertificate(cert, '', null, [], sourceName));
            } else {
              var certSkills = [];
              if (cert.skills) {
                certSkills = Array.isArray(cert.skills) ? cert.skills : [cert.skills];
              }
              profile.certificates.push(CareerProfileModel.createCertificate(
                cert.title || cert.name || '',
                cert.issuer || cert.organization || '',
                cert.date || cert.year || null,
                certSkills,
                sourceName
              ));
            }
          });
        }

        // Experience
        if (root.experience) {
          var expArr = Array.isArray(root.experience) ? root.experience : [root.experience];
          expArr.forEach(function (e) {
            if (typeof e === 'string') {
              profile.experience.push({ id: 'exp_' + Date.now(), company: '', role: e, duration: '', description: '', skills: [], source: sourceName });
            } else {
              profile.experience.push({
                id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                company: e.company || e.organization || '',
                role: e.role || e.title || e.position || '',
                duration: e.duration || e.period || '',
                description: e.description || '',
                skills: [],
                source: sourceName
              });
            }
          });
        }

        // Internships
        if (root.internships) {
          var intArr = Array.isArray(root.internships) ? root.internships : [root.internships];
          intArr.forEach(function (i) {
            if (typeof i === 'string') {
              profile.internships.push({ id: 'int_' + Date.now(), company: '', role: i, duration: '', description: '', skills: [], source: sourceName });
            } else {
              profile.internships.push({
                id: 'int_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                company: i.company || i.organization || '',
                role: i.role || i.title || '',
                duration: i.duration || '',
                description: i.description || '',
                skills: [],
                source: sourceName
              });
            }
          });
        }

        // Interests
        if (root.interests) {
          var intArr2 = Array.isArray(root.interests) ? root.interests : [root.interests];
          intArr2.forEach(function (i) {
            var name = typeof i === 'string' ? i : (i.name || i);
            if (name) profile.interests.push(name);
          });
        }

        // Career goals
        if (root.careerGoals) {
          var goalArr = Array.isArray(root.careerGoals) ? root.careerGoals : [root.careerGoals];
          goalArr.forEach(function (g) {
            var text = typeof g === 'string' ? g : (g.text || g.goal || g);
            if (text) profile.careerGoals.push(text);
          });
        }

        // Target roles
        if (root.targetRoles) {
          var trArr = Array.isArray(root.targetRoles) ? root.targetRoles : [root.targetRoles];
          trArr.forEach(function (tr) {
            if (typeof tr === 'string') {
              profile.targetRoles.push({ id: 'role_' + tr.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: tr, requirements: [], source: sourceName });
            } else {
              var reqs = [];
              if (tr.requirements) {
                var reqArr = Array.isArray(tr.requirements) ? tr.requirements : [tr.requirements];
                reqArr.forEach(function (r) {
                  if (typeof r === 'string') {
                    reqs.push({ skill: r, level: null, source: sourceName });
                  } else {
                    reqs.push({ skill: r.name || r.skill || '', level: r.level || null, source: sourceName });
                  }
                });
              }
              profile.targetRoles.push({
                id: 'role_' + (tr.title || tr.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
                title: tr.title || tr.name || '',
                requirements: reqs,
                source: tr.source || tr._source || sourceName
              });
            }
          });
        }

        // Opportunities
        if (root.opportunities || root.opportunity) {
          var oppArr = Array.isArray(root.opportunities || root.opportunity)
            ? (root.opportunities || root.opportunity)
            : [root.opportunities || root.opportunity];
          oppArr.forEach(function (opp) {
            if (typeof opp === 'string') return;
            profile.opportunities.push({
              id: 'opp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              title: opp.title || opp.role || opp.position || '',
              company: opp.company || opp.organization || '',
              location: opp.location || '',
              experienceRequirement: opp.experienceRequirement || opp.experience || '',
              educationRequirement: opp.educationRequirement || opp.education || '',
              requiredSkills: Array.isArray(opp.requiredSkills) ? opp.requiredSkills
                : (Array.isArray(opp.skills) ? opp.skills
                  : (opp.requiredSkills ? [opp.requiredSkills] : [])),
              technologyRequirements: Array.isArray(opp.technologyRequirements) ? opp.technologyRequirements : [],
              source: opp.source || sourceName
            });
          });
        }

        // Learning history
        if (root.learningHistory) {
          var lhArr = Array.isArray(root.learningHistory) ? root.learningHistory : [root.learningHistory];
          lhArr.forEach(function (item) {
            if (typeof item === 'string') {
              profile.learningHistory.push({ topic: item, status: 'done', source: sourceName });
            } else {
              profile.learningHistory.push({
                topic: item.topic || item.name || '',
                status: item.status || 'done',
                date: item.date || null,
                source: sourceName
              });
            }
          });
        }

        // Achievements
        if (root.achievements) {
          var achArr = Array.isArray(root.achievements) ? root.achievements : [root.achievements];
          achArr.forEach(function (a) {
            var text = typeof a === 'string' ? a : (a.title || a.name || a.description || a);
            if (text) profile.achievements.push(text);
          });
        }

        // Technologies
        if (root.technologies) {
          var techArr = Array.isArray(root.technologies) ? root.technologies : [root.technologies];
          techArr.forEach(function (t) {
            var name = typeof t === 'string' ? t : (t.name || t);
            if (name && profile.technologies.indexOf(name) === -1) {
              profile.technologies.push(name);
            }
          });
        }
      }

      function normalizeFromCSV(profile, data, sourceName, warnings) {
        // CSV data is an array of row objects
        // Try to detect what type of data this is based on headers
        if (!data || data.length === 0) return;

        var headers = Object.keys(data[0]);
        var headerStr = headers.join(' ').toLowerCase();

        if (headerStr.indexOf('skill') > -1) {
          // Skills CSV
          data.forEach(function (row) {
            var name = row.skill || row.Skill || row.name || row.Name || '';
            var category = row.category || row.Category || 'Other';
            var level = row.level || row.Level || null;
            if (name) {
              profile.skills.push(CareerProfileModel.createSkill(name, category, level, sourceName, level ? 'Confirmed' : 'Detected'));
            }
          });
        } else if (headerStr.indexOf('project') > -1) {
          // Projects CSV
          data.forEach(function (row) {
            var name = row.project || row.Project || row.name || row.Name || '';
            var desc = row.description || row.Description || '';
            var techs = row.technologies || row.Technologies || row.tech || row.Tech || '';
            var techArr = techs ? techs.split(/[,;|]/).map(function (t) { return t.trim(); }) : [];
            if (name) {
              profile.projects.push(CareerProfileModel.createProject(name, desc, techArr, sourceName));
            }
          });
        } else if (headerStr.indexOf('certificate') > -1 || headerStr.indexOf('cert') > -1) {
          // Certificates CSV
          data.forEach(function (row) {
            var title = row.certificate || row.Certificate || row.title || row.Title || row.name || '';
            var issuer = row.issuer || row.Issuer || row.organization || '';
            var date = row.date || row.Date || row.year || '';
            var skills = row.skills || row.Skills || '';
            var skillArr = skills ? skills.split(/[,;|]/).map(function (s) { return s.trim(); }) : [];
            if (title) {
              profile.certificates.push(CareerProfileModel.createCertificate(title, issuer, date, skillArr, sourceName));
            }
          });
        } else if (headerStr.indexOf('role') > -1 || headerStr.indexOf('job') > -1) {
          // Target roles CSV
          data.forEach(function (row) {
            var title = row.role || row.Role || row.title || row.Title || row.job || '';
            var skills = row.skills || row.Skills || row.requirements || '';
            var skillArr = skills ? skills.split(/[,;|]/).map(function (s) { return s.trim(); }) : [];
            if (title) {
              var reqs = skillArr.map(function (s) { return { skill: s, level: null, source: sourceName }; });
              profile.targetRoles.push({
                id: 'role_' + title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                title: title,
                requirements: reqs,
                source: sourceName
              });
            }
          });
        } else {
          // Generic CSV - try to extract what we can
          warnings.push('CSV format not recognized. Attempting generic extraction.');
          data.forEach(function (row) {
            Object.keys(row).forEach(function (key) {
              var val = row[key];
              if (val && typeof val === 'string') {
                // Try to detect skills in values
                if (key.toLowerCase().indexOf('skill') > -1) {
                  var skills = val.split(/[,;|]/).map(function (s) { return s.trim(); });
                  skills.forEach(function (s) {
                    if (s) profile.skills.push(CareerProfileModel.createSkill(s, 'Other', null, sourceName, 'Detected'));
                  });
                }
              }
            });
          });
        }
      }

      function normalizeFromExtraction(profile, extraction, sourceName, warnings) {
        // Skills
        extraction.skills.forEach(function (s) {
          profile.skills.push(CareerProfileModel.createSkill(s.name, s.category, null, sourceName, s.confidence));
        });

        // Technologies
        extraction.technologies.forEach(function (t) {
          if (profile.technologies.indexOf(t.name) === -1) {
            profile.technologies.push(t.name);
          }
        });

        // Roles
        extraction.roles.forEach(function (r) {
          if (!findTargetRole(profile.targetRoles, r.name)) {
            profile.targetRoles.push({
              id: 'role_' + r.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              title: r.name,
              requirements: [],
              source: sourceName
            });
          }
        });

        // Education
        extraction.education.forEach(function (e) {
          profile.education.push({ name: e.name, source: sourceName });
        });

        // Certifications
        extraction.certifications.forEach(function (c) {
          profile.certificates.push(CareerProfileModel.createCertificate(c.name, '', null, [], sourceName));
        });

        // Experience
        extraction.experience.forEach(function (e) {
          profile.experience.push({
            id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            company: '',
            role: '',
            duration: e.years + ' years',
            description: e.context,
            skills: [],
            source: sourceName
          });
        });

        // Achievements
        extraction.achievements.forEach(function (a) {
          profile.achievements.push(a.name);
        });

        // Interests
        extraction.interests.forEach(function (i) {
          if (profile.interests.indexOf(i.name) === -1) {
            profile.interests.push(i.name);
          }
        });

        // Goals
        extraction.goals.forEach(function (g) {
          profile.careerGoals.push(g.text);
        });

        // Domains
        extraction.domains.forEach(function (d) {
          // Domains can be used for project domain classification
        });

        // Years of experience
        if (extraction.yearsOfExperience) {
          profile.identity.summary = (profile.identity.summary ? profile.identity.summary + ' ' : '') +
            extraction.yearsOfExperience.years + ' years of experience';
        }
      }

      // ── Helper functions ─────────────────────────────────────────────

      function getText(val) {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        if (val._text) return val._text;
        if (val._value) return val._value;
        return '';
      }

      /**
       * Normalize an XML-derived node into an array of records.
       * Handles the "container with repeated children" pattern:
       *   <skills><skill>A</skill><skill>B</skill></skills>
       * becomes { skill: [A, B] } after parsing — unwrap it to [A, B].
       */
      function nodes(val) {
        if (val === null || val === undefined) return [];
        if (Array.isArray(val)) return val;
        if (typeof val !== 'object') return [val];
        var keys = Object.keys(val).filter(function (k) { return k.charAt(0) !== '_'; });
        if (keys.length === 1) {
          var inner = val[keys[0]];
          if (Array.isArray(inner)) return inner;
          if (inner && typeof inner === 'object') return [inner];
        }
        return [val];
      }

      function findSkill(skills, name) {
        var lower = name.toLowerCase();
        for (var i = 0; i < skills.length; i++) {
          if (skills[i].name.toLowerCase() === lower) return skills[i];
        }
        return null;
      }

      function findProject(projects, name) {
        var lower = name.toLowerCase();
        for (var i = 0; i < projects.length; i++) {
          if (projects[i].name.toLowerCase() === lower) return projects[i];
        }
        return null;
      }

      function findCertificate(certs, title, issuer) {
        var lower = title.toLowerCase();
        for (var i = 0; i < certs.length; i++) {
          if (certs[i].title.toLowerCase() === lower &&
              (!issuer || certs[i].issuer.toLowerCase() === issuer.toLowerCase())) {
            return certs[i];
          }
        }
        return null;
      }

      function findEducation(education, edu) {
        var lower = (edu.name || '').toLowerCase();
        for (var i = 0; i < education.length; i++) {
          if (education[i].name.toLowerCase() === lower) return education[i];
        }
        return null;
      }

      function findExperience(experience, exp) {
        var roleLower = (exp.role || '').toLowerCase();
        var companyLower = (exp.company || '').toLowerCase();
        for (var i = 0; i < experience.length; i++) {
          if (experience[i].role.toLowerCase() === roleLower &&
              experience[i].company.toLowerCase() === companyLower) {
            return experience[i];
          }
        }
        return null;
      }

      function findInternship(internships, intern) {
        var roleLower = (intern.role || '').toLowerCase();
        var companyLower = (intern.company || '').toLowerCase();
        for (var i = 0; i < internships.length; i++) {
          if (internships[i].role.toLowerCase() === roleLower &&
              internships[i].company.toLowerCase() === companyLower) {
            return internships[i];
          }
        }
        return null;
      }

      function findTargetRole(roles, title) {
        var lower = title.toLowerCase();
        for (var i = 0; i < roles.length; i++) {
          if (roles[i].title.toLowerCase() === lower) return roles[i];
        }
        return null;
      }

      function findOpportunity(opportunities, title, company) {
        var lower = title.toLowerCase();
        for (var i = 0; i < opportunities.length; i++) {
          if (opportunities[i].title.toLowerCase() === lower &&
              opportunities[i].company.toLowerCase() === company.toLowerCase()) {
            return opportunities[i];
          }
        }
        return null;
      }

      function findLearningItem(history, item) {
        var lower = (item.topic || item.name || '').toLowerCase();
        for (var i = 0; i < history.length; i++) {
          if ((history[i].topic || history[i].name || '').toLowerCase() === lower) return history[i];
        }
        return null;
      }

      function findSourceDocument(docs, name) {
        var lower = name.toLowerCase();
        for (var i = 0; i < docs.length; i++) {
          if (docs[i].name.toLowerCase() === lower) return docs[i];
        }
        return null;
      }

      function evidenceExists(evidenceList, newEvidence) {
        for (var i = 0; i < evidenceList.length; i++) {
          if (evidenceList[i].type === newEvidence.type &&
              evidenceList[i].title === newEvidence.title) {
            return true;
          }
        }
        return false;
      }

      function countRecords(profile) {
        return profile.skills.length + profile.projects.length + profile.certificates.length +
               profile.education.length + profile.experience.length + profile.internships.length +
               profile.interests.length + profile.careerGoals.length + profile.targetRoles.length +
               profile.achievements.length + profile.opportunities.length + profile.learningHistory.length;
      }

      return NormalizationService;
    }]);

})(angular);
