import { OLMAZOR_MAHALLAS } from './olmazorMahallas';
import { OLMAZOR_BOUNDARY, OLMAZOR_BOUNDS } from './olmazorBoundary';
import { YASHNOBOD_MAHALLAS, YASHNOBOD_BOUNDARY, YASHNOBOD_BOUNDS } from './yashnobodMahallas';

export function getDistrictMahallas(districtId = 'olmazor') {
  if (districtId === 'yashnobod') {
    return YASHNOBOD_MAHALLAS;
  }
  return OLMAZOR_MAHALLAS;
}

export function getDistrictBoundary(districtId = 'olmazor') {
  if (districtId === 'yashnobod') {
    return YASHNOBOD_BOUNDARY;
  }
  return OLMAZOR_BOUNDARY;
}

export function getDistrictBounds(districtId = 'olmazor') {
  if (districtId === 'yashnobod') {
    return YASHNOBOD_BOUNDS;
  }
  return OLMAZOR_BOUNDS;
}
