import { adminCard, adminFilters, adminFiltersCompact, adminForm, adminFormFields, adminFormSpan, adminPage, adminTable, appToastClass, formActions, matrix, matrixActions, matrixGroup, matrixModal, modalBackdrop, modalClose, modalHeader, modalPanel, modalPanelWide, muted, rowActions, tableWrap } from '../../styles/admin'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext, useLocation } from 'react-router-dom'
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useLazyListPermissionsQuery,
  useLazyListRolesQuery,
  useSetRolePermissionsMutation,
  useUpdateRoleMutation,
  useUpdateRoleStatusMutation,
} from '@/redux/features/roles/rolesApi'
import { getApiError } from '@/utils/apiError'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Cancel01Icon,
  Delete02Icon,
  Key01Icon,
  PencilEdit02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { Spin, Switch } from 'antd'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import PageHeader from '../../components/PageHeader'
import PageMeta from '../../components/PageMeta'
import RowActionMenu, { type RowActionItem } from '../../components/RowActionMenu'
import { hasPermission } from '../../lib/access'
import { readUrlSearchQuery } from '../../lib/url-search'
import type { AuthSession, PermissionRecord, RecordStatus, RoleRecord } from '../../types'
type FormMode = 'create' | 'view' | 'edit'
type ToastState = { text: string; type: 'success' | 'error' }

function ActionIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.5} />
}

type RoleForm = {
  name: string
  description: string
  status: RecordStatus
}

const EMPTY_FORM: RoleForm = { name: '', description: '', status: 'ACTIVE' }

function formFromRole(role: RoleRecord): RoleForm {
  return {
    name: role.name || '',
    description: role.description || '',
    status: role.status || 'ACTIVE',
  }
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export default function RolesPage() {
  const auth = useOutletContext<AuthSession>()
  const location = useLocation()
  const canCreate = hasPermission(auth, 'role:create')
  const canEdit = hasPermission(auth, 'role:edit')
  const canDelete = hasPermission(auth, 'role:delete')
  const canConfigure = hasPermission(auth, 'permission:configure')

  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [permissions, setPermissions] = useState<PermissionRecord[]>([])
  const [search, setSearch] = useState(() => readUrlSearchQuery(location.search))
  const [permissionSearch, setPermissionSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [permissionOpen, setPermissionOpen] = useState(false)
  const [selected, setSelected] = useState<RoleRecord | null>(null)
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM)
  const [checked, setChecked] = useState<string[]>([])
  const [toast, setToast] = useState<ToastState | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncedSearch = useRef(false)
  const formLocked = formMode === 'view'

  const [listRoles] = useLazyListRolesQuery()
  const [listPermissions] = useLazyListPermissionsQuery()
  const [createRole] = useCreateRoleMutation()
  const [updateRole] = useUpdateRoleMutation()
  const [updateRoleStatus] = useUpdateRoleStatusMutation()
  const [deleteRole] = useDeleteRoleMutation()
  const [setRolePermissions] = useSetRolePermissionsMutation()

  const grouped = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase()
    const map = new Map<string, PermissionRecord[]>()
    for (const permission of permissions) {
      if (query && !`${permission.module} ${permission.key} ${permission.description}`.toLowerCase().includes(query)) {
        continue
      }
      const list = map.get(permission.module) || []
      list.push(permission)
      map.set(permission.module, list)
    }
    return [...map.entries()]
  }, [permissions, permissionSearch])

  function showToast(text: string, type: ToastState['type'] = 'success') {
    setToast({ text, type })
    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  async function load(options?: { silent?: boolean; search?: string }) {
    if (!options?.silent) {
      setLoading(true)
    }
    try {
      const data = await listRoles({ search: options?.search ?? search, status }).unwrap()
      setRoles(data.roles)
    } catch (err) {
      showToast(getApiError(err, 'Unable to load roles.'), 'error')
    }
    if (!options?.silent) {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [status])

  useEffect(() => {
    const next = readUrlSearchQuery(location.search)
    setSearch(next)
    if (syncedSearch.current) {
      void load({ search: next })
    }
    syncedSearch.current = true
  }, [location.search])

  useEffect(() => {
    void listPermissions()
      .unwrap()
      .then((data) => setPermissions(data.permissions))
      .catch(() => undefined)
  }, [listPermissions])

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }
    },
    [],
  )

  function openCreate() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setFormMode('create')
    setFormOpen(true)
  }

  function openRole(role: RoleRecord, mode: FormMode) {
    setSelected(role)
    setForm(formFromRole(role))
    setFormMode(mode)
    setFormOpen(true)
  }

  function openPermissions(role: RoleRecord) {
    setSelected(role)
    setChecked(role.permissionIds || [])
    setPermissionSearch('')
    setPermissionOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
  }

  function closePermissions() {
    setPermissionOpen(false)
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      if (selected) {
        await updateRole({ id: selected.id, body: form }).unwrap()
      } else {
        await createRole(form).unwrap()
      }
      showToast(selected ? 'Role updated.' : 'Role created.')
      setFormOpen(false)
      await load()
    } catch (err) {
      showToast(getApiError(err, 'Unable to save role.'), 'error')
    }
  }

  async function removeRole(role: RoleRecord) {
    try {
      await deleteRole(role.id).unwrap()
      showToast('Role deleted.')
      if (selected?.id === role.id) {
        setSelected(null)
        setFormOpen(false)
        setPermissionOpen(false)
      }
      await load()
    } catch (err) {
      showToast(getApiError(err, 'This role is currently assigned to users.'), 'error')
    }
  }

  async function setRoleActive(role: RoleRecord, next: RecordStatus) {
    if (statusUpdatingId) {
      return
    }
    setStatusUpdatingId(role.id)
    try {
      await updateRoleStatus({ id: role.id, status: next }).unwrap()
      showToast(`Role successfully ${next === 'ACTIVE' ? 'activated' : 'deactivated'}.`)
      await load({ silent: true })
    } catch (err) {
      showToast(getApiError(err, 'Unable to update status.'), 'error')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  async function savePermissions() {
    if (!selected) {
      return
    }
    try {
      await setRolePermissions({ id: selected.id, permissionIds: checked }).unwrap()
      showToast('Permissions saved. Changes apply on the next request.')
      setPermissionOpen(false)
      await load()
    } catch (err) {
      showToast(getApiError(err, 'Unable to save permissions.'), 'error')
    }
  }

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title="Roles & Permissions"
        description="Configure role-based permissions for modules and actions across EduConsult CRM."
      />
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure role-wise, module-wise, and action-level access."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Roles & Permissions' }]}
        extra={canCreate ? <Button onClick={openCreate}>Create Role</Button> : undefined}
      />

      <section className={`${adminFilters} ${adminFiltersCompact}`}>
        <Input.Search
          allowClear
          enterButton="Search"
          loading={loading}
          placeholder="Filter by role name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={() => {
            void load()
          }}
        />
        <Select
          allowClear
          placeholder="All statuses"
          value={status || undefined}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
          ]}
          onChange={(value) => setStatus(asSelectString(value))}
        />
      </section>

      <section className={`${adminCard} ${tableWrap}`}>
        <Spin spinning={loading}>
          <table className={`${adminTable}`}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Status</th>
                <th>Users</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && roles.length === 0 ? (
                <tr>
                  <td colSpan={4}>No roles found.</td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <strong>{role.name}</strong>
                      <div className={`${muted}`}>{role.description}</div>
                    </td>
                    <td>
                      <Switch
                        checked={role.status === 'ACTIVE'}
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        disabled={!canEdit || role.isSystem}
                        loading={statusUpdatingId === role.id}
                        onChange={(checked) => {
                          void setRoleActive(role, checked ? 'ACTIVE' : 'INACTIVE')
                        }}
                      />
                    </td>
                    <td>{role.assignedUserCount}</td>
                    <td className={`${rowActions}`}>
                      <RowActionMenu
                        items={(
                          [
                            {
                              key: 'view',
                              label: 'View',
                              icon: <ActionIcon icon={ViewIcon} />,
                              onSelect: () => openRole(role, 'view'),
                            },
                            canEdit
                              ? {
                                  key: 'edit',
                                  label: 'Edit',
                                  icon: <ActionIcon icon={PencilEdit02Icon} />,
                                  onSelect: () => openRole(role, 'edit'),
                                }
                              : null,
                            canConfigure
                              ? {
                                  key: 'permission',
                                  label: 'Permission',
                                  icon: <ActionIcon icon={Key01Icon} />,
                                  onSelect: () => openPermissions(role),
                                }
                              : null,
                            canDelete && !role.isSystem
                              ? {
                                  key: 'delete',
                                  label: 'Delete',
                                  icon: <ActionIcon icon={Delete02Icon} />,
                                  danger: true,
                                  onSelect: () => {
                                    void removeRole(role)
                                  },
                                }
                              : null,
                          ] satisfies Array<RowActionItem | null>
                        ).filter((item) => item !== null)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Spin>
      </section>

      {formOpen
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={closeForm}>
              <div
                className={`${modalPanel}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="role-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`${modalHeader}`}>
                  <h3 id="role-modal-title">
                    {formMode === 'create' ? 'Create Role' : formMode === 'view' ? 'View Role' : 'Edit Role'}
                  </h3>
                  <button type="button" className={`${modalClose}`} aria-label="Close" onClick={closeForm}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <form
                  className={`${adminForm}`}
                  onSubmit={(event) => {
                    if (formLocked) {
                      event.preventDefault()
                      return
                    }
                    void saveRole(event)
                  }}
                >
                  <fieldset className={`${adminFormFields}`} disabled={formLocked}>
                    <label>
                      Role Name
                      <Input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        required
                        disabled={formLocked}
                      />
                    </label>
                    <label>
                      Status
                      <Select
                        value={form.status}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' },
                        ]}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            status: (asSelectString(value) || 'ACTIVE') as RecordStatus,
                          }))
                        }
                        disabled={formLocked}
                      />
                    </label>
                    <label className={`${adminFormSpan}`}>
                      Description
                      <Input
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        disabled={formLocked}
                      />
                    </label>
                  </fieldset>
                  <div className={`${formActions}`}>
                    <Button type="button" variant="secondary" onClick={closeForm}>
                      {formLocked ? 'Close' : 'Cancel'}
                    </Button>
                    {!formLocked && (selected ? canEdit : canCreate) ? <Button type="submit">Save</Button> : null}
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}

      {permissionOpen && selected
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={closePermissions}>
              <div
                className={`${modalPanel} ${modalPanelWide}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="permission-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`${modalHeader}`}>
                  <h3 id="permission-modal-title">Permissions · {selected.name}</h3>
                  <button type="button" className={`${modalClose}`} aria-label="Close" onClick={closePermissions}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <div className={`${matrix} ${matrixModal}`}>
                  <Input.Search
                    allowClear
                    placeholder="Search permissions, e.g. Lead"
                    value={permissionSearch}
                    onChange={(event) => setPermissionSearch(event.target.value)}
                  />
                  {grouped.map(([moduleName, items]) => (
                    <div key={moduleName} className={`${matrixGroup}`}>
                      <strong>{moduleName}</strong>
                      <div className={`${matrixActions}`}>
                        {items.map((item) => (
                          <label key={item.id}>
                            <input
                              type="checkbox"
                              checked={checked.includes(item.id)}
                              onChange={(event) => {
                                setChecked((current) =>
                                  event.target.checked
                                    ? [...current, item.id]
                                    : current.filter((id) => id !== item.id),
                                )
                              }}
                            />
                            {item.action}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className={`${formActions}`}>
                    <Button type="button" variant="secondary" onClick={closePermissions}>
                      Cancel
                    </Button>
                    {canConfigure ? <Button onClick={() => void savePermissions()}>Save permissions</Button> : null}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {toast
        ? createPortal(
            <div className={appToastClass(toast.type)} role="status">
              {toast.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
