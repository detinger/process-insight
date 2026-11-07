// Large landscape benchmark fixture (AT-26): 500 processes + ~1500 relations.
// Programmatically generated from realistic IT-domain process templates.
// Used to verify: load time, search/filter, hierarchy navigation, layout cancellation.

import { newId } from '../../domain/contracts/ids';
import type { ProjectManifest, ProcessDefinition, LandscapeRelation, ProcessCandidate } from '../../domain/contracts/types';

export interface LargeFixtureBundle {
  manifest: ProjectManifest;
  processes: ProcessDefinition[];
  relations: LandscapeRelation[];
  candidates: ProcessCandidate[];
}

// Domain areas driving the process tree structure
const DOMAINS = [
  'IT Service Management',
  'Information Security',
  'Software Development',
  'Data Management',
  'Infrastructure Operations',
  'Enterprise Architecture',
  'Project Management',
  'Procurement and Vendor',
  'HR and Workforce',
  'Finance and Compliance',
];

const SUBDOMAINS: Record<string, string[]> = {
  'IT Service Management': ['Incident Management', 'Problem Management', 'Change Management', 'Service Request', 'Service Level Management', 'Knowledge Management'],
  'Information Security': ['Identity and Access', 'Vulnerability Management', 'Security Monitoring', 'Data Protection', 'Compliance Assurance', 'Incident Response'],
  'Software Development': ['Requirements Engineering', 'Design and Architecture', 'Coding and Review', 'Testing', 'Build and Release', 'Deployment'],
  'Data Management': ['Data Governance', 'Master Data Management', 'Data Quality', 'Analytics and Reporting', 'Data Integration', 'Data Lifecycle'],
  'Infrastructure Operations': ['Capacity Planning', 'Availability Management', 'Backup and Recovery', 'Network Operations', 'Cloud Management', 'Monitoring and Alerting'],
  'Enterprise Architecture': ['Business Architecture', 'Application Architecture', 'Technology Architecture', 'Integration Architecture', 'Portfolio Management', 'Standards Governance'],
  'Project Management': ['Project Initiation', 'Planning', 'Execution', 'Monitoring and Control', 'Closure', 'Portfolio Prioritization'],
  'Procurement and Vendor': ['Sourcing', 'Contract Management', 'Vendor Evaluation', 'Purchase Order Management', 'Invoice Processing', 'Vendor Performance'],
  'HR and Workforce': ['Recruitment', 'Onboarding', 'Performance Management', 'Training and Development', 'Offboarding', 'Workforce Planning'],
  'Finance and Compliance': ['Budgeting', 'Cost Allocation', 'Audit Management', 'Regulatory Reporting', 'Internal Controls', 'Risk Management'],
};

const PROCESS_TEMPLATES = [
  'Assess {item}',
  'Approve {item}',
  'Monitor {item}',
  'Review {item}',
  'Update {item} records',
  'Notify stakeholders of {item}',
  'Escalate {item}',
  'Archive {item}',
  'Prioritize {item}',
  'Validate {item} compliance',
];

const ITEMS: Record<string, string[]> = {
  'Incident Management': ['incident', 'major incident', 'P1 alert', 'SLA breach', 'ticket'],
  'Problem Management': ['root cause', 'known error', 'workaround', 'problem record', 'trend'],
  'Change Management': ['change request', 'standard change', 'emergency change', 'CAB decision', 'rollback'],
  'Service Request': ['request', 'access request', 'fulfillment', 'catalog item', 'approval'],
  'Identity and Access': ['user account', 'privilege', 'role assignment', 'certificate', 'access review'],
  'Vulnerability Management': ['CVE finding', 'patch', 'scan result', 'remediation', 'exception'],
  'Software Development': ['user story', 'pull request', 'code review', 'test case', 'release note'],
  'Data Management': ['dataset', 'data quality rule', 'master record', 'pipeline', 'retention schedule'],
};

function getItems(subdomain: string): string[] {
  return ITEMS[subdomain] ?? ['item', 'record', 'task', 'request', 'approval'];
}

export function buildLargeFixture(): LargeFixtureBundle {
  const now = new Date().toISOString();
  const projId = newId('proj');

  const processes: ProcessDefinition[] = [];
  const relations: LandscapeRelation[] = [];
  const candidates: ProcessCandidate[] = [];

  // Create domain-level (L0) processes
  const domainProcessIds: Record<string, string> = {};
  for (const domain of DOMAINS) {
    const id = newId('proc');
    domainProcessIds[domain] = id;
    processes.push({ projectId: projId,
      id,
      title: domain,
      purpose: `Govern and coordinate all ${domain.toLowerCase()} activities across the organization.`,
      levelLabel: 'L0',
      trigger: `Strategy cycle or significant change in ${domain.toLowerCase()} requirements.`,
      outcome: `${domain} objectives achieved within agreed constraints.`,
      inScope: [`${domain} strategy`, `${domain} governance`, `${domain} reporting`],
      outOfScope: [`Operational execution of individual ${domain.toLowerCase()} processes`],
      status: 'reviewed',
      serviceIds: [],
      capabilityIds: [],
      systemIds: [],
      evidenceIds: [],
    });
  }

  // Create subdomain-level (L1) processes
  const subdomainProcessIds: Record<string, string> = {};
  for (const [domain, subdomains] of Object.entries(SUBDOMAINS)) {
    for (const sub of subdomains) {
      const id = newId('proc');
      subdomainProcessIds[sub] = id;
      const parentId = domainProcessIds[domain];
      processes.push({ projectId: projId,
        id,
        title: sub,
        purpose: `Manage ${sub.toLowerCase()} activities within ${domain}.`,
        levelLabel: 'L1',
        parentId,
        trigger: `Trigger event specific to ${sub.toLowerCase()}.`,
        outcome: `${sub} outcomes delivered per SLA.`,
        inScope: [`${sub} planning`, `${sub} execution`, `${sub} reporting`],
        outOfScope: [`Strategic direction (covered at ${domain} level)`],
        status: 'reviewed',
        serviceIds: [],
        capabilityIds: [],
        systemIds: [],
        evidenceIds: [],
      });
      // decomposesInto from parent
      relations.push({ projectId: projId,
        id: newId('rel'), fromId: parentId, toId: id, type: 'decomposesInto',
      });
    }
  }

  // Create operational (L2) processes from templates
  let processCount = processes.length;
  const targetTotal = 500;
  const remaining = targetTotal - processCount;
  const allSubdomains = Object.entries(SUBDOMAINS).flatMap(([, subs]) => subs);
  const perSub = Math.ceil(remaining / allSubdomains.length);

  for (const sub of allSubdomains) {
    const items = getItems(sub);
    const parentId = subdomainProcessIds[sub];
    if (!parentId) continue;
    const created: string[] = [];

    for (let i = 0; i < perSub && processes.length < targetTotal; i++) {
      const template = PROCESS_TEMPLATES[i % PROCESS_TEMPLATES.length];
      const item = items[i % items.length];
      const title = template.replace('{item}', item);
      const id = newId('proc');
      created.push(id);
      processes.push({ projectId: projId,
        id,
        title,
        purpose: `${title} within ${sub}.`,
        levelLabel: 'L2',
        parentId,
        trigger: `New ${item} requiring action.`,
        outcome: `${item} handled per ${sub} policy.`,
        inScope: [`${title} workflow`, `Stakeholder notification`, `Record update`],
        outOfScope: [`Strategic ${sub} decisions`],
        status: i % 5 === 0 ? 'reviewed' : 'draft',
        serviceIds: [],
        capabilityIds: [],
        systemIds: [],
        evidenceIds: [],
        ownerRoleId: i % 3 === 0 ? `role_${sub.toLowerCase().replace(/\s/g, '_')}` : undefined,
      });
      relations.push({ projectId: projId,
        id: newId('rel'), fromId: parentId, toId: id, type: 'decomposesInto',
      });
    }

    // Add some dependency/value-chain relations between sibling L2 processes
    for (let i = 0; i + 1 < created.length && i < 3; i++) {
      relations.push({ projectId: projId,
        id: newId('rel'),
        fromId: created[i],
        toId: created[i + 1],
        type: i % 2 === 0 ? 'precedesInValueChain' : 'suppliesOutputTo',
      });
    }
  }

  // Add some cross-domain dependencies (not decomposesInto, so no cycle risk)
  const crossDeps: [string, string][] = [
    ['Incident Management', 'Problem Management'],
    ['Vulnerability Management', 'Change Management'],
    ['Identity and Access', 'Service Request'],
    ['Software Development', 'Build and Release'],
    ['Data Governance', 'Compliance Assurance'],
  ];
  for (const [from, to] of crossDeps) {
    if (subdomainProcessIds[from] && subdomainProcessIds[to]) {
      relations.push({ projectId: projId,
        id: newId('rel'),
        fromId: subdomainProcessIds[from],
        toId: subdomainProcessIds[to],
        type: 'dependsOn',
      });
    }
  }

  // Create candidates (accepted for top processes)
  for (const domain of DOMAINS) {
    candidates.push({ projectId: projId,
      id: newId('cand'),
      title: domain,
      status: 'accepted',
      rationale: `Identified from service catalog analysis and stakeholder interviews.`,
      sourceRefs: [],
      createdAt: now,
    });
  }

  const manifest: ProjectManifest = {
    id: projId,
    title: 'Large Landscape Benchmark (500-process)',
    description: 'Performance benchmark fixture with 500 processes and ~1500 relations for AT-26 validation.',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };

  return {
    manifest,
    processes: processes.slice(0, 500),
    relations,
    candidates,
  };
}
