/**
 * Meterless World Model (minimal headless mount).
 * Shared grounded state for the run: entities + provenance append log.
 * Spec: HackOS Meterless WORLD MODEL Agent Engine — store + context builder only.
 */

export type WorldEntity = {
  id: string;
  type: string;
  name: string;
  properties: Record<string, unknown>;
  agentId: string;
  runId: string;
  confidence: number;
};

export type WorldObservation = {
  id: string;
  at: string;
  agentId: string;
  runId: string;
  kind: string;
  summary: string;
  entityIds: string[];
  raw?: unknown;
};

export type WorldModel = {
  id: string;
  runId: string;
  entities: Map<string, WorldEntity>;
  observations: WorldObservation[];
};

function stableId(type: string, name: string): string {
  const key = `${type}:${name.toLowerCase().trim()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `ent_${h.toString(16)}`;
}

export function createWorld(runId: string): WorldModel {
  return { id: `world_${runId}`, runId, entities: new Map(), observations: [] };
}

export function upsertEntity(
  world: WorldModel,
  input: {
    type: string;
    name: string;
    properties?: Record<string, unknown>;
    agentId: string;
    confidence?: number;
  }
): WorldEntity {
  const id = stableId(input.type, input.name);
  const existing = world.entities.get(id);
  const entity: WorldEntity = {
    id,
    type: input.type,
    name: input.name,
    properties: { ...(existing?.properties ?? {}), ...(input.properties ?? {}) },
    agentId: input.agentId,
    runId: world.runId,
    confidence: input.confidence ?? existing?.confidence ?? 0.8,
  };
  world.entities.set(id, entity);
  return entity;
}

export function observe(
  world: WorldModel,
  input: {
    agentId: string;
    kind: string;
    summary: string;
    entityIds?: string[];
    raw?: unknown;
  }
): WorldObservation {
  const obs: WorldObservation = {
    id: `obs_${world.observations.length + 1}`,
    at: new Date().toISOString(),
    agentId: input.agentId,
    runId: world.runId,
    kind: input.kind,
    summary: input.summary,
    entityIds: input.entityIds ?? [],
    raw: input.raw,
  };
  world.observations.push(obs);
  return obs;
}

/** Context builder — structured payload for downstream agents / judges. */
export function buildWorldContext(world: WorldModel): {
  runId: string;
  entities: WorldEntity[];
  recentObservations: WorldObservation[];
  selectionReason: string;
} {
  return {
    runId: world.runId,
    entities: [...world.entities.values()],
    recentObservations: world.observations.slice(-12),
    selectionReason: "all_entities_plus_recent_observations",
  };
}

export function serializeWorld(world: WorldModel) {
  return {
    id: world.id,
    runId: world.runId,
    entities: [...world.entities.values()],
    observations: world.observations,
  };
}
