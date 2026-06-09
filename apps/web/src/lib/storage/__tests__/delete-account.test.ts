import { canConfirmDeletion, DELETE_CONFIRM_PHRASE } from '../delete-account';

describe('canConfirmDeletion', () => {
  it('accepts the exact phrase', () => {
    expect(canConfirmDeletion(DELETE_CONFIRM_PHRASE)).toBe(true);
  });

  it('is case-insensitive and trims surrounding whitespace', () => {
    expect(canConfirmDeletion('delete')).toBe(true);
    expect(canConfirmDeletion('  Delete  ')).toBe(true);
    expect(canConfirmDeletion('DELETE\n')).toBe(true);
  });

  it('rejects partial, empty, or wrong input', () => {
    expect(canConfirmDeletion('')).toBe(false);
    expect(canConfirmDeletion('delet')).toBe(false);
    expect(canConfirmDeletion('delete my account')).toBe(false);
    expect(canConfirmDeletion('yes')).toBe(false);
  });
});
