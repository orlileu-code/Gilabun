import type { CollectionReference, DocumentReference } from "firebase-admin/firestore";
import { getAdminFirestore } from "./admin";

export type Timestamp = { seconds: number; nanoseconds: number };

/** /users/{userId} */
export function userDoc(userId: string) {
  return getAdminFirestore().collection("users").doc(userId);
}

/** /users/{userId}/templates */
export function templatesCol(userId: string): CollectionReference {
  return userDoc(userId).collection("templates");
}

/** /users/{userId}/templates/{templateId} */
export function templateDoc(userId: string, templateId: string): DocumentReference {
  return templatesCol(userId).doc(templateId);
}

/** /users/{userId}/templates/{templateId}/tables */
export function templateTablesCol(userId: string, templateId: string): CollectionReference {
  return templateDoc(userId, templateId).collection("tables");
}

/** /users/{userId}/templates/{templateId}/labels */
export function templateLabelsCol(userId: string, templateId: string): CollectionReference {
  return templateDoc(userId, templateId).collection("labels");
}

/** /users/{userId}/templates/{templateId}/labels/{labelId} */
export function templateLabelDoc(
  userId: string,
  templateId: string,
  labelId: string
): DocumentReference {
  return templateLabelsCol(userId, templateId).doc(labelId);
}

/** /users/{userId}/workspaces */
export function workspacesCol(userId: string): CollectionReference {
  return userDoc(userId).collection("workspaces");
}

/** /users/{userId}/workspaces/{workspaceId} */
export function workspaceDoc(userId: string, workspaceId: string): DocumentReference {
  return workspacesCol(userId).doc(workspaceId);
}

/** /users/{userId}/workspaces/{workspaceId}/parties */
export function partiesCol(userId: string, workspaceId: string): CollectionReference {
  return workspaceDoc(userId, workspaceId).collection("parties");
}

/** /users/{userId}/workspaces/{workspaceId}/tableStates — doc id = String(tableNumber) */
export function tableStatesCol(userId: string, workspaceId: string): CollectionReference {
  return workspaceDoc(userId, workspaceId).collection("tableStates");
}

/** /users/{userId}/workspaces/{workspaceId}/tableStates/{tableNumber} */
export function tableStateDoc(
  userId: string,
  workspaceId: string,
  tableNumber: number
): DocumentReference {
  return tableStatesCol(userId, workspaceId).doc(String(tableNumber));
}

/** /users/{userId}/workspaces/{workspaceId}/combos */
export function workspaceCombosCol(userId: string, workspaceId: string): CollectionReference {
  return workspaceDoc(userId, workspaceId).collection("combos");
}

/** /users/{userId}/workspaces/{workspaceId}/combos/{comboId} */
export function workspaceComboDoc(
  userId: string,
  workspaceId: string,
  comboId: string
): DocumentReference {
  return workspaceCombosCol(userId, workspaceId).doc(comboId);
}

/** /users/{userId}/workspaces/{workspaceId}/seatings */
export function seatingsCol(userId: string, workspaceId: string): CollectionReference {
  return workspaceDoc(userId, workspaceId).collection("seatings");
}

/** Convert Firestore Timestamp to Date */
export function timestampToDate(
  t: { seconds: number; nanoseconds: number } | undefined | null
): Date | null {
  if (!t || typeof t.seconds !== "number") return null;
  return new Date(t.seconds * 1000 + (t.nanoseconds || 0) / 1e6);
}

/** Convert Date to Firestore Timestamp (for writes) */
export function dateToTimestamp(d: Date): { seconds: number; nanoseconds: number } {
  const ms = d.getTime();
  return { seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 };
}
