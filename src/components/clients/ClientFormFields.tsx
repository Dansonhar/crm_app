import type { ClientStatus } from '@/types';

// Shared field set for both "Add Client" (Clients page) and "Edit Client
// Profile" (Client detail page) so the two forms always capture the same details.
export interface ClientFormValues {
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  website: string;
  address: string;
  status: ClientStatus;
  telegramChatId: string;
  telegramUsername: string;
}

export const emptyClientForm: ClientFormValues = {
  name: '',
  company: '',
  email: '',
  phone: '',
  industry: '',
  website: '',
  address: '',
  status: 'lead',
  telegramChatId: '',
  telegramUsername: '',
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200';

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{children}</label>;
}

export function ClientFormFields({
  values,
  onChange,
  showStatus = true,
}: {
  values: ClientFormValues;
  onChange: (values: ClientFormValues) => void;
  // Hidden on the "Add Client" form — status is set inline on the clients list.
  showStatus?: boolean;
}) {
  const set = (patch: Partial<ClientFormValues>) => onChange({ ...values, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Full Name</FieldLabel>
          <input
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
            className={inputClass}
            placeholder="Jane Cooper"
          />
        </div>
        <div>
          <FieldLabel>Company</FieldLabel>
          <input
            value={values.company}
            onChange={(e) => set({ company: e.target.value })}
            className={inputClass}
            placeholder="Acme Co."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Email</FieldLabel>
          <input
            value={values.email}
            onChange={(e) => set({ email: e.target.value })}
            className={inputClass}
            placeholder="jane@acme.com"
          />
        </div>
        <div>
          <FieldLabel>Phone</FieldLabel>
          <input
            value={values.phone}
            onChange={(e) => set({ phone: e.target.value })}
            className={inputClass}
            placeholder="(555) 000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Industry</FieldLabel>
          <input
            value={values.industry}
            onChange={(e) => set({ industry: e.target.value })}
            className={inputClass}
            placeholder="Retail"
          />
        </div>
        {showStatus && (
          <div>
            <FieldLabel>Status</FieldLabel>
            <select
              value={values.status}
              onChange={(e) => set({ status: e.target.value as ClientStatus })}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Website</FieldLabel>
        <input
          value={values.website}
          onChange={(e) => set({ website: e.target.value })}
          className={inputClass}
          placeholder="acme.com"
        />
      </div>

      <div>
        <FieldLabel>Address</FieldLabel>
        <input
          value={values.address}
          onChange={(e) => set({ address: e.target.value })}
          className={inputClass}
          placeholder="123 Main St, City"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Telegram Chat ID</FieldLabel>
          <input
            value={values.telegramChatId}
            onChange={(e) => set({ telegramChatId: e.target.value })}
            placeholder="e.g. 123456789"
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel>Telegram Username</FieldLabel>
          <input
            value={values.telegramUsername}
            onChange={(e) => set({ telegramUsername: e.target.value })}
            placeholder="optional, for display only"
            className={inputClass}
          />
        </div>
      </div>

      <p className="-mt-2 text-xs text-slate-400">
        The client must message the bot at least once before you can message them. Run the server and check
        <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 dark:bg-white/10">GET /api/telegram/updates</code>
        to find their Chat ID.
      </p>
    </div>
  );
}
