import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { listLeadOptions, listLeads } from '../api/client'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon, ViewIcon } from '@hugeicons/core-free-icons'
import { Spin } from 'antd'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import PageHeader from '../components/PageHeader'
import { hasPermission } from '../lib/access'
import { readUrlSearchQuery } from '../lib/url-search'
import type { AuthSession, LeadOptions, LeadRecord } from '../types'
import './admin.css'

type Filters = {
  search: string
  countryId: string
  sourceId: string
  statusId: string
}

const EMPTY_FILTERS: Filters = { search: '', countryId: '', sourceId: '', statusId: '' }

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export default function Leads() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const location = useLocation()
  const canCreate = hasPermission(auth, 'lead:create')
  const canOpen = hasPermission(auth, ['lead:edit', 'lead:qualify'])
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [options, setOptions] = useState<Pick<LeadOptions, 'countries' | 'sources' | 'statuses'> | null>(null)
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: readUrlSearchQuery(location.search),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(typeof location.state === 'object' && location.state && 'toast' in location.state ? String((location.state as { toast?: string }).toast || '') : '')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    const [listResult, optionsResult] = await Promise.all([
      listLeads({
        search: filters.search || undefined,
        countryId: filters.countryId || undefined,
        sourceId: filters.sourceId || undefined,
        statusId: filters.statusId || undefined,
      }),
      options ? Promise.resolve({ ok: true as const, data: options }) : listLeadOptions(),
    ])
    if (!listResult.ok) {
      setError(listResult.data?.error || 'Unable to load leads.')
      setLoading(false)
      return
    }
    setLeads(listResult.data.leads)
    if (optionsResult.ok && 'countries' in optionsResult.data) {
      setOptions({
        countries: optionsResult.data.countries,
        sources: optionsResult.data.sources,
        statuses: optionsResult.data.statuses,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [filters.countryId, filters.sourceId, filters.statusId])

  useEffect(() => {
    if (!toast) {
      return undefined
    }
    toastTimer.current = setTimeout(() => setToast(''), 4000)
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }
    }
  }, [toast])

  const hasFilters = Boolean(filters.search || filters.countryId || filters.sourceId || filters.statusId)

  return (
    <div className="admin-page">
      <PageHeader title="Leads" description="Create and qualify prospective student inquiries.">
        {canCreate ? <Button onClick={() => navigate('/leads/new')}>Create Lead</Button> : null}
      </PageHeader>

      {toast ? <p className="admin-banner is-success">{toast}</p> : null}

      <section className="admin-filters">
        <Input.Search
          allowClear
          enterButton="Search"
          loading={loading}
          placeholder="Search ID, name, phone, or email"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          onSearch={() => void load()}
        />
        <Select
          allowClear
          placeholder="All countries"
          value={filters.countryId || undefined}
          options={(options?.countries || []).map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, countryId: asSelectString(value) }))}
        />
        <Select
          allowClear
          placeholder="All sources"
          value={filters.sourceId || undefined}
          options={(options?.sources || []).map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, sourceId: asSelectString(value) }))}
        />
        <Select
          allowClear
          placeholder="All statuses"
          value={filters.statusId || undefined}
          options={(options?.statuses || []).map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, statusId: asSelectString(value) }))}
        />
        <Button
          variant="secondary"
          disabled={!hasFilters}
          onClick={() => {
            setFilters(EMPTY_FILTERS)
            setTimeout(() => {
              void load()
            }, 0)
          }}
        >
          Clear filters
        </Button>
      </section>

      {error ? (
        <p className="admin-banner">
          {error}{' '}
          <button type="button" className="link-btn" onClick={() => void load()}>
            Retry
          </button>
        </p>
      ) : null}

      <section className="admin-card table-wrap">
        <Spin spinning={loading}>
          {!loading && leads.length === 0 ? (
            <div className="admin-empty">
              <strong>{hasFilters ? 'No matching leads' : 'No leads yet'}</strong>
              <p>
                {hasFilters
                  ? 'Try a different search or clear the current filters.'
                  : 'Create a lead to capture the first inquiry.'}
              </p>
              {canCreate && !hasFilters ? <Button onClick={() => navigate('/leads/new')}>Create Lead</Button> : null}
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Team</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td>
                      <div className="employee-name">{lead.fullName}</div>
                      <div className="field-hint">{lead.leadCode}</div>
                    </td>
                    <td>{lead.phoneE164}</td>
                    <td>{lead.preferredCountry?.name || '—'}</td>
                    <td>{lead.source?.name || '—'}</td>
                    <td>{lead.status?.name || '—'}</td>
                    <td>{lead.assignedTeam?.name || '—'}</td>
                    <td>{lead.assignedUser?.fullName || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="row-action-btn ui-btn ui-btn-ghost ui-btn-sm"
                        title={canOpen ? 'Edit lead' : 'View lead'}
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/leads/${lead.id}`)
                        }}
                      >
                        <span className="ui-btn-icon">
                          <HugeiconsIcon icon={canOpen ? PencilEdit02Icon : ViewIcon} size={16} color="currentColor" strokeWidth={1.5} />
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Spin>
      </section>
    </div>
  )
}
