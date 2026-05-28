import { useState, useEffect, useCallback } from 'react'
import playerState from '@/store/player/state'
import { addListMusics, removeListMusics, getListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'
import Btn from './Btn'

export default () => {
  const [isLoved, setIsLoved] = useState(false)

  const checkLoved = useCallback(() => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) {
      setIsLoved(false)
      return
    }
    const info = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
    void getListMusics(LIST_IDS.LOVE).then(list => {
      setIsLoved(list.some(item => item.id === info.id))
    })
  }, [])

  useEffect(() => {
    checkLoved()
    const handleUpdate = () => checkLoved()
    global.state_event.on('playMusicInfoChanged', handleUpdate)
    global.state_event.on('mylistUpdated', handleUpdate)
    return () => {
      global.state_event.off('playMusicInfoChanged', handleUpdate)
      global.state_event.off('mylistUpdated', handleUpdate)
    }
  }, [checkLoved])

  const handleToggleLove = useCallback(() => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    const info = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
    if (isLoved) {
      void removeListMusics(LIST_IDS.LOVE, [info.id]).then(() => {
        setIsLoved(false)
        toast('已取消收藏')
      })
    } else {
      void addListMusics(LIST_IDS.LOVE, [info], 'top').then(() => {
        setIsLoved(true)
        toast(global.i18n.t('list_edit_action_tip_add_success'))
      })
    }
  }, [isLoved])

  return (
    <Btn icon="love" color={isLoved ? 'rgb(255,18,34)' : undefined} onPress={handleToggleLove} />
  )
}
