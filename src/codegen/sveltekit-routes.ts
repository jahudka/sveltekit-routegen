import type { CodegenJob, File } from 'pluggable-codegen';
import template from './template.ts?raw';

export type SveltekitRoutesOptions = {
  matchersDir?: string;
  routesDir?: string;
};

export function sveltekitRoutes(
  file: string,
  paramTypes?: Record<string, string>,
  { matchersDir = 'src/params', routesDir = 'src/routes' }: SveltekitRoutesOptions = {},
): CodegenJob {
  return {
    input: [`${matchersDir}/*.ts`, `${routesDir}/**/+{page.svelte,server.ts}`],
    output: file,
    generate: (files) => generateRoutes(files, paramTypes),
    cacheBy: 'files',
  };
}

async function generateRoutes(
  files: File[],
  paramTypes: Record<string, string> = {},
): Promise<string> {
  const paramMatchers = new Map(Object.entries(paramTypes));
  const routeIds = extractAndCheckMatchers(files, paramMatchers);
  const routes: string[] = [];

  for (const routeId of routeIds) {
    const [paramNames, paramTypes, paramValues] = parseParams(routeId, paramMatchers);

    if (!paramNames.length) {
      routes.push(`'${routeId}': (query: Params = {}) => generate('${routeId}', {}, query),`);
      continue;
    }

    const arg = `{ ${paramNames.concat('...query').join(', ')} }`;
    const value = `{ ${paramValues.join(', ')} }`;

    routes.push(
      `'${routeId}': (${arg}: Params & { ${paramTypes.join(', ')} }) => generate('${routeId}', ${value}, query),`,
    );
  }

  routes.sort();

  return template.replace(
    /\/\*MARKER\*\/[\s\S]*?\/\*\/MARKER\*\//,
    routes.join('\n').replace(/^/gm, '  '),
  );
}

function extractAndCheckMatchers(files: File[], paramMatchers: Map<string, string>): Set<string> {
  return new Set(
    files
      .filter((file) => {
        if (file.localPath.startsWith('src/routes/')) {
          return true;
        }

        const basename = file.localPath.replace(/^.+\/|\.ts$/gi, '');

        if (!paramMatchers.has(basename)) {
          console.log(`Warning: unregistered param matcher '${file}'`);
          paramMatchers.set(basename, 'string');
        }

        return false;
      })
      .map((file) => file.localPath.replace(/^src\/routes|\/[^/]+$/g, '')),
  );
}

const paramPattern = /\[\[?(?:\.\.\.)?([^\]=]+)(?:=([^\]]+))?](]?)/g;

function parseParams(
  routeId: string,
  paramMatchers: Map<string, string>,
): [names: string[], types: string[], values: string[]] {
  const knownParams: Set<string> = new Set();
  const paramTypes: string[] = [];
  const paramValues: string[] = [];

  for (const [, param, matcher, brace] of routeId.matchAll(paramPattern)) {
    if (knownParams.has(param)) {
      console.log(`Warning: duplicate parameter '${param}' in route '${routeId}'`);
      continue;
    }

    knownParams.add(param);

    if (matcher && !paramMatchers.has(matcher)) {
      console.log(
        `Warning: unknown param matcher '${matcher}' for param '${param}' in route '${routeId}'`,
      );

      paramMatchers.set(matcher, 'string');
    }

    const type = matcher ? paramMatchers.get(matcher) : 'string';
    const optional = brace === ']' ? '?' : '';
    paramTypes.push(`${param}${optional}: ${type}`);

    if (type !== 'string') {
      paramValues.push(`${param}: ${param}${optional}.toString()`);
    } else {
      paramValues.push(param);
    }
  }

  return [[...knownParams], paramTypes, paramValues];
}
