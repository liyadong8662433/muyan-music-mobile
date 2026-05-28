import { useCallback } from 'react'
import { pop } from '@/navigation'
import commonState from '@/store/common/state'
import Btn from './Btn'
import { setNavActiveId } from '@/core/common'

export default () => {
  const handlePlaylist = useCallback(() => {
    setNavActiveId('nav_playlist')
    void pop(commonState.componentIds.playDetail!)
  }, [])

  return (
    <Btn icon="menu" onPress={handlePlaylist} />
  )
}
