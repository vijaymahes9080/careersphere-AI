/**
 * CareerSphere AI — Career Analysis Service
 * Career Intelligence Engine: intelligence cards, career readiness,
 * career paths (pathways, not predictions), learning roadmap generation
 * and the transparent "Analyze My Career" report.
 *
 * Every score is labeled a "CareerSphere analytical estimate" and
 * exposes the factors used.
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('CareerAnalysisService', [
      'SkillAnalysisService',
      'CareerProfileModel',
      function (SkillAnalysisService, CareerProfileModel) {

      // ── Intelligence cards ───────────────────────────────────────────

      function buildCards(profile, analyses) {
        var skill = analyses.skill;
        var evidence = analyses.evidence;
        var project = analyses.project;
        var coverage = analyses.coverage;
        var cards = [];

        // Skill Coverage (only if a target role with requirements exists)
        cards.push({
          key: 'coverage',
          label: 'Skill Coverage',
          canCompute: !!(coverage && coverage.coveragePercent !== null),
          value: coverage && coverage.coveragePercent !== null ? coverage.coveragePercent + '%' : '—',
          detail: coverage && coverage.coveragePercent !== null
            ? coverage.counts.STRONG + ' strong · ' + coverage.counts.FOUND + ' found · ' + coverage.counts.PARTIAL + ' partial · ' + coverage.counts.UNVERIFIED + ' unverified · ' + coverage.counts.MISSING + ' missing (' + coverage.role.title + ')'
            : 'Select a target role with requirement data in Settings',
          factors: coverage && coverage.coveragePercent !== null ? [
            { label: 'Requirement weight scoring', value: 'STRONG 1.0 · FOUND 0.75 · PARTIAL 0.4 · UNVERIFIED 0.25 · MISSING 0' },
            { label: 'Requirements source', value: coverage.source }
          ] : [],
          icon: 'coverage'
        });

        // Evidence Strength
        cards.push({
          key: 'evidence',
          label: 'Evidence Strength',
          canCompute: !!(evidence && evidence.overall),
          value: evidence && evidence.overall ? evidence.overall.score + '%' : '—',
          detail: evidence && evidence.overall
            ? skill.stats.withEvidence + ' of ' + skill.stats.total + ' skills have supporting evidence'
            : 'No skills imported yet',
          factors: evidence && evidence.overall ? evidence.overall.factors : [],
          icon: 'evidence'
        });

        // Project Strength
        cards.push({
          key: 'projects',
          label: 'Project Strength',
          canCompute: !!(project && project.stats.strength !== null),
          value: project && project.stats.strength !== null ? project.stats.strength + '%' : '—',
          detail: project && project.projects.length
            ? project.projects.length + ' projects · ' + project.stats.documented + ' fully documented · avg complexity ' + (project.stats.avgComplexity >= 65 ? 'High' : project.stats.avgComplexity >= 35 ? 'Medium' : 'Low')
            : 'No projects imported yet',
          factors: project && project.projects.length ? [
            { label: 'Description quality', value: '25%' },
            { label: 'Technology breadth', value: '25%' },
            { label: 'Skill mapping', value: '25%' },
            { label: 'Target-role relevance', value: '15%' },
            { label: 'Domain recorded', value: '10%' }
          ] : [],
          icon: 'projects'
        });

        // Career Alignment (needs role + projects)
        var alignment = null;
        if (coverage && coverage.coveragePercent !== null && project && project.stats.total > 0) {
          var roleRelatedProjects = project.projects.filter(function (p) { return p.relatedRoles.length > 0; }).length;
          var projectAlign = Math.round((roleRelatedProjects / project.stats.total) * 100);
          alignment = Math.round(coverage.coveragePercent * 0.6 + projectAlign * 0.4);
        }
        cards.push({
          key: 'alignment',
          label: 'Career Alignment',
          canCompute: alignment !== null,
          value: alignment !== null ? alignment + '%' : '—',
          detail: alignment !== null
            ? '60% skill coverage + 40% project-role relevance (' + coverage.role.title + ')'
            : 'Requires a target role and at least one project',
          factors: alignment !== null ? [
            { label: 'Skill coverage', value: coverage.coveragePercent + '% (weight 0.6)' },
            { label: 'Projects linked to role', value: project.projects.filter(function (p) { return p.relatedRoles.length > 0; }).length + ' of ' + project.stats.total + ' (weight 0.4)' }
          ] : [],
          icon: 'alignment'
        });

        // Learning Progress (only if a roadmap exists)
        var plan = analyses.learningPlan || [];
        var completed = plan.filter(function (t) { return t.done; }).length;
        cards.push({
          key: 'learning',
          label: 'Learning Progress',
          canCompute: plan.length > 0,
          value: plan.length ? Math.round((completed / plan.length) * 100) + '%' : '—',
          detail: plan.length ? completed + ' of ' + plan.length + ' roadmap topics completed' : 'Generated automatically from identified skill gaps',
          factors: [],
          icon: 'learning'
        });

        // Opportunity Match (only if opportunities imported)
        var opps = analyses.opportunities || null;
        cards.push({
          key: 'opportunity',
          label: 'Opportunity Match',
          canCompute: !!(opps && opps.avgMatch !== null),
          value: opps && opps.avgMatch !== null ? opps.avgMatch + '%' : '—',
          detail: opps && opps.avgMatch !== null
            ? opps.count + ' opportunities analyzed against your profile'
            : 'Import job/opportunity data in Data Center',
          factors: [],
          icon: 'opportunity'
        });

        return cards;
      }

      // ── Career readiness ────────────────────────────────────────────

      function computeReadiness(profile, analyses) {
        var skill = analyses.skill;
        var evidence = analyses.evidence;
        var project = analyses.project;
        var coverage = analyses.coverage;

        if (!skill || skill.stats.total === 0) {
          return null;
        }

        var factors = [];

        // Profile completeness (15)
        var completeness = 0;
        var parts = [];
        if (profile.identity.name || profile.identity.summary) { completeness += 0.25; parts.push('identity'); }
        if (profile.education.length) { completeness += 0.25; parts.push('education'); }
        if (profile.experience.length || profile.internships.length) { completeness += 0.25; parts.push('experience'); }
        if (profile.careerGoals.length || profile.targetRoles.length) { completeness += 0.25; parts.push('goals/roles'); }
        factors.push({
          key: 'completeness', label: 'Profile completeness',
          score: Math.round(completeness * 15), max: 15,
          detail: parts.length ? 'Has: ' + parts.join(', ') : 'Profile is mostly empty'
        });

        // Skill strength (20)
        factors.push({
          key: 'skills', label: 'Average skill strength',
          score: Math.round((skill.stats.avgStrength / 100) * 20), max: 20,
          detail: skill.stats.avgStrength + '% average across ' + skill.stats.total + ' skills'
        });

        // Evidence strength (25)
        var evScore = evidence && evidence.overall ? evidence.overall.score : 0;
        factors.push({
          key: 'evidence', label: 'Evidence strength',
          score: Math.round((evScore / 100) * 25), max: 25,
          detail: skill.stats.withEvidence + '/' + skill.stats.total + ' skills supported by projects, certificates or experience'
        });

        // Role coverage (25) — excluded if no role
        if (coverage && coverage.coveragePercent !== null) {
          factors.push({
            key: 'coverage', label: 'Target-role coverage',
            score: Math.round((coverage.coveragePercent / 100) * 25), max: 25,
            detail: coverage.coveragePercent + '% of ' + coverage.role.title + ' requirements addressed'
          });
        } else {
          factors.push({
            key: 'coverage', label: 'Target-role coverage',
            score: 0, max: 25, excluded: true,
            detail: 'Not available — no target role with requirement data selected'
          });
        }

        // Project strength (15)
        var projScore = project && project.stats.strength !== null ? project.stats.strength : 0;
        factors.push({
          key: 'projects', label: 'Project strength',
          score: Math.round((projScore / 100) * 15), max: 15,
          detail: project && project.stats.total ? project.stats.total + ' projects analyzed' : 'No projects imported'
        });

        // Normalize over available (non-excluded) weights
        var availableMax = factors.reduce(function (sum, f) { return sum + (f.excluded ? 0 : f.max); }, 0);
        var earned = factors.reduce(function (sum, f) { return sum + (f.excluded ? 0 : f.score); }, 0);
        var value = availableMax > 0 ? Math.round((earned / availableMax) * 100) : 0;

        return {
          value: value,
          factors: factors,
          availableMax: availableMax,
          earned: earned,
          note: 'CareerSphere analytical estimate — a transparent composite of the listed factors, not an objective truth.'
        };
      }

      // ── Career paths (pathways, not predictions) ────────────────────

      var PATH_TEMPLATES = [
        { id: 'A', name: 'Path A', steps: ['Python', 'Backend', 'AI', 'AI Engineer'], aliases: { 'Backend': ['Node.js', 'Django', 'Flask', 'FastAPI', 'API'], 'AI': ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch'] } },
        { id: 'B', name: 'Path B', steps: ['C/C++', 'Embedded', 'IoT', 'Embedded AI'], aliases: { 'C/C++': ['C', 'C++', 'Embedded C'], 'Embedded': ['Arduino', 'ESP32', 'Microcontrollers', 'Raspberry Pi'], 'IoT': ['LoRa', 'MQTT', 'Sensors', 'Bluetooth'] } },
        { id: 'C', name: 'Path C', steps: ['Python', 'Data', 'ML', 'ML Engineer'], aliases: { 'Data': ['Pandas', 'NumPy', 'Data Analysis', 'SQL', 'Data Science'], 'ML': ['Scikit-learn', 'Machine Learning', 'TensorFlow'] } },
        { id: 'D', name: 'Path D', steps: ['JavaScript', 'Frontend', 'Full Stack', 'Full Stack Developer'], aliases: { 'Frontend': ['AngularJS', 'Angular', 'React', 'Vue'], 'Full Stack': ['Node.js', 'Express', 'MongoDB', 'REST API'] } },
        { id: 'E', name: 'Path E', steps: ['Java', 'Cloud', 'DevOps', 'DevOps Engineer'], aliases: { 'Cloud': ['AWS', 'Azure', 'GCP', 'Docker'], 'DevOps': ['CI/CD', 'Kubernetes', 'Jenkins', 'Terraform'] } }
      ];

      function buildCareerPaths(profile, analyses) {
        var skillNames = profile.skills.map(function (s) { return s.name.toLowerCase(); });
        var roleNames = profile.targetRoles.map(function (r) { return r.title.toLowerCase(); });

        function hasTerm(step, template) {
          var terms = [step].concat((template.aliases && template.aliases[step]) || []);
          var skills = analyses.skill ? analyses.skill.skills : [];
          for (var i = 0; i < terms.length; i++) {
            var t = terms[i].toLowerCase();
            for (var j = 0; j < skills.length; j++) {
              var sn = skills[j].name.toLowerCase();
              if (sn === t || sn.indexOf(t) > -1 || t.indexOf(sn) > -1) return skills[j];
            }
          }
          return null;
        }

        var paths = [];
        PATH_TEMPLATES.forEach(function (tpl) {
          var matchedAny = false;
          var steps = tpl.steps.map(function (step, idx) {
            // Last step = career target; check target roles first
            if (idx === tpl.steps.length - 1) {
              for (var r = 0; r < profile.targetRoles.length; r++) {
                if (profile.targetRoles[r].title.toLowerCase().indexOf(step.toLowerCase()) > -1 ||
                    step.toLowerCase().indexOf(profile.targetRoles[r].title.toLowerCase()) > -1) {
                  matchedAny = true;
                  return { label: step, status: 'target', detail: 'Target role: ' + profile.targetRoles[r].title };
                }
              }
            }
            var skill = hasTerm(step, tpl);
            if (skill) {
              matchedAny = true;
              var enriched = analyses.skill.byId[skill.id];
              if (enriched && enriched.strength >= 70) {
                return { label: step, status: 'done', detail: 'Skill strength ' + enriched.strength + '%' };
              }
              return { label: step, status: 'progress', detail: skill.level ? 'Level: ' + skill.level : 'Detected — needs evidence' };
            }
            return { label: step, status: 'not-started', detail: 'Not present in your profile yet' };
          });
          if (matchedAny) {
            paths.push({ id: tpl.id, name: tpl.name, steps: steps });
          }
        });

        // Generate interactive graph tree from actual target roles and pathways
        var pathwaysTree = buildPathwayTree(profile, analyses, paths);

        return {
          paths: paths,
          tree: pathwaysTree,
          note: 'These are pathways derived from your current data — they are not predictions or career guarantees.'
        };
      }

      function buildPathwayTree(profile, analyses, paths) {
        var roles = profile.targetRoles || [];
        var skill = analyses.skill;

        // Group into primary domains
        var branches = [];

        roles.forEach(function (role) {
          var cov = SkillAnalysisService.computeCoverage(profile, skill, role);
          var pct = cov ? cov.coveragePercent : 0;
          var status = pct >= 75 ? 'strong' : (pct >= 50 ? 'progress' : 'target');

          // Child specializations derived from requirements
          var children = [];
          if (role.title.toLowerCase().indexOf('ai') > -1) {
            children.push({ name: 'ML Engineer', status: pct >= 65 ? 'progress' : 'future', match: Math.max(30, pct - 8) });
            children.push({ name: 'Agentic AI Engineer', status: 'future', match: Math.max(20, pct - 25) });
          } else if (role.title.toLowerCase().indexOf('iot') > -1) {
            children.push({ name: 'Edge AI Engineer', status: pct >= 55 ? 'progress' : 'future', match: Math.max(30, pct - 15) });
            children.push({ name: 'Embedded Systems Architect', status: 'future', match: Math.max(25, pct - 20) });
          } else if (role.title.toLowerCase().indexOf('full stack') > -1 || role.title.toLowerCase().indexOf('developer') > -1) {
            children.push({ name: 'Cloud Native Architect', status: 'future', match: Math.max(25, pct - 22) });
          }

          branches.push({
            id: 'node_' + role.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            title: role.title,
            status: status,
            matchPercent: pct,
            matchedCount: cov ? cov.counts.STRONG + cov.counts.FOUND : 0,
            totalReqs: cov ? cov.requirements.length : 0,
            children: children
          });
        });

        return {
          root: {
            title: profile.identity.name || 'Current Profile',
            subtitle: 'Analytical Foundation (' + (skill ? skill.stats.total : 0) + ' skills)',
            avgStrength: skill ? skill.stats.avgStrength : 0
          },
          branches: branches
        };
      }

      // ── Extended Analytics: Role Matching, Actions, Matrix, Evidence & Map ──

      function buildRoleMatches(profile, analyses) {
        if (!profile.targetRoles || !profile.targetRoles.length) return [];
        var skillAnalysis = analyses.skill;
        var projects = (analyses.project && analyses.project.projects) || [];

        return profile.targetRoles.map(function (role) {
          var cov = SkillAnalysisService.computeCoverage(profile, skillAnalysis, role);
          var coveragePercent = cov && cov.coveragePercent !== null ? cov.coveragePercent : 0;

          // Find projects linking to this role
          var relatedProjects = projects.filter(function (p) {
            return (p.relatedRoles || []).some(function (r) {
              return r.title.toLowerCase() === role.title.toLowerCase();
            }) || (p.skillsDemonstrated || []).some(function (s) {
              return (role.requirements || []).some(function (req) {
                return req.skill.toLowerCase() === s.name.toLowerCase();
              });
            });
          });

          var projectScore = Math.min(100, relatedProjects.length * 35);
          var roleReadiness = Math.round(coveragePercent * 0.65 + projectScore * 0.35);
          var fitTier = coveragePercent >= 75 ? 'High' : (coveragePercent >= 50 ? 'Medium' : 'Low');

          return {
            id: 'role_' + role.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            title: role.title,
            source: role.source || 'imported role profile',
            coveragePercent: coveragePercent,
            roleReadiness: roleReadiness,
            fitTier: fitTier,
            requirements: cov ? cov.requirements : [],
            matchedSkills: cov ? cov.matchedSkills : [],
            missingSkills: cov ? cov.missingSkills : [],
            counts: cov ? cov.counts : { STRONG: 0, FOUND: 0, PARTIAL: 0, UNVERIFIED: 0, MISSING: 0 },
            whyMatches: cov ? cov.whyMatches : [],
            relatedProjects: relatedProjects,
            recommendedLearning: (cov && cov.missingSkills ? cov.missingSkills.slice(0, 3) : []),
            recommendedProjects: relatedProjects.length ? relatedProjects : (projects.length ? [projects[0]] : [])
          };
        }).sort(function (a, b) { return b.coveragePercent - a.coveragePercent; });
      }

      function buildNextActions(profile, analyses, roleMatches) {
        var actions = [];
        var primaryRole = (roleMatches && roleMatches.length) ? roleMatches[0] : null;
        var gaps = primaryRole && primaryRole.missingSkills ? primaryRole.missingSkills : [];
        var projects = (analyses.project && analyses.project.projects) || [];

        // Action 01: Top Skill Gap to Strengthen
        if (gaps.length) {
          var topGap = gaps[0];
          actions.push({
            num: '01',
            tag: 'Skill Gap Priority',
            title: 'Strengthen ' + topGap.skill,
            detail: 'Current level: ' + topGap.currentLevel + ' · Target for ' + primaryRole.title + ' (' + topGap.requiredLevel + '). ' + topGap.suggestedAction + '.',
            tone: 'accent'
          });
        } else if (analyses.skill && analyses.skill.skills.length) {
          var lowest = analyses.skill.skills[analyses.skill.skills.length - 1];
          actions.push({
            num: '01',
            tag: 'Skill Foundation',
            title: 'Deepen evidence for ' + lowest.name,
            detail: 'Currently at ' + lowest.strength + '% strength. Add verifiable implementation proof or benchmarks.',
            tone: 'accent'
          });
        } else {
          actions.push({
            num: '01',
            tag: 'Data Ingestion',
            title: 'Import your technical skills',
            detail: 'Import a CSV skill matrix or resume to activate automated gap and strength analytics.',
            tone: 'muted'
          });
        }

        // Action 02: High-Impact Project Action
        if (projects.length) {
          var projNeedsDocs = projects.filter(function (p) { return p.missingDocumentation && p.missingDocumentation.length; })[0];
          if (projNeedsDocs) {
            actions.push({
              num: '02',
              tag: 'Portfolio Evidence',
              title: 'Document ' + projNeedsDocs.name,
              detail: 'Resolve ' + projNeedsDocs.missingDocumentation[0] + ' to boost Project Strength and validated skills.',
              tone: 'cyan'
            });
          } else {
            actions.push({
              num: '02',
              tag: 'Project Expansion',
              title: 'Build a production-style ' + (primaryRole ? primaryRole.title : 'Engineering') + ' project',
              detail: 'Build and deploy an end-to-end project applying top required technologies to demonstrate industry readiness.',
              tone: 'cyan'
            });
          }
        } else {
          actions.push({
            num: '02',
            tag: 'Project Portfolio',
            title: 'Add your flagship projects',
            detail: 'Import projects to connect your demonstrated skills with target career roles.',
            tone: 'warn'
          });
        }

        // Action 03: Career Alignment & Application Action
        if (primaryRole && primaryRole.coveragePercent >= 60) {
          actions.push({
            num: '03',
            tag: 'Role Alignment',
            title: 'Target ' + primaryRole.title + ' roles',
            detail: 'You have ' + primaryRole.coveragePercent + '% requirement alignment and ' + primaryRole.matchedSkills.length + ' matching skills. Prepare portfolio evidence highlighting confirmed strengths.',
            tone: 'good'
          });
        } else if (primaryRole) {
          actions.push({
            num: '03',
            tag: 'Roadmap Milestone',
            title: 'Complete Stage 1 Roadmap topics',
            detail: 'Address the identified gaps to reach 75%+ coverage for ' + primaryRole.title + '.',
            tone: 'warn'
          });
        } else {
          actions.push({
            num: '03',
            tag: 'Target Role',
            title: 'Configure target career roles',
            detail: 'Define your desired engineering role in Settings or Data Center to unlock career pathways.',
            tone: 'muted'
          });
        }

        return actions;
      }

      function buildProjectSkillRoleMap(profile, analyses) {
        var projects = (analyses.project && analyses.project.projects) || [];
        var roles = profile.targetRoles || [];

        return projects.map(function (p) {
          var demonstrated = p.skillsDemonstrated || [];
          var matchedRoles = roles.filter(function (r) {
            var reqs = (r.requirements || []).map(function (req) { return req.skill.toLowerCase(); });
            return demonstrated.some(function (s) {
              return reqs.indexOf(s.name.toLowerCase()) > -1;
            });
          }).map(function (r) {
            var count = (r.requirements || []).filter(function (req) {
              return demonstrated.some(function (s) {
                return s.name.toLowerCase() === req.skill.toLowerCase();
              });
            }).length;
            return { title: r.title, matchingSkillsCount: count };
          });

          var impactScore = Math.min(100, Math.round(demonstrated.length * 15 + matchedRoles.length * 20 + (p.complexity === 'High' ? 25 : p.complexity === 'Medium' ? 15 : 5)));

          return {
            name: p.name,
            domain: p.domain || 'Software',
            complexity: p.complexity,
            year: p.year || 'Current',
            description: p.description,
            skillsUsed: demonstrated.map(function (s) {
              return { name: s.name, level: s.level, strength: s.strength || 60 };
            }),
            technologies: p.technologies || [],
            careerRoles: matchedRoles.length ? matchedRoles : (p.relatedRoles || []),
            impactScore: impactScore,
            employabilityNote: 'Provides concrete evidence for ' + demonstrated.length + ' skill(s) across ' + (matchedRoles.length || 'multiple') + ' target career path(s).'
          };
        });
      }

      function buildEvidenceBreakdown(profile, analyses) {
        var evidenceList = (analyses.evidence && analyses.evidence.list) || [];
        var totalPoints = 0;
        var counts = { resume: 0, projects: 0, certificates: 0, experience: 0 };
        var points = { resume: 0, projects: 0, certificates: 0, experience: 0 };

        evidenceList.forEach(function (item) {
          (item.entries || []).forEach(function (e) {
            var t = (e.type || '').toLowerCase();
            var w = e.weight || 1;
            totalPoints += w;
            if (t.indexOf('resume') > -1 || t.indexOf('text') > -1 || t.indexOf('self') > -1) {
              counts.resume++;
              points.resume += w;
            } else if (t.indexOf('project') > -1) {
              counts.projects++;
              points.projects += w;
            } else if (t.indexOf('certificate') > -1 || t.indexOf('cert') > -1) {
              counts.certificates++;
              points.certificates += w;
            } else if (t.indexOf('experience') > -1 || t.indexOf('internship') > -1 || t.indexOf('job') > -1) {
              counts.experience++;
              points.experience += w;
            } else {
              counts.resume++;
              points.resume += w;
            }
          });
        });

        // Ensure non-zero visual indicators if profile has elements
        if (profile.education.length && !counts.resume) { counts.resume = 2; points.resume = 4; totalPoints += 4; }
        if (profile.projects.length && !counts.projects) { counts.projects = profile.projects.length; points.projects = profile.projects.length * 3; totalPoints += points.projects; }
        if (profile.certificates.length && !counts.certificates) { counts.certificates = profile.certificates.length; points.certificates = profile.certificates.length * 2; totalPoints += points.certificates; }
        if ((profile.experience.length || profile.internships.length) && !counts.experience) { counts.experience = 1; points.experience = 3; totalPoints += 3; }

        function calcPct(pt) {
          return totalPoints > 0 ? Math.round((pt / totalPoints) * 100) : 0;
        }

        return {
          totalPoints: totalPoints,
          sources: [
            { label: 'Resume & Documents', count: counts.resume, points: points.resume, percent: calcPct(points.resume) },
            { label: 'Projects & Repos', count: counts.projects, points: points.projects, percent: calcPct(points.projects) },
            { label: 'Certifications', count: counts.certificates, points: points.certificates, percent: calcPct(points.certificates) },
            { label: 'Experience / Internships', count: counts.experience, points: points.experience, percent: calcPct(points.experience) }
          ],
          verifiedRatio: analyses.evidence && analyses.evidence.overall ? analyses.evidence.overall.score : 0
        };
      }

      function buildFitMatrix(profile, analyses, roleMatches) {
        var high = [], medium = [], low = [];
        (roleMatches || []).forEach(function (r) {
          if (r.fitTier === 'High') high.push(r);
          else if (r.fitTier === 'Medium') medium.push(r);
          else low.push(r);
        });
        return { high: high, medium: medium, low: low, all: roleMatches || [] };
      }

      function buildStageRoadmap(profile, analyses) {
        var plan = analyses.learningPlan || [];
        var stages = [
          { id: 'NOW', label: 'NOW', title: 'Critical Gaps', desc: 'High-priority missing skills for immediate focus', topics: [] },
          { id: 'NEXT', label: 'NEXT', title: 'Core Requirements', desc: 'Secondary requirements to reach foundational parity', topics: [] },
          { id: 'BUILD', label: 'BUILD', title: 'Hands-on Projects', desc: 'Transform partial skills into demonstrable evidence', topics: [] },
          { id: 'APPLY', label: 'APPLY', title: 'Practical Application', desc: 'Deploy, test, and benchmark with real datasets', topics: [] },
          { id: 'ADVANCE', label: 'ADVANCE', title: 'Mastery & Growth', desc: 'Specialized capabilities for long-term career growth', topics: [] }
        ];

        plan.forEach(function (topic, idx) {
          var stageIdx = Math.min(4, Math.floor(idx / Math.max(1, Math.ceil(plan.length / 5))));
          stages[stageIdx].topics.push(topic);
        });

        return stages;
      }

      function buildDataQualityMetrics(profile, datasets, analyses) {
        var totalRecords = (datasets || []).reduce(function (sum, d) { return sum + (d.recordCount || 0); }, 0);
        var sourcesCount = (datasets || []).length;
        var skillsCount = profile.skills.length;
        var mappedSkills = profile.skills.filter(function (s) { return s.level || (s.evidence && s.evidence.length); }).length;
        var unmappedSkills = skillsCount - mappedSkills;
        var warningsCount = (analyses && analyses.quality && analyses.quality.warnings) ? analyses.quality.warnings.length : 0;
        var confidence = Math.max(20, Math.min(100, Math.round(100 - warningsCount * 3 + (sourcesCount > 1 ? 8 : 0))));

        return {
          recordsAnalyzed: totalRecords || (skillsCount + profile.projects.length),
          sourcesDetected: sourcesCount,
          skillsExtracted: skillsCount,
          skillsMapped: mappedSkills,
          unmappedItems: unmappedSkills,
          missingFields: warningsCount,
          confidence: confidence,
          status: confidence >= 80 ? 'High Confidence' : (confidence >= 60 ? 'Moderate Confidence' : 'Needs Verification')
        };
      }

      return {
        buildCards: buildCards,
        computeReadiness: computeReadiness,
        buildCareerPaths: buildCareerPaths,
        buildLearningPlan: buildLearningPlan,
        analyzeOpportunities: analyzeOpportunities,
        buildReport: buildReport,
        buildRoleMatches: buildRoleMatches,
        buildNextActions: buildNextActions,
        buildProjectSkillRoleMap: buildProjectSkillRoleMap,
        buildEvidenceBreakdown: buildEvidenceBreakdown,
        buildFitMatrix: buildFitMatrix,
        buildStageRoadmap: buildStageRoadmap,
        buildDataQualityMetrics: buildDataQualityMetrics
      };
      function buildLearningPlan(profile, analyses) {
        var coverage = analyses.coverage;
        if (!coverage || !coverage.requirements || !coverage.requirements.length) {
          return [];
        }
        var gaps = coverage.requirements.filter(function (r) {
          return r.status === 'MISSING' || r.status === 'PARTIAL' || r.status === 'UNVERIFIED';
        });
        // Priority: MISSING first, then PARTIAL, then UNVERIFIED
        var order = { MISSING: 0, PARTIAL: 1, UNVERIFIED: 2 };
        gaps.sort(function (a, b) { return order[a.status] - order[b.status]; });

        return gaps.map(function (g, i) {
          var topicId = 'topic_' + coverage.role.title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + g.skillName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return {
            id: topicId,
            week: i + 1,
            title: g.skillName,
            status: g.status,
            role: coverage.role.title,
            source: g.source,
            steps: [
              'Study fundamentals of ' + g.skillName,
              'Complete focused practice / exercises',
              'Build a small project using ' + g.skillName,
              'Add the project as evidence for ' + g.skillName
            ],
            done: false
          };
        });
      }

      // ── Opportunity analysis ────────────────────────────────────────

      function analyzeOpportunities(profile, analyses) {
        if (!profile.opportunities || profile.opportunities.length === 0) return null;
        var rows = profile.opportunities.map(function (opp) {
          var required = opp.requiredSkills || opp.skills || [];
          var matched = [], missing = [], unknown = [];
          required.forEach(function (req) {
            var found = null;
            for (var i = 0; i < profile.skills.length; i++) {
              var n = profile.skills[i].name.toLowerCase();
              var r = (typeof req === 'string' ? req : req.skill).toLowerCase();
              if (n === r || n.indexOf(r) > -1 || r.indexOf(n) > -1) { found = profile.skills[i]; break; }
            }
            var name = typeof req === 'string' ? req : req.skill;
            if (!found) {
              missing.push({ name: name, status: 'MISSING' });
            } else {
              var enriched = analyses.skill.byId[found.id];
              if (!enriched || enriched.evidenceCount === 0) {
                unknown.push({ name: name, status: 'UNKNOWN', current: found.name });
              } else if (enriched.strength >= 70) {
                matched.push({ name: name, status: 'MATCHED', current: found.name });
              } else {
                missing.push({ name: name, status: 'PARTIAL', current: found.name, strength: enriched.strength });
              }
            }
          });
          var total = required.length || 1;
          var matchPercent = Math.round(((matched.length + missing.filter(function (m) { return m.status === 'PARTIAL'; }).length * 0.5) / total) * 100);
          return {
            opportunity: opp,
            matched: matched,
            missing: missing,
            unknown: unknown,
            matchPercent: matchPercent
          };
        });
        var avg = rows.length ? Math.round(rows.reduce(function (s, r) { return s + r.matchPercent; }, 0) / rows.length) : null;
        return { rows: rows, avgMatch: avg, count: rows.length };
      }

      // ── "Analyze My Career" transparent report ──────────────────────

      function buildReport(profile, analyses) {
        var skill = analyses.skill;
        var coverage = analyses.coverage;
        var project = analyses.project;
        var evidence = analyses.evidence;
        var readiness = analyses.readiness;

        var strengths = [];
        var evidenceHighlights = [];
        var gaps = [];
        var incomplete = [];
        var learningPriorities = [];
        var projectOpportunities = [];

        // Strengths: top skills with evidence
        if (skill) {
          skill.skills.filter(function (s) { return s.strength >= 60; }).slice(0, 6).forEach(function (s) {
            strengths.push(s.name + ' — strength ' + s.strength + '% (' + (s.level || 'level not provided') + ', ' + s.evidenceCount + ' evidence items)');
          });
          skill.skills.filter(function (s) { return s.evidenceCount > 0; }).slice(0, 5).forEach(function (s) {
            evidenceHighlights.push(s.name + ' ← ' + s.evidence.map(function (e) { return e.type + ': ' + e.title; }).join(' · '));
          });
        }

        // Gaps from coverage
        if (coverage && coverage.requirements && coverage.requirements.length) {
          coverage.requirements.filter(function (r) { return r.status === 'MISSING'; }).forEach(function (r) {
            gaps.push(r.skillName + ' — MISSING for ' + coverage.role.title + ' (requirement source: ' + r.source + ')');
          });
          coverage.requirements.filter(function (r) { return r.status === 'PARTIAL' || r.status === 'UNVERIFIED'; }).forEach(function (r) {
            gaps.push(r.skillName + ' — ' + r.status + ' for ' + coverage.role.title);
          });
        } else {
          gaps.push('No target-role requirement data available. CareerSphere will not invent job requirements — import a role dataset to compute gaps.');
        }

        // Incomplete information
        if (profile.education.length === 0) incomplete.push('No education records found');
        if (profile.experience.length === 0 && profile.internships.length === 0) incomplete.push('No experience or internship records found');
        if (skill) {
          var noLevel = skill.skills.filter(function (s) { return !s.level; }).length;
          if (noLevel) incomplete.push(noLevel + ' skills have no proficiency level provided');
          var noEvidence = skill.skills.filter(function (s) { return s.evidenceCount === 0; }).length;
          if (noEvidence) incomplete.push(noEvidence + ' skills have no supporting evidence');
        }
        if (profile.sourceDocuments.length === 0) incomplete.push('No source documents imported');

        // Learning priorities
        (analyses.learningPlan || []).slice(0, 5).forEach(function (t) {
          learningPriorities.push('Week ' + t.week + ': ' + t.title + ' (' + t.status + ' for ' + t.role + ')');
        });
        if (!learningPriorities.length) {
          learningPriorities.push('No learning priorities can be generated yet — they require target-role requirement data.');
        }

        // Project opportunities
        if (project) {
          project.projects.forEach(function (p) {
            if (p.improvementOpportunities.length) {
              projectOpportunities.push(p.name + ' — ' + p.improvementOpportunities[0]);
            }
          });
          if (coverage && coverage.requirements) {
            var missingNames = coverage.requirements.filter(function (r) { return r.status === 'MISSING'; }).map(function (r) { return r.skillName; });
            if (missingNames.length) {
              projectOpportunities.push('New project idea: build something using ' + missingNames.slice(0, 4).join(', ') + ' to close identified gaps with evidence.');
            }
          }
        }

        return {
          title: 'What CareerSphere found',
          generatedAt: new Date().toISOString(),
          readiness: readiness,
          sections: [
            { heading: 'Strengths', tone: 'good', items: strengths.length ? strengths : ['Not enough data yet to identify strengths — import more evidence.'] },
            { heading: 'Evidence highlights', tone: 'good', items: evidenceHighlights.length ? evidenceHighlights : ['No skill-to-evidence links found yet.'] },
            { heading: 'Gaps', tone: 'warn', items: gaps },
            { heading: 'Incomplete information', tone: 'muted', items: incomplete.length ? incomplete : ['Profile data looks complete for currently imported sources.'] },
            { heading: 'Learning priorities', tone: 'info', items: learningPriorities },
            { heading: 'Project opportunities', tone: 'info', items: projectOpportunities.length ? projectOpportunities : ['Import projects or target roles to generate project suggestions.'] }
          ],
          disclaimer: 'These findings are CareerSphere analytical estimates derived only from your imported data. Where data is insufficient, that is stated explicitly. Nothing here is fabricated.'
        };
      }

      return {
        buildCards: buildCards,
        computeReadiness: computeReadiness,
        buildCareerPaths: buildCareerPaths,
        buildLearningPlan: buildLearningPlan,
        analyzeOpportunities: analyzeOpportunities,
        buildReport: buildReport
      };
    }]);

})(angular);
