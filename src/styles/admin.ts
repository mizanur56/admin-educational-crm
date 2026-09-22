/** Shared Tailwind class strings mapped from former admin.css rules. */

export const adminPage = 'grid min-w-0 max-w-full gap-4 overflow-x-hidden'

export const adminCard =
  'rounded-2xl border border-border bg-surface p-4 shadow-soft'

export const tableWrap =
  'max-w-full min-w-0 overflow-auto [&_.ant-spin-nested-loading]:min-h-60 [&_.ant-spin-container]:min-h-60 [&_.ant-spin-nested-loading>div>.ant-spin]:max-h-none'

export const adminTable =
  'w-full border-collapse [&_th]:border-b [&_th]:border-border-subtle [&_th]:px-2.5 [&_th]:py-3 [&_th]:text-left [&_th]:align-top [&_td]:border-b [&_td]:border-border-subtle [&_td]:px-2.5 [&_td]:py-3 [&_td]:text-left [&_td]:align-top [&_tbody_tr]:cursor-pointer'

export const adminTableRowSelected =
  'bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]'

export const adminTableRowStatusUpdated = 'bg-[#f3fbf7] dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))]'

export const muted = 'text-[0.82rem] text-text-muted'

export const statusPill = 'inline-flex rounded-full px-2 py-1 text-[0.75rem] font-bold'

export const statusPillUpdated = 'animate-[status-pill-flash_1.2s_ease]'

export const statusActive =
  'bg-[#e8f7f0] text-[#0f7a4a] dark:bg-[rgba(15,122,74,0.22)] dark:text-[#86efac]'

export const statusInactive =
  'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]'

export const statusSuspended =
  'bg-[#fde8e8] text-[#b42318] dark:bg-[rgba(180,35,24,0.22)] dark:text-[#fca5a5]'

export const statusOnLeave =
  'bg-[#fff6e5] text-[#b54708] dark:bg-[rgba(181,71,8,0.22)] dark:text-[#fdba74]'

export const statusResigned =
  'bg-[#fde8e8] text-[#b42318] dark:bg-[rgba(180,35,24,0.22)] dark:text-[#fca5a5]'

export const crmAccessEnabled =
  'bg-[#e8f7f0] text-[#0f7a4a] dark:bg-[rgba(15,122,74,0.22)] dark:text-[#86efac]'

export const crmAccessDisabled =
  'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]'

export function userStatusPillClass(status: string) {
  const key = status.toLowerCase()
  if (key === 'active') return `${statusPill} ${statusActive}`
  if (key === 'inactive') return `${statusPill} ${statusInactive}`
  if (key === 'suspended') return `${statusPill} ${statusSuspended}`
  return `${statusPill} ${statusInactive}`
}

export function employmentStatusPillClass(code?: string | null) {
  const key = (code || 'inactive').toLowerCase().replaceAll('_', '-')
  if (key === 'active') return `${statusPill} ${statusActive}`
  if (key === 'on-leave') return `${statusPill} ${statusOnLeave}`
  if (key === 'resigned') return `${statusPill} ${statusResigned}`
  if (key === 'suspended') return `${statusPill} ${statusSuspended}`
  return `${statusPill} ${statusInactive}`
}

export function crmAccessPillClass(access: string) {
  const key = access.toLowerCase()
  if (key === 'enabled') return `${statusPill} ${crmAccessEnabled}`
  return `${statusPill} ${crmAccessDisabled}`
}

export const rowActions = 'w-[72px] whitespace-nowrap'

export const rowActionBtn = 'min-w-[34px] p-1.5'

export const rowActionMenu =
  'fixed z-80 w-[200px] max-h-[min(280px,calc(100vh-16px))] overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-card'

export const rowActionMenuItem =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-text hover:bg-hover-bg'

export const rowActionMenuItemDanger =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-danger hover:bg-[color-mix(in_srgb,var(--color-danger)_16%,var(--color-surface))]'

export const adminFormFields =
  'm-0 grid min-w-0 grid-cols-1 gap-3 border-0 p-0 max-[960px]:grid-cols-1 sm:grid-cols-2'

export const adminFormSpan = 'col-span-full'

export const appToast =
  'fixed top-5 left-1/2 z-[1200] max-w-[min(420px,calc(100vw-32px))] -translate-x-1/2 rounded-[10px] px-4 py-3 text-[0.9rem] font-semibold shadow-[0_10px_28px_rgba(16,24,40,0.16)]'

export const appToastSuccess = 'bg-primary text-on-primary'

export const appToastError = 'bg-[#b42318] text-white'

export function appToastClass(type: 'success' | 'error') {
  return `${appToast} ${type === 'success' ? appToastSuccess : appToastError}`
}

export const adminBanner = 'm-0 rounded-[10px] bg-warn-bg px-3 py-2.5 text-warn-fg'

export const adminSplit =
  'grid grid-cols-1 gap-4 max-[960px]:grid-cols-1 min-[961px]:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]'

export const adminForm =
  'grid gap-3 [&_label]:grid [&_label]:gap-1.5 [&_.ui-input]:w-full [&_.ui-select]:w-full [&_.ant-picker]:w-full'

export const fieldLabel = 'inline-flex items-center'

export const fieldLabelRequired =
  "inline-flex items-center before:me-1 before:font-[SimSun,sans-serif] before:text-sm before:leading-none before:text-[#ff4d4f] before:content-['*']"

export function fieldLabelClass(required?: boolean) {
  return required ? fieldLabelRequired : fieldLabel
}

export const formActions = 'flex justify-end gap-2'

export const modalBackdrop =
  'fixed inset-0 z-50 flex items-center justify-center bg-modal-backdrop p-6'

export const modalPanel =
  'max-h-[min(90vh,860px)] w-[min(100%,720px)] overflow-auto overflow-anchor-none rounded-2xl bg-surface p-6 text-text shadow-card [&_h3]:mb-4 [&_h3]:mt-0'

export const modalPanelWide = 'w-[min(100%,880px)]'

export const modalHeader = 'mb-4 flex items-start justify-between gap-3 [&_h3]:m-0 [&_h3]:flex-1'

export const modalClose =
  'mt-[-4px] mr-[-6px] inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-icon hover:bg-hover-bg hover:text-text-strong'

export const statusConfirmPanel = 'w-[min(100%,440px)]'

export const statusConfirmCopy = 'mb-3 mt-0 leading-normal'

export const statusConfirmMeta = 'mb-5 mt-0 text-[0.9rem] text-text-muted'

export const statusConfirmDangerBtn =
  '[&_.ui-btn-primary.ui-btn-danger]:bg-[#b42318] [&_.ui-btn-primary.ui-btn-danger]:shadow-[0_6px_16px_rgba(180,35,24,0.18)] [&_.ui-btn-primary.ui-btn-danger:hover:not(:disabled)]:bg-[#9a1c14]'

export const adminFilters =
  'grid grid-cols-1 items-center gap-2.5 max-[960px]:grid-cols-1 min-[961px]:grid-cols-[minmax(220px,1.6fr)_repeat(4,minmax(140px,1fr))] [&_.ant-input-search]:w-full [&_.ant-input-search]:min-w-0 [&_.ant-select]:w-full [&_.ant-select]:min-w-0'

export const adminFiltersCompact =
  'min-[961px]:grid-cols-[minmax(220px,1.6fr)_minmax(160px,280px)]'

export const adminFiltersSingle = 'min-[961px]:grid-cols-[minmax(220px,420px)]'

export const adminFiltersMaster =
  'w-full min-w-0 items-stretch grid-cols-1 min-[561px]:grid-cols-2 min-[1101px]:grid-cols-[minmax(0,1.6fr)_repeat(auto-fit,minmax(160px,1fr))] [&>*]:min-w-0 [&>*]:max-w-full [&_.ant-input-search]:w-full [&_.ant-input-search]:min-w-0 [&_.ant-input-search]:max-w-full [&_.ant-input-group]:flex [&_.ant-input-group]:w-full [&_.ant-input-group]:min-w-0 [&_.ant-input-group-wrapper]:w-full [&_.ant-input-group-wrapper]:min-w-0 [&_.ant-input-group-wrapper]:max-w-full [&_.ant-select]:w-full [&_.ant-select]:min-w-0 [&_.ant-select]:max-w-full [&_.ant-picker]:w-full [&_.ant-picker]:min-w-0 [&_.ant-picker]:max-w-full [&_.ui-input]:w-full [&_.ui-input]:min-w-0 [&_.ui-input]:max-w-full [&_.ant-input-group_.ant-input]:min-w-0 [&_.ant-input-group_.ant-input]:flex-1 [&_.ant-input-group_.ant-input-affix-wrapper]:min-w-0 [&_.ant-input-group_.ant-input-affix-wrapper]:flex-1 [&_.ant-input-search-button]:shrink-0 [&_.ant-input-search-button]:whitespace-nowrap max-[1100px]:[&>.ant-input-search]:col-span-full max-[1100px]:[&>.ant-input-group-wrapper]:col-span-full'

export const adminFiltersEmployees =
  'w-full min-w-0 grid-cols-1 min-[561px]:grid-cols-2 min-[1101px]:grid-cols-6 [&>*]:min-w-0 [&>*]:max-w-full [&>.ant-input-search]:col-span-2 [&>.ant-input-group-wrapper]:col-span-2 [&_.ant-input-search]:w-full [&_.ant-input-search]:min-w-0 [&_.ant-input-search]:max-w-full [&_.ant-input-group]:flex [&_.ant-input-group]:w-full [&_.ant-input-group]:min-w-0 [&_.ant-input-group-wrapper]:w-full [&_.ant-input-group-wrapper]:min-w-0 [&_.ant-input-group-wrapper]:max-w-full [&_.ant-select]:w-full [&_.ant-select]:min-w-0 [&_.ant-select]:max-w-full [&_.ant-picker]:w-full [&_.ant-picker]:min-w-0 [&_.ant-picker]:max-w-full [&_.ui-input]:w-full [&_.ui-input]:min-w-0 [&_.ui-input]:max-w-full [&_.ant-input-group_.ant-input]:min-w-0 [&_.ant-input-group_.ant-input]:flex-1 [&_.ant-input-group_.ant-input-affix-wrapper]:min-w-0 [&_.ant-input-group_.ant-input-affix-wrapper]:flex-1 [&_.ant-input-search-button]:shrink-0 [&_.ant-input-search-button]:whitespace-nowrap max-[1100px]:[&>.ant-input-search]:col-span-full max-[1100px]:[&>.ant-input-group-wrapper]:col-span-full'

export const adminEmpty =
  'grid min-h-60 justify-items-center gap-2 px-4 py-12 text-center [&_strong]:text-[1.02rem] [&_p]:mb-2 [&_p]:mt-0 [&_p]:text-text-muted'

export const adminFormModalExtra =
  'mt-6 grid gap-[18px] border-t border-border-subtle pt-4 [&_label]:grid [&_label]:gap-1.5 [&_.ui-select]:w-full'

export const scopeGrid =
  'grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-3 [&_.ant-select]:w-full'

export const scopeSkeleton = '!h-8 !w-full !min-w-0'

export const sessionRow =
  'flex items-center justify-between gap-3 border-b border-border-subtle py-2'

export const activityList = 'm-0 grid list-none gap-2 p-0'

export const matrix = 'mt-5 grid gap-3'

export const matrixModal = 'mt-0'

export const matrixGroup = 'grid gap-2 border-b border-border-subtle pb-2.5'

export const matrixActions =
  'flex flex-wrap gap-x-3.5 gap-y-2.5 [&_label]:flex [&_label]:items-center [&_label]:gap-1.5 [&_label]:font-medium [&_label]:capitalize'

export const accountForm = 'max-w-[420px]'

export const linkBtn =
  'cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-primary'

export const fieldHint = 'text-[0.78rem] text-text-muted'

export const fieldError = 'text-[0.78rem] text-[#b42318]'

export const photoUpload = 'grid justify-items-start gap-2'

export const photoPicker = 'relative'

export const photoPickerButton =
  'relative m-0 grid h-[132px] w-[132px] cursor-pointer place-items-center focus-visible:outline-none'

export const photoPreviewFrame =
  'relative grid h-[118px] w-[118px] place-items-center overflow-hidden rounded-full bg-primary text-on-primary shadow-[0_0_0_6px_var(--color-surface),0_0_0_8px_var(--color-primary)] [&_img]:h-full [&_img]:w-full [&_img]:object-cover'

/** @deprecated alias — prefer photoPreviewFrame to avoid clashing with local state named photoPreview */
export const photoPreview = photoPreviewFrame

export const photoPreviewInvalid =
  'shadow-[0_0_0_6px_var(--color-surface),0_0_0_8px_#ff4d4f]'

export const createFormFields =
  'm-0 grid min-w-0 grid-cols-1 items-start gap-3 border-0 p-0 min-[721px]:grid-cols-2 min-[1101px]:grid-cols-3'

export const formField = 'grid min-w-0 gap-1.5 content-start [&_>label]:min-h-[1.35em] [&_.ant-input]:w-full [&_.ant-input]:min-w-0 [&_.ant-input-affix-wrapper]:w-full [&_.ant-input-affix-wrapper]:min-w-0 [&_.ant-select]:w-full [&_.ant-select]:min-w-0 [&_.ant-picker]:w-full [&_.ant-picker]:min-w-0'

export const formFieldInvalid =
  '[&_.ant-select-selector]:!border-[#ff4d4f] [&_.ant-input]:!border-[#ff4d4f] [&_.ant-picker]:!border-[#ff4d4f] [&_.file-input]:!border-[#ff4d4f]'

export const userViewNavBtn =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-[#667085]'

export const userViewNavBtnActive =
  'bg-[#eef1ff] font-semibold text-[#4f5de4] dark:bg-[rgba(91,103,232,0.18)] dark:text-[#aab3ff]'

export const userViewNavBtnIdle = 'hover:bg-[#f5f7fb]'

export const userViewActivity =
  'm-0 grid list-none p-0 [&_li]:grid [&_li]:grid-cols-[34px_minmax(0,1fr)_auto] [&_li]:items-center [&_li]:gap-2.5 [&_li]:border-b [&_li]:border-[#eef2f8] [&_li]:py-2.5 [&_li:last-child]:border-b-0 [&_strong]:block [&_strong]:text-[0.88rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong [&_p]:m-0 [&_p]:text-[0.76rem] [&_p]:text-[#7b8498] [&_time]:whitespace-nowrap [&_time]:text-[0.76rem] [&_time]:text-[#8b97a8]'

export const userViewActivityIcon =
  'inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#eef1ff] text-[#5b67e8]'

export const userViewActivityIconAdd = 'bg-[#e8f8ef] text-[#17824b]'

export const userViewScopeBase = 'rounded-2xl border p-3.5'

export const userViewScopeTone: Record<'blue' | 'purple' | 'green', string> = {
  blue: 'border-[#e4e8fb] bg-[#f5f7ff] dark:bg-[rgba(91,103,232,0.14)] [&_.user-view-scope-icon]:text-[#5b67e8]',
  purple: 'border-[#ebe4fb] bg-[#f7f4ff] dark:bg-[rgba(122,90,248,0.14)] [&_.user-view-scope-icon]:text-[#7a5af8]',
  green: 'border-[#dceee3] bg-[#f3fbf6] dark:bg-[rgba(31,157,93,0.14)] [&_.user-view-scope-icon]:text-[#1f9d5d]',
}

export const userViewPanel =
  'flex h-[min(92vh,860px)] max-h-[min(92vh,860px)] w-[min(100%,1120px)] min-h-0 flex-col overflow-hidden bg-[#f7f8fd] p-0 dark:bg-[#151b22]'

export const mdTab =
  'shrink-0 whitespace-nowrap border-0 border-b-2 border-transparent bg-transparent px-3 py-2 font-[inherit] text-[0.88rem] text-text-muted no-underline hover:text-text'

export const mdTabActive = 'border-primary font-semibold text-primary'

export const mdHistoryEvent =
  'flex w-full cursor-pointer items-start gap-2.5 rounded-xl border-0 bg-transparent px-2 py-2 text-left'

export const mdHistoryEventActive = 'bg-[color-mix(in_srgb,#2f6fed_10%,var(--color-surface))] dark:bg-[color-mix(in_srgb,#2f6fed_18%,var(--color-surface))]'

export const mdHistoryDetailIcon =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2f7] text-[#64748b]'

export const mdHistoryRole =
  'rounded-full bg-[color-mix(in_srgb,#2f6fed_12%,var(--color-surface))] px-2 py-0.5 text-[0.72rem] font-semibold dark:bg-[color-mix(in_srgb,#2f6fed_18%,var(--color-surface))]'

export const historyKindTone: Record<string, string> = {
  updated: 'bg-[#2f6fed] text-white',
  created: 'bg-[#17824b] text-white',
  status: 'bg-[#d46b08] text-white',
  assigned: 'bg-[#4f5de4] text-white',
  deleted: 'bg-[#b42318] text-white',
}

export const employeeAvatar =
  'grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary object-cover font-bold text-on-primary'

export const employeeAvatarSm = 'h-[34px] w-[34px] text-[0.72rem]'

export const employeeAvatarLg = 'h-16 w-16 text-[1.1rem]'

export const documentUpload =
  'relative grid min-w-0 gap-1.5'

export const documentUploadHasFile =
  '[&_[data-doc-card]]:border-primary [&_[data-doc-card]]:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))]'

export const documentUploadInvalid =
  '[&_[data-doc-card]]:border-[#ff4d4f]'

export const photoCameraBadge =
  'absolute right-1.5 bottom-2 grid h-9 w-9 place-items-center rounded-full bg-primary text-on-primary shadow-[0_0_0_3px_var(--color-surface)] group-hover:bg-primary-hover'

export const photoUploadSpin =
  'absolute inset-0 z-1 grid place-items-center rounded-[inherit] bg-[color-mix(in_srgb,var(--color-surface)_62%,transparent)]'

export const isUploading = 'pointer-events-none'
