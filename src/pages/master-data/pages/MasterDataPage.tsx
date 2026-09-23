import { Navigate } from 'react-router-dom'
import { MASTER_DATA_DEFAULT_PATH } from '../../../config/masterData'

export default function MasterDataPage() {
  return <Navigate to={MASTER_DATA_DEFAULT_PATH} replace />
}
