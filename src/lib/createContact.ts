export type CreateContactPayload = {
  name: string;
  email: string;
  message?: string;
  source?: string;
  formName?: string;
  entryPath?: string;
  serviceInterest?: string;
  tags?: string[] | string;
};

export async function createContact(payload: CreateContactPayload) {
  const res = await fetch('/api/create-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Contact creation failed');
  }

  return res.json() as Promise<{
    ok: boolean;
    created: boolean;
    duplicate: boolean;
    contactId: string;
    leadSubmissionId: string | null;
    message?: string;
  }>;
}
