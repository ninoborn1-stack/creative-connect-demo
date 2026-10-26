// Wer darf eine Ausschreibung verwalten (Pitch-Board, Status, Zusage)? Autor:in, Mitglieder des Unternehmens, Admins.
export function canManageOpportunity(
  user: { id: string; isAdmin: boolean; companyId: string | null },
  opp: { authorId: string; companyId: string },
) {
  return user.isAdmin || opp.authorId === user.id || (Boolean(user.companyId) && user.companyId === opp.companyId);
}
