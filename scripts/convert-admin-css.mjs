/**
 * One-shot converter: admin.css class tokens → Tailwind / shared constants.
 * Run from campusly-crm: node scripts/convert-admin-css.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')

/** Shared classes → export name in styles/admin.ts */
const SHARED = {
  'admin-page': 'adminPage',
  'admin-card': 'adminCard',
  'table-wrap': 'tableWrap',
  'admin-table': 'adminTable',
  muted: 'muted',
  'status-pill': 'statusPill',
  'row-actions': 'rowActions',
  'row-action-btn': 'rowActionBtn',
  'row-action-menu': 'rowActionMenu',
  'admin-form-fields': 'adminFormFields',
  'admin-form-span': 'adminFormSpan',
  'app-toast': 'appToast',
  'app-toast-success': 'appToastSuccess',
  'app-toast-error': 'appToastError',
  'admin-banner': 'adminBanner',
  'admin-split': 'adminSplit',
  'admin-form': 'adminForm',
  'field-label': 'fieldLabel',
  'form-actions': 'formActions',
  'modal-backdrop': 'modalBackdrop',
  'modal-panel': 'modalPanel',
  'modal-panel-wide': 'modalPanelWide',
  'modal-header': 'modalHeader',
  'modal-close': 'modalClose',
  'status-confirm-panel': 'statusConfirmPanel',
  'status-confirm-copy': 'statusConfirmCopy',
  'status-confirm-meta': 'statusConfirmMeta',
  'admin-filters': 'adminFilters',
  'admin-filters-compact': 'adminFiltersCompact',
  'admin-filters-single': 'adminFiltersSingle',
  'admin-filters-master': 'adminFiltersMaster',
  'admin-filters-employees': 'adminFiltersEmployees',
  'admin-empty': 'adminEmpty',
  'scope-grid': 'scopeGrid',
  'scope-skeleton': 'scopeSkeleton',
  'session-row': 'sessionRow',
  'activity-list': 'activityList',
  matrix: 'matrix',
  'matrix-modal': 'matrixModal',
  'matrix-group': 'matrixGroup',
  'matrix-actions': 'matrixActions',
  'account-form': 'accountForm',
  'link-btn': 'linkBtn',
  'field-hint': 'fieldHint',
  'field-error': 'fieldError',
  'photo-upload': 'photoUpload',
  'photo-picker': 'photoPicker',
  'photo-picker-button': 'photoPickerButton',
  'photo-preview': 'photoPreview',
  'photo-camera-badge': 'photoCameraBadge',
  'photo-upload-spin': 'photoUploadSpin',
}

/** Page-specific / remaining tokens → full Tailwind string */
const INLINE = {
  'is-updated': 'animate-[status-pill-flash_1.2s_ease]',
  'is-selected':
    'bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]',
  'is-status-updated':
    'bg-[#f3fbf7] dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))]',
  'status-active':
    'bg-[#e8f7f0] text-[#0f7a4a] dark:bg-[rgba(15,122,74,0.22)] dark:text-[#86efac]',
  'status-inactive':
    'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]',
  'status-suspended':
    'bg-[#fde8e8] text-[#b42318] dark:bg-[rgba(180,35,24,0.22)] dark:text-[#fca5a5]',
  'status-on-leave':
    'bg-[#fff6e5] text-[#b54708] dark:bg-[rgba(181,71,8,0.22)] dark:text-[#fdba74]',
  'status-resigned':
    'bg-[#fde8e8] text-[#b42318] dark:bg-[rgba(180,35,24,0.22)] dark:text-[#fca5a5]',
  'crm-access-enabled':
    'bg-[#e8f7f0] text-[#0f7a4a] dark:bg-[rgba(15,122,74,0.22)] dark:text-[#86efac]',
  'crm-access-disabled':
    'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]',
  'crm-access-none':
    'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]',
  'is-danger':
    'text-danger hover:bg-[color-mix(in_srgb,var(--color-danger)_16%,var(--color-surface))]',
  'is-required':
    "before:me-1 before:font-[SimSun,sans-serif] before:text-sm before:leading-none before:text-[#ff4d4f] before:content-['*']",
  'is-uploading': 'pointer-events-none',
  'is-invalid': '', // handled via parent compound patterns where needed
  'is-active': '', // context-dependent — handled in page-specific maps below
  'modal-extra':
    'mt-6 grid gap-[18px] border-t border-border-subtle pt-4 [&_label]:grid [&_label]:gap-1.5 [&_.ui-select]:w-full',
  'user-profile-card': 'grid gap-6',
  'user-profile-identity': 'flex items-center gap-4 [&_h3]:m-0 [&_h3]:text-[1.15rem] [&_h3]:text-text-strong [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[0.9rem] [&_p]:text-text-muted',
  'user-profile-avatar':
    'grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-base font-bold text-on-primary [&_img]:h-full [&_img]:w-full [&_img]:object-cover',
  'employee-profile-fields':
    'm-0 grid grid-cols-1 gap-x-10 gap-y-5 min-[721px]:grid-cols-2 [&_dt]:text-[0.76rem] [&_dt]:tracking-[0.03em] [&_dt]:text-text-muted [&_dt]:uppercase [&_dd]:mt-1.5 [&_dd]:break-words [&_dd]:text-text [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline',

  // Users view modal
  'user-view-panel':
    'flex h-[min(92vh,860px)] max-h-[min(92vh,860px)] w-[min(100%,1120px)] min-h-0 flex-col overflow-hidden bg-[#f7f8fd] p-0 dark:bg-[#151b22]',
  'user-view-header':
    'flex shrink-0 items-center justify-between gap-3 border-b border-[#ebeff7] bg-white px-5 py-4 dark:border-border dark:bg-surface [&_h3]:m-0 [&_h3]:text-[1.05rem] [&_h3]:text-[#24324d] dark:[&_h3]:text-text-strong',
  'user-view-title': 'flex items-center gap-2.5',
  'user-view-title-icon':
    'inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#eef0ff] text-[#5b67e8]',
  'user-view-body':
    'grid min-h-0 flex-1 grid-cols-1 overflow-hidden max-[960px]:grid-rows-none max-[960px]:overflow-auto max-[960px]:overscroll-contain min-[961px]:grid-cols-[248px_minmax(0,1fr)] min-[961px]:grid-rows-[minmax(0,1fr)]',
  'user-view-aside':
    'flex h-auto min-h-0 flex-col gap-[18px] overflow-visible border-b border-border bg-[radial-gradient(circle_at_0_100%,rgba(91,103,232,0.08),transparent_46%),#fff] px-4 pt-[22px] pb-[18px] max-[960px]:overflow-visible min-[961px]:h-full min-[961px]:overflow-auto min-[961px]:border-r min-[961px]:border-b-0 dark:border-border dark:bg-surface',
  'user-view-profile': 'grid justify-items-center gap-2.5 text-center',
  'user-view-avatar':
    'grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-primary text-[1.2rem] font-bold text-on-primary shadow-[0_10px_20px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] [&_img]:h-full [&_img]:w-full [&_img]:object-cover',
  'user-table-person': 'flex min-w-0 items-center gap-2.5',
  'user-table-avatar':
    'grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-[0.72rem] font-bold text-on-primary [&_img]:h-full [&_img]:w-full [&_img]:object-cover',
  'user-view-identity':
    '[&_strong]:block [&_strong]:text-[1.02rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong [&_p]:my-0.5 [&_p]:mb-2 [&_p]:text-[0.82rem] [&_p]:text-[#7b8498]',
  'user-view-nav': 'grid gap-1',
  'user-view-nav-btn':
    'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-[#667085]',
  'user-view-nav-btn-active': 'bg-[#eef1ff] font-semibold text-[#4f5de4] dark:bg-[rgba(91,103,232,0.18)] dark:text-[#aab3ff]',
  'user-view-nav-btn-idle': 'hover:bg-[#f5f7fb]',
  'user-view-note':
    'mt-auto flex gap-2 rounded-[14px] bg-[#eef4ff] p-3 text-[#5b67e8] dark:bg-[rgba(91,103,232,0.16)] [&_strong]:mb-1 [&_strong]:block [&_strong]:text-[0.82rem] [&_p]:m-0 [&_p]:text-[0.75rem] [&_p]:leading-snug [&_p]:text-[#6b7690]',
  'user-view-main':
    'flex h-auto min-h-0 min-w-0 flex-col overflow-visible max-[960px]:overflow-visible min-[961px]:h-full min-[961px]:overflow-hidden',
  'user-view-scroll':
    'grid min-h-0 flex-1 content-start gap-3.5 overflow-visible overscroll-contain px-[18px] pt-4 pb-2 max-[960px]:overflow-visible min-[961px]:overflow-y-auto',
  'user-view-top':
    'grid grid-cols-1 gap-3.5 max-[960px]:grid-cols-1 min-[961px]:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]',
  'user-view-side-stack': 'grid content-start gap-3',
  'user-view-card':
    'rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong',
  'user-view-card-icon': 'inline-flex h-7 w-7 items-center justify-center rounded-lg',
  'is-blue': 'bg-[#eef1ff] text-[#5b67e8]',
  'is-green': 'bg-[#e8f8ef] text-[#1f9d5d]',
  'user-view-fields':
    'm-0 grid gap-2.5 [&>div]:grid [&>div]:grid-cols-1 [&>div]:items-center [&>div]:gap-2.5 max-[960px]:[&>div]:grid-cols-1 min-[961px]:[&>div]:grid-cols-[110px_minmax(0,1fr)] [&_dt]:text-[0.84rem] [&_dt]:text-[#7b8498] [&_dt]:after:content-[":"] [&_dd]:m-0 [&_dd]:text-[0.9rem] [&_dd]:font-semibold [&_dd]:text-[#24324d] dark:[&_dd]:text-text-strong',
  'user-view-chip':
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold',
  'is-role': 'bg-[#eef1ff] text-[#4f5de4]',
  'is-dept': 'bg-[#e9f8ef] text-[#17824b]',
  'user-view-meta-row': 'grid grid-cols-1 gap-2.5 max-[960px]:grid-cols-1 min-[961px]:grid-cols-2',
  'user-view-meta':
    'flex items-start gap-2 rounded-[14px] border border-[#e8edf6] bg-white px-3 py-2.5 text-[#7b8498] dark:border-border dark:bg-surface [&_span]:block [&_span]:text-[0.72rem] [&_strong]:mt-0.5 [&_strong]:block [&_strong]:text-[0.78rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong',
  'user-view-scope-grid':
    'grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-3',
  'user-view-stats':
    'grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-4',
  'user-view-scope': 'rounded-2xl border border-[#e8edf6] p-3.5',
  blue: 'border-[#e4e8fb] bg-[#f5f7ff] dark:bg-[rgba(91,103,232,0.14)]',
  purple: 'border-[#ebe4fb] bg-[#f7f4ff] dark:bg-[rgba(122,90,248,0.14)]',
  green: 'border-[#dceee3] bg-[#f3fbf6] dark:bg-[rgba(31,157,93,0.14)]',
  'user-view-scope-head':
    'mb-2 flex items-center gap-2 [&_span]:inline-flex [&_span]:h-7 [&_span]:w-7 [&_span]:items-center [&_span]:justify-center [&_span]:rounded-lg [&_span]:bg-white [&_b]:flex-1 [&_b]:text-[0.88rem] [&_b]:text-[#24324d] dark:[&_b]:text-text-strong [&_em]:rounded-full [&_em]:bg-white [&_em]:px-2 [&_em]:py-0.5 [&_em]:text-[0.72rem] [&_em]:font-bold [&_em]:not-italic [&_em]:text-[#4f5de4]',
  'user-view-scope-p': 'm-0 text-[0.78rem] leading-snug text-[#6b7690]',
  'user-view-stat': 'rounded-2xl p-3.5 text-left',
  'user-view-stat-icon':
    'mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white',
  'user-view-activity': 'm-0 grid list-none p-0',
  'user-view-activity-icon':
    'inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#eef1ff] text-[#5b67e8]',
  'is-add': 'bg-[#e8f8ef] text-[#17824b]',
  'user-view-stack': 'grid gap-3.5',
  'user-view-footer': 'flex shrink-0 justify-end px-[18px] pt-3 pb-4',
  'user-view-empty': 'min-h-[180px]',

  // Master data history / tabs / import
  'md-toolbar': 'flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2',
  'md-toolbar-end': 'ml-auto flex min-w-0 flex-wrap justify-end gap-2',
  'md-toolbar-start': 'flex min-w-0 flex-wrap justify-end gap-2',
  'md-tabs': 'flex max-w-full gap-1 overflow-x-auto border-b border-border',
  'md-tab':
    'shrink-0 whitespace-nowrap border-0 border-b-2 border-transparent bg-transparent px-3 py-2 font-[inherit] text-[0.88rem] text-text-muted no-underline hover:text-text',
  'md-import-errors': 'mb-3 mt-0 pl-[18px]',
  'md-history-panel':
    'flex max-h-[min(92vh,760px)] w-[min(100%,980px)] flex-col overflow-hidden rounded-[18px] p-0',
  'md-history-header':
    'flex items-start justify-between gap-3 border-b border-border px-5 pt-[18px] pb-3.5',
  'md-history-title': 'flex min-w-0 items-start gap-3',
  'md-history-title-icon':
    'inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#2f6fed]',
  'md-history-loading': 'm-0 flex min-h-60 items-center justify-center',
  'md-history-empty': 'm-0 flex min-h-60 items-center justify-center',
  'md-history-layout': 'grid min-h-0 flex-1 grid-cols-1 min-[721px]:grid-cols-[250px_minmax(0,1fr)]',
  'md-history-timeline':
    'overflow-auto border-r border-border px-3 py-4 pl-4 [&_h4]:mb-3 [&_h4]:mt-0 [&_h4]:text-[0.72rem] [&_h4]:font-bold [&_h4]:tracking-[0.04em] [&_h4]:text-[#8b97a8] [&_h4]:uppercase [&_ol]:m-0 [&_ol]:list-none [&_ol]:p-0 [&_li]:relative [&_li]:pb-2 [&_li:not(:last-child)]:before:absolute [&_li:not(:last-child)]:before:top-[38px] [&_li:not(:last-child)]:before:bottom-0 [&_li:not(:last-child)]:before:left-[19px] [&_li:not(:last-child)]:before:w-px [&_li:not(:last-child)]:before:bg-border-subtle [&_li:not(:last-child)]:before:content-[""]',
  'md-history-event':
    'flex w-full cursor-pointer items-start gap-2.5 rounded-xl border-0 bg-transparent px-2 py-2 text-left',
  'md-history-dot': 'mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#94a3b8]',
  'md-history-event-copy': 'min-w-0 flex-1 [&_strong]:block [&_strong]:text-[0.88rem] [&_time]:text-[0.72rem] [&_time]:text-text-muted',
  'md-history-event-user':
    'mt-1 flex items-center gap-1.5 text-[0.75rem] text-text-muted [&_em]:rounded-full [&_em]:bg-[color-mix(in_srgb,#2f6fed_12%,var(--color-surface))] [&_em]:px-1.5 [&_em]:py-0.5 [&_em]:text-[0.7rem] [&_em]:not-italic dark:[&_em]:bg-[color-mix(in_srgb,#2f6fed_18%,var(--color-surface))]',
  'md-history-detail': 'flex min-h-0 flex-col overflow-auto p-4',
  'md-history-detail-head': 'mb-4 flex items-start justify-between gap-3',
  'md-history-detail-title': 'flex min-w-0 items-start gap-3 [&_strong]:block [&_strong]:text-[0.95rem] [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[0.8rem] [&_p]:text-text-muted [&_p_span]:text-text-faint',
  'md-history-detail-icon':
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2f7] text-[#64748b]',
  'md-history-role':
    'rounded-full bg-[color-mix(in_srgb,#2f6fed_12%,var(--color-surface))] px-2 py-0.5 text-[0.72rem] font-semibold dark:bg-[color-mix(in_srgb,#2f6fed_18%,var(--color-surface))]',
  'is-admin': '',
  'is-administrator': '',
  'md-history-latest':
    'rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] px-2 py-0.5 text-[0.72rem] font-semibold text-primary',
  'md-history-card':
    'rounded-2xl border border-border bg-surface p-4 shadow-soft [&_h4]:mb-3 [&_h4]:mt-0 [&_h4]:text-[0.72rem] [&_h4]:font-bold [&_h4]:tracking-[0.04em] [&_h4]:text-[#8b97a8] [&_h4]:uppercase',
  'md-history-table': '',
  'md-history-table-head':
    'grid grid-cols-3 gap-2 border-b border-border-subtle px-1 pb-2 text-[0.72rem] font-bold tracking-[0.04em] text-text-muted uppercase',
  'md-history-table-row':
    'grid grid-cols-3 gap-2 border-b border-border-subtle px-1 py-2.5 last:border-b-0 [&_span]:text-[0.82rem] [&_span]:text-text-muted [&_strong]:text-[0.88rem] [&_strong]:text-text',
  'md-history-empty-row': 'py-6 text-center text-text-muted',
  'md-history-notes': '[&_h4]:mb-2 [&_h4]:mt-0 [&_h4]:text-[0.72rem] [&_h4]:font-bold [&_h4]:tracking-[0.04em] [&_h4]:text-[#8b97a8] [&_h4]:uppercase [&_p]:m-0 [&_p]:text-[0.88rem] [&_p]:text-text',
  'md-history-footer': 'flex justify-end gap-2 border-t border-border px-5 py-3.5',
  'is-created': '[&_.md-history-dot]:bg-[#17824b] bg-[#e8f8ef] text-[#17824b]',
  'is-status': '[&_.md-history-dot]:bg-[#d46b08] bg-[#fff3e8] text-[#d46b08]',
  'is-assigned': '[&_.md-history-dot]:bg-[#4f5de4] bg-[#eef1ff] text-[#4f5de4]',
  'is-deleted': '[&_.md-history-dot]:bg-[#b42318] bg-[#fde8e8] text-[#b42318]',

  // Employees
  'employee-identity': 'flex min-w-[180px] items-center gap-2.5',
  'employee-avatar':
    'grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary object-cover font-bold text-on-primary',
  'employee-avatar-sm': 'h-[34px] w-[34px] text-[0.72rem]',
  'employee-avatar-lg': 'h-16 w-16 text-[1.1rem]',
  'employee-table': '[&_th]:align-middle [&_th]:whitespace-nowrap [&_td]:align-middle [&_td]:whitespace-nowrap',
  'employee-name': 'font-[650]',
  'employee-name-link': 'font-[650] text-inherit no-underline hover:text-primary hover:underline',
  'employee-view': 'grid gap-[18px]',
  'employee-view-profile': 'flex items-center gap-3.5 [&_strong]:block [&_p]:my-0.5 [&_p]:mb-2 [&_p]:text-text-muted',
  'employee-view-fields':
    'm-0 grid grid-cols-1 gap-x-4 gap-y-3 min-[721px]:grid-cols-2 [&_dt]:text-[0.78rem] [&_dt]:text-text-muted [&_dd]:mt-0.5 [&_dd]:mb-0',

  // Employee create
  'employee-create':
    '[&_.admin-form-fields]:grid-cols-1 [&_.admin-form-fields]:items-start min-[721px]:[&_.admin-form-fields]:grid-cols-2 min-[1101px]:[&_.admin-form-fields]:grid-cols-3 [&_.form-field]:content-start [&_.form-field>label]:min-h-[1.35em] [&_.form-field_.ant-input]:w-full [&_.form-field_.ant-input]:min-w-0 [&_.form-field_.ant-input-affix-wrapper]:w-full [&_.form-field_.ant-input-affix-wrapper]:min-w-0 [&_.form-field_.ant-select]:w-full [&_.form-field_.ant-select]:min-w-0 [&_.form-field_.ant-picker]:w-full [&_.form-field_.ant-picker]:min-w-0 [&_textarea.ui-input]:h-auto [&_textarea.ui-input]:min-h-[84px] [&_textarea.ui-input]:px-[11px] [&_textarea.ui-input]:py-2 [&_textarea.ant-input]:h-auto [&_textarea.ant-input]:min-h-[84px] [&_textarea.ant-input]:px-[11px] [&_textarea.ant-input]:py-2',
  'employee-create-form': 'grid gap-4',
  'form-section': '',
  'form-section-header':
    'border-b border-[color-mix(in_srgb,var(--color-text-muted)_22%,transparent)] pb-3 [&_h3]:m-0 [&_h3]:text-[1.05rem] [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-text-muted',
  'form-field': 'grid min-w-0 gap-1.5',
  'section-errors': 'mt-3 mb-0 rounded-[10px] bg-[#fde8e8] py-2.5 pr-3 pl-7 text-[#b42318]',
  'address-row': 'grid min-w-0 grid-cols-1 gap-3 min-[721px]:grid-cols-2',
  'toggle-row':
    'flex items-center justify-between gap-4 max-[720px]:flex-col max-[720px]:items-stretch [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-text-muted',
  'account-summary':
    'm-0 grid grid-cols-1 gap-x-4 gap-y-3 min-[721px]:grid-cols-3 [&_dt]:text-[0.78rem] [&_dt]:text-text-muted [&_dd]:mt-0.5 [&_dd]:mb-0',
  'document-upload-grid':
    'grid grid-cols-1 gap-3 min-[721px]:grid-cols-2 min-[1101px]:grid-cols-3',
  'document-upload': 'relative grid min-w-0 gap-1.5',
  'document-upload-input': '',
  'document-upload-card':
    'm-0 flex min-h-[86px] cursor-pointer items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_32%,var(--color-border))] bg-surface px-4 py-3.5 transition-[border-color,background,box-shadow] duration-150 hover:border-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))]',
  'document-upload-icon':
    'grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-primary',
  'document-upload-copy':
    'min-w-0 flex-1 [&_strong]:block [&_strong]:text-[0.92rem] [&_strong]:font-[650] [&_strong]:leading-snug [&_strong]:text-text [&_span]:mt-0.5 [&_span]:line-clamp-2 [&_span]:text-[0.76rem] [&_span]:leading-snug [&_span]:text-text-muted',
  'document-upload-action':
    'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-primary',
  'document-upload-actions': 'flex items-center gap-1',
  'document-upload-tool':
    'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-icon hover:bg-hover-bg',
  'document-preview-panel': 'grid gap-3',
  'document-preview-name': 'm-0 text-[0.92rem] font-semibold text-text',
  'document-preview-body':
    'overflow-hidden rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-page-bg)_70%,var(--color-surface))] [&_img]:mx-auto [&_img]:max-h-[60vh] [&_img]:max-w-full [&_img]:object-contain [&_iframe]:h-[60vh] [&_iframe]:w-full [&_iframe]:border-0',
  'document-preview-fallback': 'p-6 text-center [&_p]:mb-3 [&_p]:mt-0 [&_p]:text-text-muted',
  'has-file':
    '[&_.document-upload-card]:border-primary [&_.document-upload-card]:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))]',
  'is-spinning': '[&_.ant-spin-dot-item]:bg-primary',

  // Employee profile page
  'employee-profile':
    'gap-5 overflow-visible [&_.ant-spin-nested-loading]:grid [&_.ant-spin-nested-loading]:gap-6 [&_.ant-spin-nested-loading]:overflow-visible [&_.ant-spin-container]:grid [&_.ant-spin-container]:gap-6 [&_.ant-spin-container]:overflow-visible',
  'employee-profile-body': 'grid gap-6',
  'employee-profile-crumb':
    'flex items-center gap-2 text-[0.84rem] text-text-muted [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline',
  'employee-profile-hero':
    'flex items-start justify-between gap-7 rounded-[20px] border border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))_0%,var(--color-surface)_52%),var(--color-surface)] px-8 py-7 shadow-soft max-[720px]:flex-col',
  'employee-profile-hero-main': 'flex min-w-0 gap-[22px] max-[720px]:flex-col',
  'employee-profile-photo-picker': 'relative shrink-0',
  'employee-profile-photo-button': 'relative m-0 block cursor-pointer [&_.photo-camera-badge]:right-[-4px] [&_.photo-camera-badge]:bottom-[-2px] [&_.photo-camera-badge]:h-8 [&_.photo-camera-badge]:w-8',
  'employee-profile-photo-frame': 'relative block h-24 w-24 overflow-hidden rounded-[28px]',
  'employee-profile-photo':
    'grid h-24 w-24 shrink-0 place-items-center rounded-[28px] border-[3px] border-surface bg-[var(--avatar-bg)] text-[1.7rem] font-bold text-[var(--avatar-fg)] object-cover shadow-[0_8px_20px_rgba(18,32,51,0.08)]',
  'employee-profile-identity':
    'min-w-0 [&_h1]:my-1.5 [&_h1]:text-[1.7rem] [&_h1]:leading-tight [&_h1]:tracking-[-0.03em] [&_p]:mb-4 [&_p]:mt-0 [&_p]:text-text-muted',
  'employee-profile-kicker':
    'text-[0.78rem] font-bold tracking-[0.04em] text-text-muted uppercase',
  'employee-profile-pills': 'flex flex-wrap gap-2.5',
  'employee-profile-type':
    'bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-primary',
  'employee-profile-hero-actions': 'flex flex-wrap justify-end gap-2.5',
  'employee-profile-stats':
    'grid grid-cols-1 gap-4 min-[1101px]:grid-cols-4 [&_article]:flex [&_article]:items-start [&_article]:gap-3.5 [&_article]:rounded-2xl [&_article]:border [&_article]:border-border [&_article]:bg-surface [&_article]:px-5 [&_article]:py-[18px] [&_article]:shadow-soft [&_article_svg]:mt-0.5 [&_article_svg]:text-primary [&_span]:block [&_span]:text-[0.75rem] [&_span]:text-text-muted [&_strong]:mt-1.5 [&_strong]:block [&_strong]:text-[0.95rem] [&_a]:text-inherit [&_a]:no-underline hover:[&_a]:text-primary hover:[&_a]:underline',
  'employee-profile-layout':
    'grid grid-cols-1 items-start gap-x-8 gap-y-5 min-[1101px]:grid-cols-[220px_minmax(0,1fr)]',
  'employee-profile-aside':
    'sticky top-4 z-6 grid items-start gap-4 self-start max-[1100px]:top-3 max-[1100px]:bg-page-bg max-[1100px]:pb-1 max-[960px]:top-[72px]',
  'employee-profile-nav':
    'grid gap-1.5 rounded-2xl border border-border bg-surface p-2.5 shadow-soft max-[1100px]:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] [&_button]:flex [&_button]:w-full [&_button]:cursor-pointer [&_button]:items-center [&_button]:gap-2.5 [&_button]:rounded-[10px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-left [&_button]:font-[inherit] [&_button]:text-text',
  'employee-profile-aside-card':
    'rounded-2xl border border-border bg-surface p-4 [&_h4]:mb-3.5 [&_h4]:mt-0 [&_h4]:text-[0.86rem] [&_p]:mb-3 [&_p]:mt-0 [&_p]:flex [&_p]:items-start [&_p]:gap-2.5 [&_p]:text-[0.84rem] [&_p]:text-text-muted [&_p:last-child]:mb-0 [&_a]:text-inherit [&_a]:no-underline hover:[&_a]:text-primary',
  'employee-profile-main': 'grid gap-5',
  'employee-profile-card':
    'scroll-mt-4 rounded-2xl border border-border bg-surface px-6 py-[22px] shadow-soft [&_header]:mb-5 [&_header]:flex [&_header]:items-center [&_header]:gap-3 [&_h3]:m-0 [&_h3]:text-base',
  'employee-profile-card-icon':
    'grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary',
  'employee-profile-hint': 'font-medium text-text-muted',
  'employee-profile-empty': 'm-0 text-text-muted',
  'employee-profile-docs':
    'm-0 grid list-none gap-3 p-0 [&_li]:flex [&_li]:items-center [&_li]:justify-between [&_li]:gap-3 [&_li]:rounded-xl [&_li]:border [&_li]:border-border-subtle [&_li]:bg-[color-mix(in_srgb,var(--color-page-bg)_70%,var(--color-surface))] [&_li]:px-3.5 [&_li]:py-3 max-[720px]:[&_li]:grid [&_strong]:block [&_span]:block [&_span]:text-[0.8rem] [&_span]:text-text-muted',
  'employee-profile-doc-link':
    'inline-flex shrink-0 items-center gap-1.5 font-[650] text-primary no-underline',
  'employee-profile-meta': 'm-0 text-[0.8rem] text-text-muted',
  'employee-profile-placeholder': 'min-h-[420px]',

  // stat color variants used as standalone tokens
  'is-purple': 'bg-[#f3efff] text-[#6d4ee8] dark:bg-[rgba(122,90,248,0.14)]',
  'is-orange': 'bg-[#fff3e8] text-[#d46b08] dark:bg-[rgba(212,107,8,0.16)]',
}

// History event/dot color helpers that conflict with generic is-* — special tokens
const HISTORY_EVENT_COLORS = {
  'is-updated': 'border-transparent bg-[color-mix(in_srgb,#2f6fed_8%,transparent)] [&_.md-history-dot]:bg-[#2f6fed]',
  'is-created': '[&_.md-history-dot]:bg-[#17824b]',
  'is-status': '[&_.md-history-dot]:bg-[#d46b08]',
  'is-assigned': '[&_.md-history-dot]:bg-[#4f5de4]',
  'is-deleted': '[&_.md-history-dot]:bg-[#b42318]',
}

const files = [
  'pages/ComingSoon.tsx',
  'pages/Account.tsx',
  'pages/Profile.tsx',
  'pages/Roles.tsx',
  'pages/Users.tsx',
  'pages/MasterDataItems.tsx',
  'pages/Employees.tsx',
  'pages/EmployeeCreate.tsx',
  'pages/EmployeeProfile.tsx',
  'pages/AuditLogs.tsx',
  'pages/ActivityHistory.tsx',
  'components/RowActionMenu.tsx',
  'routes/PermissionRoute.tsx',
]

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function resolveToken(token, ctx) {
  if (SHARED[token]) return { kind: 'shared', name: SHARED[token] }
  if (ctx === 'history-event' && HISTORY_EVENT_COLORS[token]) {
    return { kind: 'inline', value: HISTORY_EVENT_COLORS[token] }
  }
  if (INLINE[token] !== undefined) return { kind: 'inline', value: INLINE[token] }
  return null
}

function convertClassString(raw, usedShared, ctxHints = {}) {
  // Split preserving ${...} expressions as atomic tokens
  const parts = []
  let i = 0
  while (i < raw.length) {
    if (raw[i] === '$' && raw[i + 1] === '{') {
      let depth = 0
      let j = i
      for (; j < raw.length; j++) {
        if (raw[j] === '{') depth++
        else if (raw[j] === '}') {
          depth--
          if (depth === 0) {
            j++
            break
          }
        }
      }
      parts.push({ type: 'expr', value: raw.slice(i, j) })
      i = j
      continue
    }
    // read whitespace-separated token
    if (/\s/.test(raw[i])) {
      let j = i
      while (j < raw.length && /\s/.test(raw[j])) j++
      parts.push({ type: 'space', value: raw.slice(i, j) })
      i = j
      continue
    }
    let j = i
    while (j < raw.length && !/\s/.test(raw[j]) && !(raw[j] === '$' && raw[j + 1] === '{')) j++
    parts.push({ type: 'token', value: raw.slice(i, j) })
    i = j
  }

  const out = []
  let needsTemplate = raw.includes('${')
  let usesExpr = false

  for (const part of parts) {
    if (part.type === 'space') {
      out.push(part.value)
      continue
    }
    if (part.type === 'expr') {
      // Special-case known dynamic patterns
      let expr = part.value
      // status-pill status-${x} — leave status- handled separately; rewrite status-${}
      expr = expr.replace(
        /status-\$\{([^}]+)\}/g,
        (_, inner) => `\${({active:'${INLINE['status-active']}',inactive:'${INLINE['status-inactive']}',suspended:'${INLINE['status-suspended']}'})[String(${inner}).toLowerCase()]||'${INLINE['status-inactive']}'}`,
      )
      expr = expr.replace(
        /crm-access-\$\{([^}]+)\}/g,
        (_, inner) => `\${String(${inner}).toLowerCase()==='enabled'?'${INLINE['crm-access-enabled']}':'${INLINE['crm-access-disabled']}'}`,
      )
      expr = expr.replace(
        /app-toast-\$\{([^}]+)\}/g,
        (_, inner) => `\${${inner}==='success'?'${SHARED['app-toast-success'] ? '' : ''}'+''}`,
      )
      // Better app-toast handling done at call site
      out.push(expr)
      usesExpr = true
      needsTemplate = true
      continue
    }

    const token = part.value
    // Skip ui-* / ant-* / sr-only / safePage / tone-* / action-* / modal-actions already Tailwind
    if (
      token.startsWith('ui-') ||
      token.startsWith('ant-') ||
      token === 'sr-only' ||
      token === 'safePage' ||
      token.startsWith('tone-') ||
      token.startsWith('action-') ||
      token === 'modal-actions' ||
      token.startsWith('ah-') ||
      token.startsWith('audit-') ||
      token.startsWith('dash-') ||
      token.startsWith('lead-')
    ) {
      out.push(token)
      continue
    }

    let ctx = 'default'
    if (ctxHints.historyEvent) ctx = 'history-event'

    const resolved = resolveToken(token, ctx)
    if (!resolved) {
      out.push(token)
      continue
    }
    if (resolved.kind === 'shared') {
      usedShared.add(resolved.name)
      out.push(`\${${resolved.name}}`)
      needsTemplate = true
      usesExpr = true
    } else if (resolved.value) {
      out.push(resolved.value)
    }
  }

  const joined = out.join('').replace(/\s+/g, ' ').trim()
  return { classValue: joined, needsTemplate: needsTemplate || usesExpr, usesExpr }
}

function processFile(rel) {
  const filePath = path.join(root, rel)
  if (!fs.existsSync(filePath)) {
    console.warn('skip missing', rel)
    return
  }
  let src = fs.readFileSync(filePath, 'utf8')
  const usedShared = new Set()
  const importDepth = rel.startsWith('pages/') ? '..' : rel.startsWith('components/') || rel.startsWith('routes/') ? '..' : '..'

  // Remove admin.css import
  src = src.replace(/\r?\n?import\s+['"]\.\/admin\.css['"]\s*;?\r?\n?/g, '\n')
  src = src.replace(/\r?\n?import\s+['"]\.\.\/pages\/admin\.css['"]\s*;?\r?\n?/g, '\n')

  // Special rewrites for known dynamic patterns before general conversion
  src = src.replace(
    /className=\{required \? 'field-label is-required' : 'field-label'\}/g,
    () => {
      usedShared.add('fieldLabelClass')
      return 'className={fieldLabelClass(required)}'
    },
  )
  src = src.replace(
    /className=\{`status-pill status-\$\{([^}]+)\}`\}/g,
    (_, inner) => {
      usedShared.add('userStatusPillClass')
      return `className={userStatusPillClass(${inner})}`
    },
  )
  src = src.replace(
    /className=\{`status-pill crm-access-\$\{([^}]+)\}`\}/g,
    (_, inner) => {
      usedShared.add('crmAccessPillClass')
      return `className={crmAccessPillClass(${inner})}`
    },
  )
  src = src.replace(
    /className=\{`status-pill \$\{statusClass\(([^)]+)\)\}`\}/g,
    (_, inner) => {
      usedShared.add('employmentStatusPillClass')
      return `className={employmentStatusPillClass(${inner})}`
    },
  )
  src = src.replace(
    /className=\{`app-toast app-toast-\$\{([^}]+)\}`\}/g,
    (_, inner) => {
      usedShared.add('appToastClass')
      return `className={appToastClass(${inner})}`
    },
  )
  src = src.replace(
    /className="status-pill employee-profile-type"/g,
    () => {
      usedShared.add('statusPill')
      return `className={\`\${statusPill} ${INLINE['employee-profile-type']}\`}`
    },
  )

  // user-view-nav button active pattern
  src = src.replace(
    /className=\{viewTab === tab\.id \? 'is-active' : undefined\}/g,
    `className={viewTab === tab.id ? '${INLINE['user-view-nav-btn-active']}' : '${INLINE['user-view-nav-btn-idle']}'}`,
  )

  // Convert className="..." and className={'...'} and className={`...`}
  function replaceAttr(match, quote, content) {
    // Skip if already mostly Tailwind (has flex/grid/bg- etc and no kebab admin classes)
    const { classValue, needsTemplate } = convertClassString(content, usedShared)
    if (!classValue) return match
    // If nothing changed meaningfully and no shared used from this call... still may have replaced
    if (classValue === content.trim() && !content.split(/\s+/).some((t) => SHARED[t] || INLINE[t] !== undefined)) {
      return match
    }
    if (needsTemplate || classValue.includes('${')) {
      return `className={\`${classValue}\`}`
    }
    // Prefer constant expression when single shared const
    const onlyShared = [...usedShared].length && classValue.match(/^\$\{(\w+)\}$/)
    if (onlyShared) {
      return `className={${onlyShared[1]}}`
    }
    // Multiple ${const} only
    if (/^(\$\{\w+\}(\s+\$\{\w+\})*)$/.test(classValue)) {
      const names = [...classValue.matchAll(/\$\{(\w+)\}/g)].map((m) => m[1])
      if (names.length === 1) return `className={${names[0]}}`
      return `className={[${names.join(', ')}].join(' ')}`
    }
    if (classValue.includes('${')) {
      return `className={\`${classValue}\`}`
    }
    return `className="${classValue}"`
  }

  src = src.replace(/className=(["'`])([\s\S]*?)\1/g, (match, quote, content) => {
    // Only process if looks like it contains admin-era classes
    const tokens = content.split(/[\s${}]+/).filter(Boolean)
    const relevant = tokens.some(
      (t) =>
        SHARED[t] ||
        INLINE[t] !== undefined ||
        t.startsWith('user-view-') ||
        t.startsWith('md-') ||
        t.startsWith('employee-') ||
        t.startsWith('photo-') ||
        t.startsWith('document-') ||
        t.startsWith('form-') ||
        t.startsWith('status-') ||
        t.startsWith('crm-') ||
        t.startsWith('admin-') ||
        t.startsWith('modal-') ||
        t.startsWith('matrix') ||
        t.startsWith('account-') ||
        t.startsWith('session-') ||
        t.startsWith('scope-') ||
        t.startsWith('field-') ||
        t.startsWith('row-') ||
        t.startsWith('app-toast') ||
        t === 'muted' ||
        t === 'table-wrap' ||
        t === 'link-btn' ||
        t === 'toggle-row' ||
        t === 'address-row' ||
        t === 'section-errors' ||
        t === 'activity-list',
    )
    if (!relevant && !content.includes('status-') && !content.includes('crm-access-') && !content.includes('app-toast-')) {
      return match
    }
    return replaceAttr(match, quote, content)
  })

  // employee-profile-nav active buttons
  src = src.replace(
    /className=\{activeSection === section\.id \? 'is-active' : undefined\}/g,
    `className={activeSection === section.id ? 'bg-nav-active-bg text-nav-active' : 'hover:bg-hover-bg'}`,
  )

  // Fix RowActionMenu danger class
  if (rel.includes('RowActionMenu')) {
    usedShared.add('rowActionBtn')
    usedShared.add('rowActionMenu')
    usedShared.add('rowActionMenuItem')
    usedShared.add('rowActionMenuItemDanger')
  }

  // Inject import
  if (usedShared.size > 0) {
    const names = [...usedShared].sort()
    const importLine = `import { ${names.join(', ')} } from '${importDepth}/styles/admin'\n`
    if (!src.includes('/styles/admin')) {
      // after last import
      const importBlock = src.match(/^(?:import[\s\S]*?;\r?\n)+/)
      if (importBlock) {
        src = src.replace(importBlock[0], importBlock[0] + importLine)
      } else {
        src = importLine + src
      }
    } else {
      // merge into existing
      src = src.replace(
        /import\s*\{([^}]+)\}\s*from\s*['"][^'"]*styles\/admin['"]/,
        (m, inner) => {
          const existing = inner.split(',').map((s) => s.trim()).filter(Boolean)
          const merged = [...new Set([...existing, ...names])].sort()
          return `import { ${merged.join(', ')} } from '${importDepth}/styles/admin'`
        },
      )
    }
  }

  // Remove unused statusClass if employmentStatusPillClass replaced it in EmployeeProfile
  if (rel.includes('EmployeeProfile')) {
    src = src.replace(
      /function statusClass\(code\?: string \| null\) \{\r?\n\s*return `status-\$\{\(code \|\| 'inactive'\)\.toLowerCase\(\)\.replaceAll\('_', '-'\)\}`\r?\n\}\r?\n\r?\n/,
      '',
    )
  }

  fs.writeFileSync(filePath, src)
  console.log('converted', rel, 'shared:', [...usedShared].join(', ') || '(none)')
}

for (const f of files) processFile(f)
console.log('done')
