type ActionSuccess<T> = { success: true; data: T };
type ActionFailure = { error: string };

export function isActionSuccess<T>(
  result: ActionSuccess<T> | ActionFailure,
): result is ActionSuccess<T> {
  return "success" in result && result.success === true;
}

export function unwrapAction<T>(result: ActionSuccess<T> | ActionFailure): T {
  if (!isActionSuccess(result)) {
    throw new Error(result.error);
  }
  return result.data;
}