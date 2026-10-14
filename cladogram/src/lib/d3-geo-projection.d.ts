// d3-geo-projection ships no types (and there is no @types package for v4); declare the one
// projection the site uses.
declare module "d3-geo-projection" {
  import type { GeoProjection } from "d3";
  export function geoArmadillo(): GeoProjection & { parallel(): number; parallel(p: number): GeoProjection };
}
