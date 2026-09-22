import fs from 'node:fs'

const files = [
  'src/pages/Users.tsx',
  'src/pages/MasterDataItems.tsx',
  'src/pages/EmployeeCreate.tsx',
  'src/pages/EmployeeProfile.tsx',
  'src/pages/Employees.tsx',
  'src/pages/Roles.tsx',
  'src/components/RowActionMenu.tsx',
]

const suspicious =
  /\b(admin-[\w-]+|modal-(?:backdrop|panel|header|close|extra)|form-actions|field-label|status-pill|app-toast|row-actions|table-wrap|user-view-[\w-]+|employee-[\w-]+|md-[\w-]+|photo-[\w-]+|document-[\w-]+|form-field|form-section|section-errors|account-summary|toggle-row|address-row|scope-grid|session-row|matrix(?:-[\w]+)?|link-btn|status-confirm-[\w-]+|is-(?:active|danger|uploading|invalid|updated|selected|add|blue|green|role|dept)|crm-access-[\w-]+)\b/

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8')
  const lines = text.split(/\r?\n/)
  console.log(`\n===${f}===`)
  let count = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.includes('className') && !line.includes('querySelector')) continue
    if (suspicious.test(line) || /modal-panel|user-view-|md-history|photo-upload|admin-card|admin-form|is-uploading|is-invalid|is-danger|is-active/.test(line)) {
      console.log(`${i + 1}: ${line.trim().slice(0, 160)}`)
      count++
    }
  }
  if (!count) console.log('(none)')
}
