/**
 * CareerSphere AI — Text Extraction Service
 * Lightweight NLP pipeline for extracting career entities from unstructured text.
 * Extracts: skills, technologies, languages, frameworks, tools, roles,
 * education, certifications, experience, achievements, interests, goals.
 *
 * All extractions are marked with confidence: Confirmed | Detected | Needs verification
 */
(function (angular) {
  'use strict';

  angular.module('careerSphere.services')
    .factory('TextExtractionService', [function () {

      // ── Knowledge base for entity detection ──────────────────────────

      var SKILL_KEYWORDS = {
        'Programming': ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Dart', 'Perl', 'Haskell', 'Lua', 'Shell', 'Bash', 'PowerShell', 'SQL', 'NoSQL', 'HTML', 'CSS', 'SASS', 'LESS'],
        'AI/ML': ['Machine Learning', 'Deep Learning', 'Neural Networks', 'NLP', 'Natural Language Processing', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'LLM', 'Large Language Models', 'Generative AI', 'Reinforcement Learning', 'Data Science', 'Data Analysis', 'AI', 'ML', 'MLOps', 'Model Deployment'],
        'IoT': ['IoT', 'Internet of Things', 'ESP32', 'ESP8266', 'Arduino', 'Raspberry Pi', 'LoRa', 'LoRaWAN', 'GPS', 'Sensors', 'MQTT', 'Embedded Systems', 'Microcontrollers', 'Zigbee', 'Bluetooth', 'BLE', 'Wi-Fi', 'RFID', 'NFC'],
        'Cloud': ['AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Serverless', 'Lambda', 'EC2', 'S3', 'CloudFormation', 'CI/CD', 'DevOps', 'Jenkins', 'GitHub Actions'],
        'Frontend': ['AngularJS', 'Angular', 'React', 'Vue.js', 'Vue', 'Svelte', 'Next.js', 'Nuxt', 'Bootstrap', 'Tailwind CSS', 'Material UI', 'Webpack', 'Vite', 'Redux', 'RxJS', 'D3.js', 'Chart.js', 'Three.js'],
        'Backend': ['Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Spring', 'ASP.NET', 'Laravel', 'Ruby on Rails', 'GraphQL', 'REST API', 'RESTful', 'Microservices', 'gRPC', 'WebSocket'],
        'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'SQLite', 'Firebase', 'Supabase', 'Oracle', 'SQL Server', 'MariaDB', 'Neo4j', 'InfluxDB'],
        'Tools': ['Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'Figma', 'VS Code', 'IntelliJ', 'PyCharm', 'Postman', 'Linux', 'Unix', 'Nginx', 'Apache', 'Kafka', 'RabbitMQ', 'Airflow', 'Spark', 'Hadoop'],
        'Soft Skills': ['Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Time Management', 'Agile', 'Scrum', 'Mentoring', 'Presentation', 'Collaboration', 'Adaptability', 'Creativity', 'Project Management'],
        'Other': ['Blockchain', 'Web3', 'Solidity', 'Cybersecurity', 'Penetration Testing', 'Network Security', 'Cryptography', 'Game Development', 'Unity', 'Unreal Engine', 'AR/VR', 'Augmented Reality', 'Virtual Reality', 'Mobile Development', 'Android', 'iOS', 'Flutter', 'React Native', 'UI/UX', 'Figma', 'Adobe XD', 'Sketch', 'Product Management', 'Business Analysis', 'Quality Assurance', 'Selenium', 'Jest', 'Mocha', 'Cypress', 'Testing', 'TDD', 'BDD', 'Design Patterns', 'System Design', 'Algorithms', 'Data Structures', 'OOP', 'Functional Programming', 'Version Control', 'Agile', 'Scrum', 'Kanban']
      };

      var ROLE_KEYWORDS = [
        'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
        'Data Scientist', 'Data Analyst', 'ML Engineer', 'AI Engineer', 'Machine Learning Engineer',
        'DevOps Engineer', 'Cloud Engineer', 'Cloud Architect', 'Site Reliability Engineer',
        'Embedded Engineer', 'IoT Engineer', 'Firmware Engineer', 'Hardware Engineer',
        'Mobile Developer', 'Android Developer', 'iOS Developer', 'React Native Developer',
        'Product Manager', 'Project Manager', 'Scrum Master', 'Agile Coach',
        'UI/UX Designer', 'UX Designer', 'UI Designer', 'Graphic Designer',
        'QA Engineer', 'Test Engineer', 'Automation Engineer', 'SDET',
        'Security Engineer', 'Network Engineer', 'System Administrator', 'Database Administrator',
        'Business Analyst', 'Solutions Architect', 'Technical Lead', 'Engineering Manager',
        'Research Scientist', 'Research Engineer', 'Computer Vision Engineer', 'NLP Engineer',
        'Blockchain Developer', 'Web3 Developer', 'Game Developer', 'Unity Developer',
        'Intern', 'Trainee', 'Junior', 'Senior', 'Lead', 'Principal', 'Staff'
      ];

      var EDUCATION_KEYWORDS = [
        'B.Tech', 'B.E.', 'B.Sc', 'B.Sc.', 'Bachelor', 'M.Tech', 'M.E.', 'M.Sc', 'MCA', 'MBA',
        'Master', 'Ph.D', 'PhD', 'Doctorate', 'Diploma', 'Certificate', 'High School',
        'Intermediate', '10th', '12th', 'Secondary', 'Higher Secondary', 'Post Graduate',
        'Undergraduate', 'Graduate', 'Bachelor of', 'Master of', 'B.Tech.', 'M.Tech.'
      ];

      var CERTIFICATION_KEYWORDS = [
        'Certified', 'Certification', 'Certificate', 'AWS Certified', 'Azure Certified',
        'Google Cloud Certified', 'PMP', 'Scrum Master', 'CSM', 'PSM', 'ITIL', 'CompTIA',
        'Cisco', 'CCNA', 'CCNP', 'Oracle Certified', 'Java Certified', 'Python Certified',
        'TensorFlow Developer', 'Machine Learning Specialization', 'Deep Learning Specialization',
        'Professional Certificate', 'Specialization', 'Nanodegree', 'MicroMasters'
      ];

      var ACHIEVEMENT_KEYWORDS = [
        'won', 'winner', 'award', 'prize', 'first place', 'second place', 'third place',
        'hackathon', 'competition', 'ranked', 'top 10', 'top 5', 'top 3', 'finalist',
        'scholarship', 'fellowship', 'grant', 'published', 'paper', 'patent', 'research',
        'outstanding', 'excellence', 'honor', 'honours', 'dean\'s list', 'cum laude',
        'magna cum laude', 'summa cum laude', 'valedictorian', 'salutatorian'
      ];

      var INTEREST_KEYWORDS = [
        'interested in', 'passionate about', 'enthusiastic about', 'love', 'enjoy',
        'hobby', 'hobbies', 'freelance', 'volunteer', 'open source', 'contributor',
        'blog', 'writing', 'reading', 'photography', 'music', 'gaming', 'sports',
        'travel', 'cooking', 'art', 'design', 'robotics', 'electronics', 'AI ethics',
        'sustainability', 'climate', 'education', 'mentoring', 'community'
      ];

      var DOMAIN_KEYWORDS = [
        'Healthcare', 'Finance', 'Banking', 'E-commerce', 'Retail', 'Education',
        'Agriculture', 'Manufacturing', 'Automotive', 'Aerospace', 'Defense',
        'Telecommunications', 'Energy', 'Utilities', 'Real Estate', 'Insurance',
        'Media', 'Entertainment', 'Gaming', 'Social Media', 'Networking',
        'Cybersecurity', 'Logistics', 'Supply Chain', 'Hospitality', 'Tourism',
        'Pharmaceutical', 'Biotechnology', 'Environmental', 'Government', 'Non-profit'
      ];

      var TextExtractionService = {

        /**
         * Main extraction pipeline.
         * Returns { skills, technologies, languages, frameworks, tools, roles,
         *   education, certifications, experience, achievements, interests,
         *   goals, domains, keywords, yearsOfExperience, raw }
         */
        extract: function (text) {
          if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return emptyResult();
          }

          var normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          var lower = normalized.toLowerCase();

          var result = {
            skills: extractSkills(normalized, lower),
            technologies: extractTechnologies(normalized, lower),
            languages: extractLanguages(normalized, lower),
            frameworks: extractFrameworks(normalized, lower),
            tools: extractTools(normalized, lower),
            roles: extractRoles(normalized, lower),
            education: extractEducation(normalized, lower),
            certifications: extractCertifications(normalized, lower),
            experience: extractExperience(normalized, lower),
            achievements: extractAchievements(normalized, lower),
            interests: extractInterests(normalized, lower),
            goals: extractGoals(normalized, lower),
            domains: extractDomains(normalized, lower),
            keywords: extractKeywords(normalized, lower),
            yearsOfExperience: extractYearsOfExperience(normalized, lower),
            raw: text
          };

          return result;
        },

        /**
         * Quick skill detection from a single line of text.
         */
        quickSkillScan: function (text) {
          if (!text) return [];
          var lower = text.toLowerCase();
          var found = [];
          Object.keys(SKILL_KEYWORDS).forEach(function (category) {
            SKILL_KEYWORDS[category].forEach(function (skill) {
              if (termIndex(lower,skill.toLowerCase()) > -1) {
                found.push({ name: skill, category: category, confidence: 'Detected' });
              }
            });
          });
          return found;
        }
      };

      // ── Extraction helpers ───────────────────────────────────────────

      function extractSkills(text, lower) {
        var found = [];
        var seen = {};
        Object.keys(SKILL_KEYWORDS).forEach(function (category) {
          SKILL_KEYWORDS[category].forEach(function (skill) {
            var skillLower = skill.toLowerCase();
            if (termIndex(lower,skillLower) > -1 && !seen[skillLower]) {
              seen[skillLower] = true;
              found.push({
                name: skill,
                category: category,
                confidence: 'Detected',
                context: findContext(text, skillLower)
              });
            }
          });
        });
        return found;
      }

      function extractTechnologies(text, lower) {
        var techs = [];
        var seen = {};
        // Technologies are a broader set including specific versions
        var techPatterns = [
          'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt', 'Node.js',
          'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel',
          'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy',
          'OpenCV', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins',
          'AWS', 'Azure', 'GCP', 'Firebase', 'Supabase',
          'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
          'GraphQL', 'REST', 'WebSocket', 'gRPC',
          'Git', 'GitHub', 'GitLab', 'Jira', 'Figma',
          'Linux', 'Windows', 'MacOS', 'Android', 'iOS',
          'Arduino', 'Raspberry Pi', 'ESP32', 'ESP8266',
          'LoRa', 'Zigbee', 'MQTT', 'Bluetooth', 'Wi-Fi',
          'Blockchain', 'Ethereum', 'Solidity', 'Web3',
          'Unity', 'Unreal Engine', 'Three.js', 'D3.js',
          'Bootstrap', 'Tailwind', 'Material UI', 'SASS', 'LESS',
          'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier',
          'Jest', 'Mocha', 'Cypress', 'Selenium',
          'Kafka', 'RabbitMQ', 'Spark', 'Hadoop', 'Airflow',
          'Nginx', 'Apache', 'Tomcat', 'IIS',
          'OAuth', 'JWT', 'SAML', 'SSL/TLS',
          'CI/CD', 'DevOps', 'Agile', 'Scrum', 'Kanban'
        ];
        techPatterns.forEach(function (tech) {
          var techLower = tech.toLowerCase();
          if (termIndex(lower,techLower) > -1 && !seen[techLower]) {
            seen[techLower] = true;
            techs.push({
              name: tech,
              confidence: 'Detected',
              context: findContext(text, techLower)
            });
          }
        });
        return techs;
      }

      function extractLanguages(text, lower) {
        var langs = [];
        var seen = {};
        var langPatterns = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Dart', 'Perl', 'Haskell', 'Lua', 'Bash', 'Shell', 'PowerShell', 'SQL', 'HTML', 'CSS', 'SASS', 'LESS', 'XML', 'JSON', 'YAML', 'Markdown'];
        langPatterns.forEach(function (lang) {
          var langLower = lang.toLowerCase();
          if (termIndex(lower,langLower) > -1 && !seen[langLower]) {
            seen[langLower] = true;
            langs.push({
              name: lang,
              confidence: 'Detected',
              context: findContext(text, langLower)
            });
          }
        });
        return langs;
      }

      function extractFrameworks(text, lower) {
        var frameworks = [];
        var seen = {};
        var fwPatterns = ['AngularJS', 'Angular', 'React', 'Vue.js', 'Vue', 'Svelte', 'Next.js', 'Nuxt', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Spring', 'ASP.NET', 'Laravel', 'Ruby on Rails', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'Bootstrap', 'Tailwind CSS', 'Material UI', 'Redux', 'RxJS', 'D3.js', 'Chart.js', 'Three.js', 'Unity', 'Unreal Engine', 'Flutter', 'React Native', 'Electron', 'Qt', 'GTK', 'WPF', 'WinForms', 'Blazor', 'Phoenix', 'Gin', 'Echo', 'Fiber', 'Actix', 'Rocket', 'Actix-web', 'Warp', 'Tide'];
        fwPatterns.forEach(function (fw) {
          var fwLower = fw.toLowerCase();
          if (termIndex(lower,fwLower) > -1 && !seen[fwLower]) {
            seen[fwLower] = true;
            frameworks.push({
              name: fw,
              confidence: 'Detected',
              context: findContext(text, fwLower)
            });
          }
        });
        return frameworks;
      }

      function extractTools(text, lower) {
        var tools = [];
        var seen = {};
        var toolPatterns = ['Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Trello', 'Asana', 'Figma', 'VS Code', 'IntelliJ', 'PyCharm', 'Eclipse', 'NetBeans', 'Sublime Text', 'Atom', 'Vim', 'Emacs', 'Postman', 'Insomnia', 'Linux', 'Unix', 'Nginx', 'Apache', 'Kafka', 'RabbitMQ', 'Airflow', 'Spark', 'Hadoop', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Ansible', 'Puppet', 'Chef', 'Vagrant', 'VirtualBox', 'VMware', 'Wireshark', 'Nmap', 'Metasploit', 'Burp Suite', 'OWASP ZAP', 'Selenium', 'Jest', 'Mocha', 'Cypress', 'Junit', 'TestNG', 'PyTest', 'Unittest', 'Mockito', 'PowerBI', 'Tableau', 'Excel', 'Google Sheets', 'Jupyter', 'Colab', 'RStudio', 'MATLAB', 'Simulink', 'AutoCAD', 'SolidWorks', 'Catia', 'ANSYS', 'LabVIEW', 'Multisim', 'Proteus', 'Eagle', 'KiCad', 'Altium'];
        toolPatterns.forEach(function (tool) {
          var toolLower = tool.toLowerCase();
          if (termIndex(lower,toolLower) > -1 && !seen[toolLower]) {
            seen[toolLower] = true;
            tools.push({
              name: tool,
              confidence: 'Detected',
              context: findContext(text, toolLower)
            });
          }
        });
        return tools;
      }

      function extractRoles(text, lower) {
        var roles = [];
        var seen = {};
        ROLE_KEYWORDS.forEach(function (role) {
          var roleLower = role.toLowerCase();
          if (termIndex(lower,roleLower) > -1 && !seen[roleLower]) {
            seen[roleLower] = true;
            roles.push({
              name: role,
              confidence: 'Detected',
              context: findContext(text, roleLower)
            });
          }
        });
        return roles;
      }

      function extractEducation(text, lower) {
        var education = [];
        var seen = {};
        // Capture real degree phrases first (not just keywords)
        var degreePatterns = [
          /(?:B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?)(?:\s+(?:in|with\s+)?[A-Za-z .&/-]{2,45})/gi,
          /(?:B\.?Sc|M\.?Sc)(?:\.[A-Za-z .&/-]{0,45})?/gi,
          /\b(?:Bachelor|Master)s?(?:\s+of)?\s+(?:of\s+)?(?:Science|Technology|Engineering|Arts|Computer Applications|Business Administration|Commerce|Artificial Intelligence|Data Science|Information Technology)[A-Za-z .&/-]{0,30}/gi,
          /\b(?:MCA|MBA|BCA|BBA|Ph\.?D|PhD)(?:\s+in\s+[A-Za-z .&/-]{2,35})?/gi,
          /\b(?:Diploma|Higher Secondary|Secondary Education)(?:\s+in\s+[A-Za-z .&/-]{2,35})?/gi
        ];
        degreePatterns.forEach(function (pattern) {
          var match;
          while ((match = pattern.exec(text)) !== null) {
            var phrase = match[0].trim().replace(/\s+/g, ' ');
            var key = phrase.toLowerCase();
            if (!seen[key] && phrase.length > 2) {
              seen[key] = true;
              education.push({
                name: phrase,
                confidence: 'Confirmed',
                context: findContext(text, key)
              });
            }
          }
        });
        // Fallback: generic keyword detection (marked Detected, not Confirmed)
        if (education.length === 0) {
          EDUCATION_KEYWORDS.forEach(function (edu) {
            var eduLower = edu.toLowerCase();
            if (termIndex(lower,eduLower) > -1 && !seen[eduLower]) {
              seen[eduLower] = true;
              education.push({
                name: edu,
                confidence: 'Detected',
                context: findContext(text, eduLower)
              });
            }
          });
        }
        return education;
      }

      function extractCertifications(text, lower) {
        var certs = [];
        var seen = {};
        // Capture certificate phrases: "<Name> Certification/Certificate/Specialization"
        var certPatterns = [
          /\b([A-Za-z0-9\.+# ]{2,45}(?:Certification|Certificate|Specialization|Specialisation|Nanodegree|Professional Certificate|Track)\b(?:\s+(?:in|from|by)\s+[A-Za-z0-9 .&/-]{2,40})?)/gi,
          /\b((?:AWS|Azure|Google|Microsoft|Oracle|Cisco|CompTIA|Salesforce) Certified [A-Za-z0-9 .&/-]{2,45})/gi,
          /\b(Certified [A-Za-z ]{3,40}(?:Professional|Associate|Expert|Developer|Engineer|Analyst|Architect))/gi
        ];
        certPatterns.forEach(function (pattern) {
          var match;
          while ((match = pattern.exec(text)) !== null) {
            var phrase = match[1].trim().replace(/\s+/g, ' ');
            var key = phrase.toLowerCase();
            if (!seen[key] && phrase.length > 4 && !/^(the|and|or)\b/i.test(phrase)) {
              seen[key] = true;
              certs.push({
                name: phrase,
                confidence: 'Confirmed',
                context: findContext(text, key)
              });
            }
          }
        });
        // Fallback: keyword detection
        if (certs.length === 0) {
          CERTIFICATION_KEYWORDS.forEach(function (cert) {
            var certLower = cert.toLowerCase();
            if (termIndex(lower,certLower) > -1 && !seen[certLower]) {
              seen[certLower] = true;
              certs.push({
                name: cert,
                confidence: 'Detected',
                context: findContext(text, certLower)
              });
            }
          });
        }
        return certs;
      }

      function extractExperience(text, lower) {
        var experience = [];
        // Look for patterns like "X years of experience" or "X+ years"
        var yearPatterns = [
          /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
          /(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)/gi,
          /experience\s*(?:of\s*)?(\d+)\+?\s*years?/gi,
          /(\d+)\+?\s*years?\s*(?:in|with|using|working)/gi
        ];
        yearPatterns.forEach(function (pattern) {
          var match;
          while ((match = pattern.exec(text)) !== null) {
            experience.push({
              years: parseInt(match[1], 10),
              confidence: 'Detected',
              context: match[0]
            });
          }
        });
        return experience;
      }

      function extractAchievements(text, lower) {
        var achievements = [];
        var seen = {};
        // Capture the achievement phrase, not just the trigger keyword
        var achPatterns = [
          /\b(?:won|winner of|awarded?|prize(?:\s+of)?|received|selected for|finalist(?:\s+of)?)\s+([^.,;\n]{3,70})/gi,
          /\b(?:first|second|third)\s+place(?:\s+(?:in|at|at the))?\s+([^.,;\n]{3,60})/gi,
          /\b(?:ranked|top)\s+\d+[^.,;\n]{0,60}/gi,
          /\b(?:winner|champion)\s*,?\s*([^.,;\n]{3,60})/gi
        ];
        achPatterns.forEach(function (pattern) {
          var match;
          while ((match = pattern.exec(text)) !== null) {
            var phrase = (match[1] || match[0]).trim().replace(/\s+/g, ' ');
            var key = phrase.toLowerCase();
            if (!seen[key] && phrase.length > 3) {
              seen[key] = true;
              achievements.push({
                name: phrase.charAt(0).toUpperCase() + phrase.slice(1),
                confidence: 'Confirmed',
                context: match[0].trim()
              });
            }
          }
        });
        // Fallback: keyword with surrounding context
        if (achievements.length === 0) {
          ACHIEVEMENT_KEYWORDS.forEach(function (ach) {
            var achLower = ach.toLowerCase();
            if (termIndex(lower,achLower) > -1 && !seen[achLower]) {
              seen[achLower] = true;
              achievements.push({
                name: findContext(text, achLower),
                confidence: 'Detected',
                context: findContext(text, achLower)
              });
            }
          });
        }
        return achievements;
      }

      function extractInterests(text, lower) {
        var interests = [];
        var seen = {};
        var interestPatterns = [
          /(?:interested in|passionate about|enthusiastic about|fond of)\s+([^.,;\n]{3,60})/gi,
          /(?:I\s+)?(?:enjoy|love|like)\s+([a-z][^.,;\n]{3,55})/gi,
          /(?:hobbies?|interests?)\s*(?:include|are|:)\s*([^.\n]{3,100})/gi
        ];
        interestPatterns.forEach(function (pattern) {
          var match;
          while ((match = pattern.exec(text)) !== null) {
            var phrase = match[1].trim().replace(/\s+/g, ' ');
            var key = phrase.toLowerCase();
            if (!seen[key] && phrase.length > 3) {
              seen[key] = true;
              interests.push({
                name: phrase,
                confidence: 'Confirmed',
                context: match[0].trim()
              });
            }
          }
        });
        return interests;
      }

      function extractGoals(text, lower) {
        var goals = [];
        var goalPatterns = [
          /(?:want|wish|aim|goal|target|aspire|plan|hope|looking|seeking)\s+to\s+([^.,;\n]{5,80})/gi,
          /(?:interested|passionate)\s+in\s+([^.,;\n]{5,80})/gi,
          /(?:career\s+goal|objective|aspiration)\s*(?:is|to)?\s*[:]?([^.,;\n]{5,80})/gi
        ];
        goalPatterns.forEach(function (pattern) {
          var match;
          while ((match = pattern.exec(text)) !== null) {
            var goal = match[1].trim();
            if (goal.length > 3) {
              goals.push({
                text: goal,
                confidence: 'Detected',
                context: match[0]
              });
            }
          }
        });
        return goals;
      }

      function extractDomains(text, lower) {
        var domains = [];
        var seen = {};
        DOMAIN_KEYWORDS.forEach(function (domain) {
          var domainLower = domain.toLowerCase();
          if (termIndex(lower,domainLower) > -1 && !seen[domainLower]) {
            seen[domainLower] = true;
            domains.push({
              name: domain,
              confidence: 'Detected',
              context: findContext(text, domainLower)
            });
          }
        });
        return domains;
      }

      function extractKeywords(text, lower) {
        var keywords = [];
        var seen = {};
        // Extract capitalized multi-word phrases and technical terms
        var words = text.split(/[\s,;:.!?()[\]{}]+/);
        words.forEach(function (word) {
          var clean = word.replace(/[^a-zA-Z0-9+#\/]/g, '');
          if (clean.length > 2 && clean.length < 30) {
            var cleanLower = clean.toLowerCase();
            if (!seen[cleanLower] && isSignificantWord(clean)) {
              seen[cleanLower] = true;
              keywords.push({
                word: clean,
                confidence: 'Detected'
              });
            }
          }
        });
        return keywords.slice(0, 50); // Limit to top 50
      }

      function extractYearsOfExperience(text, lower) {
        var patterns = [
          /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/gi,
          /(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)/gi,
          /experience\s*(?:of\s*)?(\d+)\+?\s*years?/gi,
          /(\d+)\+?\s*years?\s*(?:in|with|using|working)/gi
        ];
        for (var i = 0; i < patterns.length; i++) {
          var match = patterns[i].exec(text);
          if (match) {
            return { years: parseInt(match[1], 10), confidence: 'Detected' };
          }
        }
        return null;
      }

      /**
       * Word-boundary aware search on a lowercased haystack.
       * Returns the index of the term only when it appears as a whole
       * token (so "R" does not match inside "role", "Java" does not
       * match inside "JavaScript"), or -1 when absent.
       * Terms containing non-word characters (C++, C#, Node.js, CI/CD)
       * are matched with boundaries on their word characters only.
       */
      function termIndex(lower, term) {
        if (!term) return -1;
        var idx = lower.indexOf(term);
        while (idx !== -1) {
          var before = idx === 0 ? '' : lower.charAt(idx - 1);
          var afterIdx = idx + term.length;
          var after = afterIdx >= lower.length ? '' : lower.charAt(afterIdx);
          var startOk = before === '' || !/[a-z0-9_]/i.test(before);
          var endOk = after === '' || !/[a-z0-9_]/i.test(after) ||
            // Tolerate a single plural "s" (REST API → REST APIs) but never
            // mid-word continuations (java → javascript)
            (after === 's' && (afterIdx + 1 >= lower.length || !/[a-z0-9_]/i.test(lower.charAt(afterIdx + 1))));
          if (startOk && endOk) return idx;
          idx = lower.indexOf(term, idx + 1);
        }
        return -1;
      }

      function findContext(text, searchTerm) {
        var idx = termIndex(text.toLowerCase(), searchTerm);
        if (idx === -1) return '';
        var start = Math.max(0, idx - 40);
        var end = Math.min(text.length, idx + searchTerm.length + 40);
        return text.substring(start, end).replace(/\n/g, ' ').trim();
      }

      function isSignificantWord(word) {
        var stopWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'had', 'been', 'was', 'were', 'are', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'get', 'got', 'make', 'made', 'take', 'took', 'come', 'came', 'see', 'saw', 'know', 'knew', 'think', 'thought', 'look', 'looked', 'want', 'wanted', 'give', 'gave', 'find', 'found', 'tell', 'told', 'ask', 'asked', 'work', 'worked', 'call', 'called', 'try', 'tried', 'feel', 'felt', 'become', 'became', 'leave', 'left', 'put', 'mean', 'meant', 'keep', 'kept', 'let', 'begin', 'began', 'seem', 'seemed', 'help', 'helped', 'talk', 'talked', 'turn', 'turned', 'start', 'started', 'show', 'showed', 'hear', 'heard', 'play', 'played', 'run', 'ran', 'move', 'moved', 'like', 'liked', 'live', 'lived', 'believe', 'believed', 'hold', 'held', 'bring', 'brought', 'happen', 'happened', 'write', 'wrote', 'provide', 'provided', 'sit', 'sat', 'stand', 'stood', 'lose', 'lost', 'pay', 'paid', 'meet', 'met', 'include', 'included', 'continue', 'continued', 'set', 'learn', 'learned', 'change', 'changed', 'lead', 'led', 'understand', 'understood', 'watch', 'watched', 'follow', 'followed', 'stop', 'stopped', 'create', 'created', 'speak', 'spoke', 'read', 'allow', 'allowed', 'add', 'added', 'spend', 'spent', 'grow', 'grew', 'open', 'opened', 'walk', 'walked', 'win', 'won', 'offer', 'offered', 'remember', 'remembered', 'love', 'loved', 'consider', 'considered', 'appear', 'appeared', 'buy', 'bought', 'wait', 'waited', 'serve', 'served', 'die', 'died', 'send', 'sent', 'expect', 'expected', 'build', 'built', 'stay', 'stayed', 'fall', 'fell', 'cut', 'reach', 'reached', 'kill', 'killed', 'remain', 'remained', 'suggest', 'suggested', 'raise', 'raised', 'pass', 'passed', 'sell', 'sold', 'require', 'required', 'report', 'reported', 'decide', 'decided', 'pull', 'pulled'];
        return stopWords.indexOf(word.toLowerCase()) === -1;
      }

      function emptyResult() {
        return {
          skills: [], technologies: [], languages: [], frameworks: [], tools: [],
          roles: [], education: [], certifications: [], experience: [],
          achievements: [], interests: [], goals: [], domains: [],
          keywords: [], yearsOfExperience: null, raw: ''
        };
      }

      return TextExtractionService;
    }]);

})(angular);
