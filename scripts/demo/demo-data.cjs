/**
 * scripts/demo/demo-data.cjs
 *
 * Fictional demo dataset for CSE Research Hub testing and the university demo.
 * Every ID starts with `demo_` so `npm run demo:clean` can remove it all.
 * Documents match the Firestore security-rule schemas exactly.
 */
'use strict';

const DEPT = 'Computer Science and Engineering';

/**
 * Illustrated demo portraits (DiceBear "notionists", CC0 licence — no real
 * people depicted). PNG so React Native <Image> can render it; the Avatar
 * component falls back to initials if the image cannot load.
 */
const avatar = (seed, hair, bg, extra = '') =>
  `https://api.dicebear.com/9.x/notionists/png?seed=${seed}&size=256&hair=${hair}&beardProbability=0&backgroundColor=${bg}${extra || '&glassesProbability=0'}`;

/** login: true => a real email/password account is created for this researcher. */
const RESEARCHERS = [
  {
    uid: 'demo_tahsin', photoURL: avatar('demo_tahsin', 'variant05', 'dbeafe'), login: true, email: 'demo.tahsin@researchhub.test',
    displayName: 'Tahsin Rahman', designation: 'Graduate Researcher', program: 'M.Sc. in CSE', batch: 'Batch 12',
    studentId: 'DEMO-1201', bio: 'Working on efficient vision transformers for low-power medical imaging devices.',
    researchInterests: ['Machine Learning', 'Computer Vision'],
    socialLinks: { github: 'https://github.com/demo-tahsin', googleScholar: 'https://scholar.google.com' },
    approvalStatus: 'approved', daysAgo: 40,
  },
  {
    uid: 'demo_nusrat', photoURL: avatar('demo_nusrat', 'variant02', 'fce7f3'), login: true, email: 'demo.nusrat@researchhub.test',
    displayName: 'Nusrat Jahan', designation: 'Undergraduate Researcher', program: 'B.Sc. in CSE', batch: 'Batch 14',
    studentId: 'DEMO-1402', bio: 'Building open Bangla language datasets and evaluating multilingual models.',
    researchInterests: ['Bangla NLP', 'Data Science'],
    socialLinks: { linkedin: 'https://www.linkedin.com' },
    approvalStatus: 'approved', daysAgo: 35,
  },
  {
    uid: 'demo_farhan', photoURL: avatar('demo_farhan', 'variant38', 'e0f2fe', '&glassesProbability=100&glasses=variant08'), displayName: 'Dr. Farhan Kabir', designation: 'Assistant Professor', program: null, batch: 'Faculty',
    studentId: 'DEMO-F01', bio: 'Supervises thesis groups on network security and fault-tolerant distributed systems.',
    researchInterests: ['Cybersecurity', 'Distributed Systems'],
    socialLinks: { website: 'https://example.com/farhan', googleScholar: 'https://scholar.google.com' },
    approvalStatus: 'approved', daysAgo: 60,
  },
  {
    uid: 'demo_sadia', photoURL: avatar('demo_sadia', 'variant08', 'dcfce7'), displayName: 'Sadia Islam', designation: 'Undergraduate Researcher', program: 'B.Sc. in CSE', batch: 'Batch 15',
    studentId: 'DEMO-1503', bio: 'Designing accessible campus apps and studying how students use research tools.',
    researchInterests: ['Human-Computer Interaction', 'Software Engineering'],
    socialLinks: { github: 'https://github.com/demo-sadia' },
    approvalStatus: 'approved', daysAgo: 28,
  },
  {
    uid: 'demo_rakib', photoURL: avatar('demo_rakib', 'variant22', 'dcfce7'), displayName: 'Rakib Hasan', designation: 'Graduate Researcher', program: 'M.Sc. in CSE', batch: 'Batch 11',
    studentId: 'DEMO-1104', bio: 'Edge computing for smart agriculture sensors and small autonomous robots.',
    researchInterests: ['IoT', 'Robotics'],
    socialLinks: {},
    approvalStatus: 'approved', daysAgo: 50,
  },
  {
    uid: 'demo_maliha', photoURL: avatar('demo_maliha', 'variant28', 'ede9fe'), displayName: 'Maliha Chowdhury', designation: 'Research Assistant', program: 'B.Sc. in CSE', batch: 'Batch 13',
    studentId: 'DEMO-1305', bio: 'Data pipelines and reproducible ML experiments for public health datasets.',
    researchInterests: ['Data Science', 'Machine Learning'],
    socialLinks: { researchGate: 'https://www.researchgate.net' },
    approvalStatus: 'approved', daysAgo: 22,
  },
  // Admin-portal test applicants
  {
    uid: 'demo_arif', photoURL: avatar('demo_arif', 'variant12', 'fef3c7'), displayName: 'Arif Hossain', designation: 'Undergraduate Student', program: 'B.Sc. in CSE', batch: 'Batch 16',
    studentId: 'DEMO-1606', bio: 'Interested in compilers and programming languages.',
    researchInterests: ['Software Engineering'], socialLinks: {},
    approvalStatus: 'pending', daysAgo: 2,
  },
  {
    uid: 'demo_lamia', photoURL: avatar('demo_lamia', 'variant58', 'fef3c7'), displayName: 'Lamia Akter', designation: 'Undergraduate Student', program: 'B.Sc. in CSE', batch: 'Batch 16',
    studentId: 'DEMO-1607', bio: 'Exploring computer vision for document digitisation.',
    researchInterests: ['Computer Vision'], socialLinks: {},
    approvalStatus: 'pending', daysAgo: 1,
  },
  {
    uid: 'demo_imran', photoURL: avatar('demo_imran', 'variant52', 'ede9fe'), displayName: 'Imran Ali', designation: 'Undergraduate Student', program: 'B.Sc. in CSE', batch: 'Batch 15',
    studentId: 'DEMO-1508', bio: 'Applying to join the IoT research group.',
    researchInterests: ['IoT'], socialLinks: {},
    approvalStatus: 'rejected', rejectionReason: 'Student ID could not be verified with department records (demo).',
    daysAgo: 6,
  },
];

const WORKS = [
  ['demo_work_01', 'demo_tahsin', 'Lightweight Vision Transformers for Retinal Scans', 'Compressing ViT models with knowledge distillation so diabetic retinopathy screening can run on a low-cost Android phone.', ['#ComputerVision', '#MachineLearning'], 'Experiment', 'https://github.com/demo-tahsin', 2],
  ['demo_work_02', 'demo_tahsin', 'Benchmark of Pruning Methods on Edge GPUs', 'Comparing structured and unstructured pruning for latency and accuracy trade-offs on Jetson Nano boards.', ['#MachineLearning'], 'Literature Review', null, 9],
  ['demo_work_03', 'demo_nusrat', 'Open Bangla Sentiment Corpus', 'Collecting and annotating 20k Bangla social media posts to build an openly licensed sentiment analysis benchmark.', ['#BanglaNLP', '#DataScience'], 'Experiment', null, 1],
  ['demo_work_04', 'demo_nusrat', 'Evaluating Multilingual LLMs on Bangla QA', 'Measuring how well multilingual language models answer Bangla reading-comprehension questions compared to English.', ['#BanglaNLP', '#MachineLearning'], 'Idea', null, 12],
  ['demo_work_05', 'demo_farhan', 'Intrusion Detection for Campus Networks', 'Thesis group project training anomaly-detection models on anonymised university network flow logs.', ['#Cybersecurity', '#MachineLearning'], 'Experiment', 'https://example.com/farhan', 4],
  ['demo_work_06', 'demo_farhan', 'Byzantine-Tolerant Consensus for Lab Clusters', 'Prototyping a simplified PBFT variant to teach fault tolerance on the department Raspberry Pi cluster.', ['#DistributedSystems'], 'Writing', null, 15],
  ['demo_work_07', 'demo_sadia', 'Accessible Course Registration App', 'Usability study and redesign of the course registration flow for screen-reader and low-vision users.', ['#HumanComputerInteraction', '#SoftwareEngineering'], 'Idea', null, 3],
  ['demo_work_08', 'demo_sadia', 'Code Review Habits of Student Teams', 'Survey and repository mining of how undergraduate project teams review each other\'s pull requests.', ['#SoftwareEngineering'], 'Literature Review', null, 18],
  ['demo_work_09', 'demo_rakib', 'Soil-Moisture Sensor Mesh for Rice Fields', 'Low-power LoRa sensor mesh that predicts irrigation needs and alerts farmers by SMS.', ['#IoT', '#DataScience'], 'Experiment', null, 5],
  ['demo_work_10', 'demo_rakib', 'Line-Following Robot with On-Device Vision', 'Replacing IR sensors with a tiny CNN on a microcontroller camera for robust line following.', ['#Robotics', '#ComputerVision'], 'Writing', null, 20],
  ['demo_work_11', 'demo_maliha', 'Reproducible Dengue Forecasting Pipeline', 'Versioned data pipeline and baseline models for weekly dengue case forecasting from public health data.', ['#DataScience', '#MachineLearning'], 'Experiment', null, 7],
  ['demo_work_12', 'demo_maliha', 'Dataset Cards for Bangladeshi Open Data', 'Writing standardised dataset documentation for government open datasets to improve research reuse.', ['#DataScience'], 'Idea', null, 11],
  // A draft visible only to its author (log in as Tahsin to see it)
  ['demo_work_13', 'demo_tahsin', 'Draft: Federated Learning Across Hospitals', 'Early notes on privacy-preserving training across partner hospitals without sharing raw images.', ['#MachineLearning'], 'Idea', null, 0, 'draft'],
];

module.exports = { DEPT, RESEARCHERS, WORKS };
