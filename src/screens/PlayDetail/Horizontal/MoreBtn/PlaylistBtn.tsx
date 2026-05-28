import { useCallback } from 'react'
import Btn from './Btn'

export default () => {
  const handlePlaylist = useCallback(() => {
    global.app_event.emit('togglePlaylistInDetail')
  }, [])

  return (
    <Btn icon="menu" onPress={handlePlaylist} />
  )
}
