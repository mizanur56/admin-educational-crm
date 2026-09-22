import { Dropdown, type MenuProps, Table, Tooltip } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreVerticalIcon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState, type CSSProperties, type Key, type MouseEvent, type ReactNode } from 'react'
import { useAppSelector } from '@/redux/features/hooks'
import './AntTable.css'

export type DataTableActionItem = {
  key: string
  label: string
  icon?: ReactNode
  onClick: (record: Record<string, unknown>) => void
  danger?: boolean
  disabled?: boolean
}

type DataTableProps = {
  data?: unknown[]
  columns?: unknown[]
  rowKey?: string
  currentPage?: number
  setLimit?: (limit: number) => void
  setCurrentPage?: (page: number) => void
  selectRow?: boolean
  isPaginate?: boolean
  showHeader?: boolean
  total?: number
  limit?: number
  loading?: boolean
  onSelectRowsChange?: (rows: unknown[]) => void
  showSizeChanger?: boolean
  clearSelectionTrigger?: unknown
  expandable?: unknown
  actions?: DataTableActionItem[] | ((record: Record<string, unknown>) => DataTableActionItem[])
  actionsMode?: 'dropdown' | 'icons'
  actionsAlign?: 'center' | 'left'
  onRow?: (record: Record<string, unknown>, index?: number) => {
    onClick?: (event: MouseEvent) => void
    style?: CSSProperties
    [key: string]: unknown
  }
  showRowNumber?: boolean
  pagination?: Record<string, unknown>
  summary?: unknown
  bordered?: boolean
}

export default function DataTable(props: DataTableProps) {
  const collapsed = useAppSelector((state) => state.sidebar.collapsed)
  const isExpanded = !collapsed
  const {
    data,
    columns,
    rowKey,
    currentPage,
    setLimit,
    setCurrentPage,
    selectRow = false,
    isPaginate,
    showHeader,
    total,
    limit,
    loading = false,
    onSelectRowsChange,
    showSizeChanger = false,
    clearSelectionTrigger = false,
    expandable,
    actions,
    actionsMode = 'dropdown',
    actionsAlign = 'center',
    onRow,
    showRowNumber = true,
    pagination: paginationProp,
    summary,
    bordered = false,
  } = props
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const suppressRowClickRef = useRef(false)

  const runRowAction = (actionFn: () => void) => {
    suppressRowClickRef.current = true
    actionFn()
    window.setTimeout(() => {
      suppressRowClickRef.current = false
    }, 300)
  }

  const getRowProps = (record: Record<string, unknown>, index?: number) => {
    if (!onRow) return undefined

    const rowProps = onRow(record, index)
    if (!rowProps?.onClick) return rowProps

    const originalOnClick = rowProps.onClick

    return {
      ...rowProps,
      onClick: (event: MouseEvent) => {
        if (suppressRowClickRef.current) {
          event.stopPropagation()
          return
        }
        originalOnClick(event)
      },
    }
  }

  useEffect(() => {
    if (clearSelectionTrigger) {
      setSelectedRowKeys([])
    }
  }, [clearSelectionTrigger])

  const handleRowSelectionChange = (keys: Key[], selectedRows: unknown[]) => {
    setSelectedRowKeys(keys)
    onSelectRowsChange?.(selectedRows)
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: handleRowSelectionChange,
  }

  const rowNumberColumn = {
    title: '#',
    key: 'rowNumber',
    width: 60,
    align: 'center' as const,
    render: (_: unknown, __: unknown, index: number) => {
      if (isPaginate && currentPage && limit) {
        return (currentPage - 1) * limit + index + 1
      }
      return index + 1
    },
  }

  const actionsColumn = actions
    ? {
        title: 'Actions',
        key: 'actions',
        width: actionsMode === 'icons' ? 140 : 80,
        align: actionsAlign,
        fixed: 'right' as const,
        render: (_: unknown, record: Record<string, unknown>) => {
          const resolvedActions = typeof actions === 'function' ? actions(record) : actions

          if (!Array.isArray(resolvedActions) || resolvedActions.length === 0) {
            return null
          }

          if (actionsMode === 'icons') {
            return (
              <div
                className={`flex items-center gap-2 ${
                  actionsAlign === 'left' ? 'justify-start' : 'justify-center'
                }`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {resolvedActions.map((action, index) => (
                  <Tooltip key={action.key || index} title={action.label} placement="top">
                    <button
                      type="button"
                      disabled={action.disabled}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (action.disabled) return
                        runRowAction(() => action.onClick(record))
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#C7CACF] transition-all ${
                        action.disabled
                          ? 'cursor-not-allowed text-gray-300'
                          : 'cursor-pointer text-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {action.icon}
                    </button>
                  </Tooltip>
                ))}
              </div>
            )
          }

          const menuItems: MenuProps['items'] = resolvedActions.map((action, index) => ({
            key: action.key || index,
            label: (
              <div className="flex cursor-pointer items-center gap-2">
                {action.icon ? <span>{action.icon}</span> : null}
                <span>{action.label}</span>
              </div>
            ),
            danger: action.danger,
            disabled: action.disabled,
            onClick: (info) => {
              if (action.disabled) return
              info.domEvent.stopPropagation()
              info.domEvent.preventDefault()
              runRowAction(() => action.onClick(record))
            },
          }))

          return (
            <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                <button
                  type="button"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border border-[#C7CACF] transition-all duration-400 hover:border-primary hover:bg-gray-100 hover:text-primary ${
                    actionsAlign === 'left' ? 'ml-0' : ''
                  }`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} size={18} color="currentColor" strokeWidth={1.5} />
                </button>
              </Dropdown>
            </div>
          )
        },
      }
    : null

  const columnsWithRowNumber = [
    ...(showRowNumber ? [rowNumberColumn] : []),
    ...((columns as unknown[]) || []),
    ...(actionsColumn ? [actionsColumn] : []),
  ]

  const safeData: Record<string, unknown>[] = Array.isArray(data)
    ? (data as Record<string, unknown>[])
    : []

  const totalDataCount = total || (paginationProp?.total as number | undefined) || safeData.length || 0
  const hasPaginationConfig = isPaginate || paginationProp
  const shouldShowPagination = Boolean(hasPaginationConfig && totalDataCount > 10)
  const isServerSidePaginated = Boolean(total || paginationProp?.total)
  const pageSize = limit || (paginationProp?.pageSize as number | undefined) || 20
  const currentPageNum = currentPage || (paginationProp?.current as number | undefined) || 1
  const paginatedData =
    shouldShowPagination && !isServerSidePaginated
      ? safeData.slice((currentPageNum - 1) * pageSize, currentPageNum * pageSize)
      : safeData

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto">
      <Table
        bordered={bordered}
        loading={loading}
        className={`rounded-lg ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
        rowKey={rowKey || 'id'}
        rowSelection={selectRow ? rowSelection : undefined}
        dataSource={paginatedData}
        columns={columnsWithRowNumber as never}
        tableLayout="fixed"
        scroll={{ x: true }}
        expandable={expandable as never}
        onRow={getRowProps as never}
        pagination={
          shouldShowPagination
            ? {
                pageSize,
                total: total || (paginationProp?.total as number | undefined) || totalDataCount,
                current: currentPageNum,
                onChange: (page, pageSizeArg) => {
                  const onChange = paginationProp?.onChange as
                    | ((page: number, pageSize?: number) => void)
                    | undefined
                  onChange?.(page, pageSizeArg)
                  setCurrentPage?.(page)
                },
                showSizeChanger: showSizeChanger || Boolean(paginationProp?.showSizeChanger),
                pageSizeOptions: ['10', '25', '50', '100', '200', '500', '1000'],
                onShowSizeChange: (_current, newSize) => {
                  const onShowSizeChange = paginationProp?.onShowSizeChange as
                    | ((current: number, size: number) => void)
                    | undefined
                  onShowSizeChange?.(_current, newSize)
                  setLimit?.(newSize)
                  setCurrentPage?.(1)
                },
                showQuickJumper: Boolean(paginationProp?.showQuickJumper),
                ...(paginationProp || {}),
              }
            : false
        }
        showHeader={showHeader}
        summary={summary as never}
      />
    </div>
  )
}
