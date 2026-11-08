import { buildIT01Scenario } from './it01SaasOnboarding';
import { buildIT02Scenario } from './it02ServiceDesk';
import { buildIT03Scenario } from './it03CloudResources';
import { buildIT04Scenario } from './it04EmployeeAccess';
import { buildIT05Scenario } from './it05MajorIncident';
import { buildIT06Scenario } from './it06SoftwareRelease';
import { buildIT07Scenario } from './it07ApiIntegration';
import { buildIT08Scenario } from './it08SaasRenewal';
import { buildIT09Scenario } from './it09ITProcurement';
import { buildIT10Scenario } from './it10CloudMigration';
import { buildIT11Scenario } from './it11ManagedServiceOnboarding';
import type { ScenarioBundle } from './it01SaasOnboarding';

export type ScenarioLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Capstone';

export interface ScenarioPack {
  id: string;
  label: string;
  level: ScenarioLevel;
  summary: string;
  build: () => ScenarioBundle;
}

export const SCENARIO_REGISTRY: ScenarioPack[] = [
  {
    id: 'IT-01', label: 'SaaS customer onboarding', level: 'Beginner',
    summary: 'A new enterprise customer signs up for a SaaS platform. Follow the journey from discovery through provisioning, IdP configuration, and first use.',
    build: buildIT01Scenario,
  },
  {
    id: 'IT-02', label: 'Employee hardware incident', level: 'Beginner',
    summary: 'An employee\'s laptop fails. Trace the journey from the first help desk call through hardware replacement, data recovery, and return to productivity.',
    build: buildIT02Scenario,
  },
  {
    id: 'IT-03', label: 'Developer cloud resource request', level: 'Intermediate',
    summary: 'A developer needs cloud resources for a new project. Navigate approval workflows, cost centre assignments, and infrastructure provisioning.',
    build: buildIT03Scenario,
  },
  {
    id: 'IT-04', label: 'New employee access request', level: 'Intermediate',
    summary: 'A new hire needs access to a dozen systems on day one. Map the identity provisioning process and its many cross-team handoffs.',
    build: buildIT04Scenario,
  },
  {
    id: 'IT-05', label: 'Enterprise major incident', level: 'Intermediate',
    summary: 'A P1 outage hits a critical service. Work through detection, escalation, war-room coordination, resolution, and post-incident review.',
    build: buildIT05Scenario,
  },
  {
    id: 'IT-06', label: 'Product team software release', level: 'Advanced',
    summary: 'A product team ships a major feature. Capture the end-to-end release process from feature freeze through deployment, monitoring, and rollback readiness.',
    build: buildIT06Scenario,
  },
  {
    id: 'IT-07', label: 'Developer API integration', level: 'Advanced',
    summary: 'A partner needs to integrate with a corporate API. Map the developer journey through authentication, testing, go-live approval, and ongoing rate-limit governance.',
    build: buildIT07Scenario,
  },
  {
    id: 'IT-08', label: 'SaaS renewal and cancellation', level: 'Intermediate',
    summary: 'A key SaaS contract is up for renewal. Trace the procurement review, negotiation, and the alternative path where the customer cancels and migrates.',
    build: buildIT08Scenario,
  },
  {
    id: 'IT-09', label: 'IT service procurement', level: 'Advanced',
    summary: 'The IT department needs to procure a new monitoring tool. Follow RFP, vendor evaluation, security review, legal sign-off, and onboarding.',
    build: buildIT09Scenario,
  },
  {
    id: 'IT-10', label: 'Cloud migration', level: 'Advanced',
    summary: 'A legacy on-prem workload is migrated to the cloud. Map the discovery, design, testing, and cutover stages with their rollback paths.',
    build: buildIT10Scenario,
  },
  {
    id: 'IT-11', label: 'Managed service onboarding (capstone)', level: 'Capstone',
    summary: 'A new managed service customer is onboarded end-to-end: legal, project setup, discovery workshop, infrastructure delivery, training, and go-live sign-off.',
    build: buildIT11Scenario,
  },
];

const bundleCache = new Map<string, ScenarioBundle>();

export function getCachedBundle(id: string): ScenarioBundle | undefined {
  return bundleCache.get(id);
}

export function buildAndCacheBundle(id: string): ScenarioBundle | undefined {
  const pack = SCENARIO_REGISTRY.find(p => p.id === id);
  if (!pack) return undefined;
  const cached = bundleCache.get(id);
  if (cached) return cached;
  const bundle = pack.build();
  bundleCache.set(id, bundle);
  return bundle;
}
