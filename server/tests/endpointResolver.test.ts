import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSearchEndpoint } from '../src/etg/endpointResolver.js';

test('uses serp/region as primary search endpoint', () => {
  const resolved = resolveSearchEndpoint({});
  assert.equal(resolved.mode, 'serp_region');
  assert.equal(resolved.endpoint, '/api/b2b/v3/search/serp/region/');
});

test('uses serp/hotels when explicit hotel ids exist', () => {
  const resolved = resolveSearchEndpoint({ hotelIds: ['123', '456'] });
  assert.equal(resolved.mode, 'serp_hotels');
  assert.equal(resolved.endpoint, '/api/b2b/v3/search/serp/hotels/');
});

test('uses geo fallback when region has no results and coordinates are available', () => {
  const resolved = resolveSearchEndpoint({ regionResultCount: 0, hasCoordinates: true });
  assert.equal(resolved.mode, 'serp_geo');
  assert.equal(resolved.endpoint, '/api/b2b/v3/search/serp/geo/');
});
