import pkg from '../../package.json';
/* c8 ignore file */
export function mergeOpenApiDocs(a: any, b: any) {
  const servers = [
    { url: '/api' }, // tRPC
    { url: '/api/auth' }, // Better Auth
  ];
  const merged = {
    openapi: a.openapi || b.openapi || '3.0.3',
    info: {
      title: 'Corevia API',
      version: pkg.version,
      description: 'Schéma OpenAPI fusionné (tRPC + Better Auth).',
    },
    servers,
    tags: [...new Map([...(a.tags ?? []), ...(b.tags ?? [])].map((t) => [t.name, t])).values()],
    paths: { ...(a.paths ?? {}), ...(b.paths ?? {}) },
    components: {
      schemas: {
        ...(a.components?.schemas ?? {}),
        ...(b.components?.schemas ?? {}),
      },
      securitySchemes: {
        ...(a.components?.securitySchemes ?? {}),
        ...(b.components?.securitySchemes ?? {}),
      },
      parameters: {
        ...(a.components?.parameters ?? {}),
        ...(b.components?.parameters ?? {}),
      },
      requestBodies: {
        ...(a.components?.requestBodies ?? {}),
        ...(b.components?.requestBodies ?? {}),
      },
      responses: {
        ...(a.components?.responses ?? {}),
        ...(b.components?.responses ?? {}),
      },
      headers: {
        ...(a.components?.headers ?? {}),
        ...(b.components?.headers ?? {}),
      },
      examples: {
        ...(a.components?.examples ?? {}),
        ...(b.components?.examples ?? {}),
      },
      links: { ...(a.components?.links ?? {}), ...(b.components?.links ?? {}) },
      callbacks: {
        ...(a.components?.callbacks ?? {}),
        ...(b.components?.callbacks ?? {}),
      },
    },
    security: a.security ?? b.security ?? [],
    externalDocs: a.externalDocs ?? b.externalDocs,
  };

  const seen = new Set<string>();
  // eslint-disable-next-line ts/no-unused-vars
  for (const [p, methods] of Object.entries<any>(merged.paths)) {
    // eslint-disable-next-line ts/no-unused-vars
    for (const [m, op] of Object.entries<any>(methods)) {
      if (!op || typeof op !== 'object') continue;
      if (op.operationId) {
        let id = op.operationId as string;
        if (seen.has(id)) {
          op.operationId = `auth:${id}`;
        }
        seen.add(op.operationId);
      }
    }
  }

  return merged;
}
