import { useState } from "react";
import { canManageRole, roles, type AccessControlConfig, type Role } from "../accessControl";

interface DirectoryUser {
  uid: string;
  name: string;
  wwid: string;
  email: string;
  role: Role;
}

const initialUsers: DirectoryUser[] = [
  { uid: "U-1001", name: "Priya Shah", wwid: "WW10234", email: "priya.shah@jnj.com", role: "user" },
  { uid: "U-1002", name: "Marcus Lee", wwid: "WW10456", email: "marcus.lee@jnj.com", role: "user" },
  { uid: "U-1003", name: "Elena Rossi", wwid: "WW10678", email: "elena.rossi@jnj.com", role: "admin" },
  { uid: "U-1004", name: "Debabrata Sen", wwid: "WW10789", email: "debabrata.sen@jnj.com", role: "support" },
  { uid: "U-1005", name: "Rakesh Kumar", wwid: "WW10891", email: "rakesh.kumar@jnj.com", role: "user" },
  { uid: "U-1006", name: "Sahil Dey", wwid: "WW10902", email: "sahil.dey@jnj.com", role: "superadmin" },
  { uid: "U-1007", name: "Abakash Nayak", wwid: "WW11023", email: "abakash.nayak@jnj.com", role: "user" },
  { uid: "U-1008", name: "Ravi Verma", wwid: "WW11134", email: "ravi.verma@jnj.com", role: "support" },
  { uid: "U-1009", name: "Nina Patel", wwid: "WW11245", email: "nina.patel@jnj.com", role: "user" },
  { uid: "U-1010", name: "Tom Becker", wwid: "WW11356", email: "tom.becker@jnj.com", role: "admin" },
  { uid: "U-1011", name: "Julia Wong", wwid: "WW11467", email: "julia.wong@jnj.com", role: "user" },
  { uid: "U-1012", name: "Carlos Diaz", wwid: "WW11578", email: "carlos.diaz@jnj.com", role: "support" },
  { uid: "U-1013", name: "Hana Kim", wwid: "WW11689", email: "hana.kim@jnj.com", role: "user" },
];

const roleBadgeStyle: Record<Role, string> = {
  support: "bg-slate-100 text-slate-700 border border-slate-200",

  user: "bg-blue-50 text-blue-700 border border-blue-200",

  admin: "bg-red-50 text-red-700 border border-red-200",

  superadmin: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const PAGE_SIZE = 10;

interface UserManagementPageProps {
  currentRole: Role;
  accessConfig: AccessControlConfig;
}

interface NewUserForm {
  uid: string;
  name: string;
  wwid: string;
  email: string;
  role: Role;
}

export function UserManagementPage({ currentRole, accessConfig }: Readonly<UserManagementPageProps>) {
  const manageableRoles = roles.filter((role) => canManageRole(accessConfig, currentRole, role));

  const [users, setUsers] = useState<DirectoryUser[]>(initialUsers);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modifyUids, setModifyUids] = useState<string[]>([]);
  const [originalRoles, setOriginalRoles] = useState<Record<string, Role>>({});
  const [pendingRoles, setPendingRoles] = useState<Record<string, Role>>({});
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<NewUserForm>({
    uid: "",
    name: "",
    wwid: "",
    email: "",
    role: manageableRoles[0] ?? "user",
  });
  const [addError, setAddError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedUsers = users.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const modifyTargets = users
    .filter((user) => modifyUids.includes(user.uid))
    .map((user) => ({ ...user, role: pendingRoles[user.uid] ?? user.role }));
  const pendingChanges = modifyUids
    .map((uid) => users.find((user) => user.uid === uid))
    .filter((user): user is DirectoryUser => Boolean(user))
    .filter((user) => pendingRoles[user.uid] && pendingRoles[user.uid] !== originalRoles[user.uid])
    .map((user) => ({ uid: user.uid, name: user.name, fromRole: originalRoles[user.uid], toRole: pendingRoles[user.uid] }));
  const deletableUids = selectedUids.filter((uid) => users.find((user) => user.uid === uid)?.role !== "superadmin");

  const toggleSelected = (uid: string) => {
    setSelectedUids((current) =>
      current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid],
    );
  };

  const openAddUser = () => {
    setModifyOpen(false);
    setModifyUids([]);
    setAddError(null);
    setAddForm({ uid: "", name: "", wwid: "", email: "", role: manageableRoles[0] ?? "user" });
    setAddOpen(true);
  };

  const submitAddUser = () => {
    const uid = addForm.uid.trim();
    const name = addForm.name.trim();
    const wwid = addForm.wwid.trim();
    const email = addForm.email.trim();

    if (!uid || !name || !wwid || !email) {
      setAddError("UID, UName, WWID and Email are all required.");
      return;
    }
    if (users.some((user) => user.uid === uid)) {
      setAddError("A user with this UID already exists.");
      return;
    }

    setUsers((current) => [{ uid, name, wwid, email, role: addForm.role }, ...current]);
    setAddOpen(false);
    setAddError(null);
    setCurrentPage(1);
  };

  const openModify = () => {
    setAddOpen(false);
    const snapshot: Record<string, Role> = {};
    selectedUids.forEach((uid) => {
      const user = users.find((current) => current.uid === uid);
      if (user) snapshot[uid] = user.role;
    });
    setOriginalRoles(snapshot);
    setPendingRoles(snapshot);
    setModifyUids([...selectedUids]);
    setModifyOpen(true);
  };

  const closeModify = () => {
    setModifyOpen(false);
    setModifyUids([]);
    setOriginalRoles({});
    setPendingRoles({});
    setSelectedUids([]);
  };

  const updatePendingRole = (uid: string, role: Role) => {
    setPendingRoles((current) => ({ ...current, [uid]: role }));
  };

  const handleDoneClick = () => {
    if (pendingChanges.length === 0) {
      closeModify();
      return;
    }
    setRoleConfirmOpen(true);
  };

  const confirmRoleChanges = () => {
    setUsers((current) =>
      current.map((user) =>
        pendingRoles[user.uid] && pendingRoles[user.uid] !== user.role
          ? { ...user, role: pendingRoles[user.uid] }
          : user,
      ),
    );
    setRoleConfirmOpen(false);
    closeModify();
  };

  const cancelRoleChanges = () => {
    setRoleConfirmOpen(false);
    closeModify();
  };

  const requestDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    setUsers((current) => current.filter((user) => !deletableUids.includes(user.uid)));
    setDeleteConfirmOpen(false);
    closeModify();
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
  };

  const actionsDisabled = selectedUids.length === 0;

  return (
    <div className="px-6 py-5 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">🧑‍💼 User Management</h2>
        <p className="text-gray-500 text-sm mb-6 text-center">Manage directory users and their access levels</p>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            type="button"
            onClick={openAddUser}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800 transition-colors"
          >
            Add User
          </button>
          <button
            type="button"
            onClick={openModify}
            disabled={actionsDisabled}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            Modify
          </button>
          <button
            type="button"
            onClick={requestDelete}
            disabled={actionsDisabled}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            Delete
          </button>
        </div>

        {addOpen && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Add User</h3>
            <p className="text-sm text-gray-500 mb-4">Create a new directory entry and assign an initial role.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="new-uid">UID</label>
                <input
                  id="new-uid"
                  type="text"
                  value={addForm.uid}
                  onChange={(event) => setAddForm((current) => ({ ...current, uid: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="new-name">UserName</label>
                <input
                  id="new-name"
                  type="text"
                  value={addForm.name}
                  onChange={(event) => setAddForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="new-wwid">WWID</label>
                <input
                  id="new-wwid"
                  type="text"
                  value={addForm.wwid}
                  onChange={(event) => setAddForm((current) => ({ ...current, wwid: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="new-email">Email</label>
                <input
                  id="new-email"
                  type="email"
                  value={addForm.email}
                  onChange={(event) => setAddForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="new-role">Access Granted</label>
                <select
                  id="new-role"
                  value={addForm.role}
                  onChange={(event) => setAddForm((current) => ({ ...current, role: event.target.value as Role }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {manageableRoles.map((role) => (
                    <option key={role} value={role}>{accessConfig[role].label}</option>
                  ))}
                </select>
              </div>
            </div>
            {addError && <p className="text-xs font-medium text-rose-600 mt-3">{addError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAddUser}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800 transition-colors"
              >
                Save User
              </button>
            </div>
          </div>
        )}

        {modifyOpen && modifyTargets.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Modify Access</h3>
            <p className="text-sm text-gray-500 mb-4">
              {modifyTargets.length > 1
                ? `Update the role for ${modifyTargets.length} selected users.`
                : "Update the role for the selected user."}
            </p>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {modifyTargets.map((target) => {
                const canManageUser = canManageRole(accessConfig, currentRole, target.role);
                const availableRoles = canManageUser ? manageableRoles : [target.role];
                return (
                  <div key={target.uid} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{target.name}</p>
                      <p className="text-xs text-gray-500">{accessConfig[target.role].description}</p>
                      {!canManageUser && (
                        <p className="text-xs font-medium text-amber-600 mt-1">Only Super Admin can modify this user's access.</p>
                      )}
                    </div>
                    <select
                      aria-label={`Role for ${target.name}`}
                      value={target.role}
                      disabled={!canManageUser}
                      onChange={(event) => updatePendingRole(target.uid, event.target.value as Role)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>{accessConfig[role].label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleDoneClick}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {roleConfirmOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Confirm Role Changes</h3>
              <p className="text-sm text-gray-500 mb-4">Review the access changes below before applying them.</p>
              <ul className="space-y-2 mb-2 max-h-64 overflow-y-auto">
                {pendingChanges.map((change) => (
                  <li key={change.uid} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{change.name}</span> ({change.uid}): change{" "}
                    <span className="font-semibold">{accessConfig[change.fromRole].label}</span> to{" "}
                    <span className="font-semibold">{accessConfig[change.toRole].label}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelRoleChanges}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRoleChanges}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Confirm Delete</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {deletableUids.length === 1 ? "this UID" : `these ${deletableUids.length} UIDs`}?
              </p>
              <ul className="space-y-1 mb-2 max-h-64 overflow-y-auto text-sm text-gray-700">
                {selectedUids.map((uid) => {
                  const user = users.find((current) => current.uid === uid);
                  const isProtected = user?.role === "superadmin";
                  return (
                    <li key={uid} className={isProtected ? "text-gray-400" : undefined}>
                      • {uid}{user ? ` — ${user.name}` : ""}
                      {isProtected && " (Super Admin — cannot be deleted)"}
                    </li>
                  );
                })}
              </ul>
              {deletableUids.length < selectedUids.length && (
                <p className="text-xs font-medium text-amber-600 mb-2">Super Admin users are protected and will be skipped.</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletableUids.length === 0}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 w-10" />
                  <th className="border border-gray-200 px-4 py-3">UID</th>
                  <th className="border border-gray-200 px-4 py-3">UserName</th>
                  <th className="border border-gray-200 px-4 py-3">WWID</th>
                  <th className="border border-gray-200 px-4 py-3">Email</th>
                  <th className="border border-gray-200 px-4 py-3">Access Granted</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-200 px-4 py-8 text-center text-gray-400">No users found</td>
                  </tr>
                ) : (
                  pagedUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="border border-gray-200 px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${user.name}`}
                          checked={selectedUids.includes(user.uid)}
                          onChange={() => toggleSelected(user.uid)}
                          className="h-4 w-4 rounded text-slate-700"
                        />
                      </td>
                      <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-900">{user.uid}</td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-700">{user.name}</td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-700">{user.wwid}</td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-700">{user.email}</td>
                      <td className="border border-gray-200 px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadgeStyle[user.role]}`}>
                          {accessConfig[user.role].label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, users.length)} of {users.length} users
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-gray-500">Page {safePage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
