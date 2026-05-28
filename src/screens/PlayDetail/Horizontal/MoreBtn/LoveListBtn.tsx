import { useCallback } from 'react'
import Btn from './Btn'

export default () => {
  const handleClick = useCallback(() => {
    global.app_event.emit('toggleLoveListInDetail')
  }, [])

  return (
    <Btn icon="love" onPress={handleClick} />
  )
}
