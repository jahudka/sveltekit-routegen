import {
  AbstractLink,
  generate,
  type GoToOptions,
  type GoToResult,
  matchesCurrent,
  type Params,
  type RouteFnParamsOf,
  type RouteIdOf,
  type RouteMapDefinition,
  type RouteParamsOf,
  type RoutePrefixOf,
  type RoutePropsOf,
} from 'sveltekit-routegen';
import { goto as svelteGoTo } from '$app/navigation';

const routes = {
  /*MARKER*/
  '/dummy': (params: Params = {}) => generate('/dummy', {}, params),
  /*/MARKER*/
} as const satisfies RouteMapDefinition;

export type RouteMap = typeof routes;
export type RouteId = RouteIdOf<RouteMap>;
export type RoutePrefix = RoutePrefixOf<RouteMap>;
export type RouteParams<Route extends RouteId> = RouteParamsOf<RouteMap, Route>;
export type RouteFnParams<Route extends RouteId> = RouteFnParamsOf<RouteMap, Route>;
export type RouteProps<Route extends RouteId> = RoutePropsOf<RouteMap, Route>;

export class Link<Route extends RouteId> extends AbstractLink<RouteMap, Route> {
  constructor(route: Route, params: RouteParams<Route>) {
    super(routes, route, params);
  }
}

export function link<Route extends RouteId>(...params: [...RouteFnParams<Route>]): Link<Route>;
export function link(route: RouteId, params: any = {}): Link<any> {
  return new Link(route, params);
}

export function path<Route extends RouteId>(...params: [...RouteFnParams<Route>]): string;
export function path(route: RouteId, params: any = {}): string {
  return routes[route](params);
}

export function goto<Route extends RouteId>(
  ...params: [...RouteFnParams<Route>, options?: GoToOptions]
): Promise<GoToResult>;
export async function goto(
  route: RouteId,
  params: any = {},
  options?: GoToOptions,
): Promise<GoToResult> {
  return svelteGoTo(path(route, params), options);
}

export function isCurrentRoute(route: RouteId | RoutePrefix): boolean {
  return matchesCurrent(route);
}
