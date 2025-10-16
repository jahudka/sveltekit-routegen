import type { goto as svelteGoTo } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';

/* Base type defs */
export type Params = Record<string, string>;
export type GenerateUrlFn<P extends Params = Params> = (params: P) => string;
export type RouteMapDefinition = Record<string, GenerateUrlFn<any>>;

/* Generic types for routes */
export type RouteIdOf<Map extends RouteMapDefinition> = string & keyof Map;
export type RouteParamsOf<Map extends RouteMapDefinition, Route extends RouteIdOf<Map>> =
  Map[Route] extends GenerateUrlFn<infer Params> ? Params : never;

type ParamsTupleOf<Map extends RouteMapDefinition, Route extends RouteIdOf<Map>> =
  Params extends RouteParamsOf<Map, Route>
    ? [params?: Params]
    : [params: RouteParamsOf<Map, Route>];

export type RouteFnParamsOf<Map extends RouteMapDefinition, Route extends RouteIdOf<Map>> = [
  route: Route,
  ...ParamsTupleOf<Map, Route>,
];

type ParamsPropOf<Map extends RouteMapDefinition, Route extends RouteIdOf<Map>> =
  Params extends RouteParamsOf<Map, Route>
    ? { params?: Params }
    : { params: RouteParamsOf<Map, Route> };
export type RoutePropsOf<Map extends RouteMapDefinition, Route extends RouteIdOf<Map>> = {
  route: Route;
} & ParamsPropOf<Map, Route>;

/* Route prefix checking */
type StripLeadingSlash<S extends string> = S extends `/${infer R}` ? R : never;
type GetRoutePrefix<Route extends string> = Route extends `${infer Root}/${infer Path}`
  ? `/${Root}${GetRoutePrefix<Path>}`
  : '/*';
export type RoutePrefixOf<Map extends RouteMapDefinition> = Exclude<
  GetRoutePrefix<StripLeadingSlash<RouteIdOf<Map>>>,
  '/*'
>;

/* Redirect types */
type GoTo = typeof svelteGoTo;
export type GoToOptions = Parameters<GoTo> extends [url: any, options?: infer O] ? O : never;
export type GoToResult = ReturnType<GoTo> extends Promise<infer T> ? T : ReturnType<GoTo>;

/* Link */
export abstract class AbstractLink<Map extends RouteMapDefinition, Route extends RouteIdOf<Map>> {
  private url?: string;

  protected constructor(
    private readonly map: Map,
    readonly route: Route,
    readonly params: RouteParamsOf<Map, Route>,
  ) {}

  toString(): string {
    return (this.url ??= this.map[this.route](this.params));
  }
}

/* Internal helpers */
export function generate(route: string, params: Params, query: Params): string {
  const path = (resolve as any)(route, params) as string;
  const search = new URLSearchParams(query);
  return `${path}${search?.size ? `?${search}` : ''}`;
}

export function matchesCurrent(route: string): boolean {
  if (page.route.id === null) {
    return false;
  }

  if (route.endsWith('/*')) {
    return page.route.id === route.slice(0, -2) || page.route.id.startsWith(route.slice(0, -1));
  }

  return page.route.id === route;
}
