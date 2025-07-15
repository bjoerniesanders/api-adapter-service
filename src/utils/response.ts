import { AdapterResponse } from '../types';

export function createSuccessResponse(
  adapterName: string,
  data: unknown,
  statusCode: number,
): AdapterResponse {
  return {
    success: true,
    data,
    statusCode,
    adapterName,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  adapterName: string,
  error: string,
  statusCode: number,
): AdapterResponse {
  return {
    success: false,
    error,
    statusCode,
    adapterName,
    timestamp: new Date().toISOString(),
  };
}

export function createNotFoundResponse(adapterName: string): AdapterResponse {
  return createErrorResponse(adapterName, `Adapter '${adapterName}' not found`, 404);
}
